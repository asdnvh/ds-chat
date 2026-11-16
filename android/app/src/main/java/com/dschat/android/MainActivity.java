package com.dschat.android;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 应用唯一界面：一个承载 dist 网页应用的 WebView 宿主。
 *
 * <p>网页通过 {@link AssetServer} 以 https://appassets.androidplatform.net/ 的地址加载，
 * 因此拥有完整的安全上下文能力；对外只放行 api.deepseek.com 的网络请求，其它外链交给
 * 系统浏览器打开，避免用户离开应用界面。
 */
public class MainActivity extends Activity {

    private static final String TAG = "DSChatApp";
    private static final String JS_LOG_TAG = "DSChatWeb";
    private static final int REQUEST_FILE_CHOOSER = 1001;
    private static final int REQUEST_AUDIO_PERMISSION = 1002;
    private static final long EXIT_CONFIRM_INTERVAL_MS = 2000L;

    private FrameLayout root;
    private WebView webView;
    private AssetServer assetServer;
    private ValueCallback<Uri[]> filePathCallback;
    private PermissionRequest pendingAudioRequest;
    private boolean overlayOpen;
    private long lastBackPressedAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        assetServer = new AssetServer(getAssets());
        prepareWindow();
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        webView = createWebView();
        root.addView(
                webView,
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        applyWindowInsets();
        applyThemeColor(Color.WHITE);
        webView.loadUrl(AssetServer.ORIGIN + "/");
    }

    /** 边到边（Android 11+）或经典模式（Android 8-10）的窗口初始化。 */
    private void prepareWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // 内容延伸到状态栏/导航栏下面，由 applyWindowInsets() 用 padding 让出安全区域
            getWindow().setDecorFitsSystemWindows(false);
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getWindow().setStatusBarContrastEnforced(false);
                getWindow().setNavigationBarContrastEnforced(false);
            }
        }
    }

    private WebView createWebView() {
        WebView view = new WebView(this);
        view.setBackgroundColor(Color.WHITE);

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // 朗读等功能由用户点击触发；关闭手势限制可避免音频偶尔被策略拦截
        settings.setMediaPlaybackRequiresUserGesture(false);
        // 页面全部由 AssetServer 从 assets 提供，不需要 file:// 访问
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        // 原生应用式的固定缩放，避免双指缩放打乱移动端布局
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setUserAgentString(
                settings.getUserAgentString() + " DSChatAndroid/" + BuildConfig.VERSION_NAME);
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        view.addJavascriptInterface(new NativeBridge(this), "DSChatNative");
        view.setWebViewClient(new AppWebViewClient());
        view.setWebChromeClient(new AppWebChromeClient());
        view.setDownloadListener(
                (url, userAgent, contentDisposition, mimeType, contentLength) -> {
                    if (url == null) {
                        return;
                    }
                    if (url.startsWith("blob:") || url.startsWith("data:")) {
                        requestBlobSave(url, mimeType);
                    } else if (url.startsWith("http://") || url.startsWith("https://")) {
                        downloadWithManager(url, userAgent, contentDisposition, mimeType);
                    }
                });
        return view;
    }

    /** Android 11+ 用根布局 padding 让出状态栏、导航栏和输入法区域。 */
    private void applyWindowInsets() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            return;
        }
        root.setOnApplyWindowInsetsListener(
                (view, insets) -> {
                    android.graphics.Insets bars =
                            insets.getInsets(WindowInsets.Type.systemBars());
                    android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                    int bottom = Math.max(bars.bottom, ime.bottom);
                    if (view.getPaddingTop() != bars.top || view.getPaddingBottom() != bottom) {
                        view.setPadding(0, bars.top, 0, bottom);
                    }
                    return insets;
                });
        root.requestApplyInsets();
    }

    // ---------------------------------------------------------------------
    // 页面客户端：asset 资源拦截、站内/站外导航区分、页面脚本注入
    // ---------------------------------------------------------------------
    private final class AppWebViewClient extends WebViewClient {

        @Override
        public WebResourceResponse shouldInterceptRequest(
                WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri != null && AssetServer.HOST.equals(uri.getHost())) {
                return assetServer.respond(uri);
            }
            return null;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) {
                return false;
            }
            if (isInternalUrl(uri)) {
                return false;
            }
            openExternal(uri);
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            injectPageScript(view);
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            Log.e(TAG, "WebView 渲染进程结束，didCrash=" + detail.didCrash());
            root.removeView(view);
            view.destroy();
            webView = createWebView();
            root.addView(
                    webView,
                    new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT));
            applyWindowInsets();
            webView.loadUrl(AssetServer.ORIGIN + "/");
            return true;
        }

        @Override
        public void onReceivedError(
                WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                Log.e(TAG, "主页面加载失败：" + error.getErrorCode() + " " + error.getDescription());
                showToast("页面加载失败：" + error.getDescription());
            }
        }
    }

    // ---------------------------------------------------------------------
    // 浏览器客户端：文件选择、麦克风授权、外部窗口（target=_blank）拦截、JS 对话框
    // ---------------------------------------------------------------------
    private final class AppWebChromeClient extends WebChromeClient {

        @Override
        public boolean onConsoleMessage(ConsoleMessage message) {
            String text =
                    message.message()
                            + " ("
                            + message.sourceId()
                            + ":"
                            + message.lineNumber()
                            + ")";
            switch (message.messageLevel()) {
                case ERROR:
                    Log.e(JS_LOG_TAG, text);
                    break;
                case WARNING:
                    Log.w(JS_LOG_TAG, text);
                    break;
                default:
                    Log.i(JS_LOG_TAG, text);
                    break;
            }
            return true;
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(() -> handlePermissionRequest(request));
        }

        @Override
        public boolean onShowFileChooser(
                WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;

            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.putExtra(
                    Intent.EXTRA_ALLOW_MULTIPLE,
                    params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);

            List<String> mimeTypes = new ArrayList<>();
            String[] acceptTypes = params.getAcceptTypes();
            if (acceptTypes != null) {
                for (String acceptType : acceptTypes) {
                    if (acceptType == null) {
                        continue;
                    }
                    String trimmed = acceptType.trim();
                    if (trimmed.contains("/") && !mimeTypes.contains(trimmed)) {
                        mimeTypes.add(trimmed);
                    }
                }
            }
            if (mimeTypes.isEmpty()) {
                intent.setType("*/*");
            } else {
                intent.setType(mimeTypes.get(0));
                intent.putExtra(
                        Intent.EXTRA_MIME_TYPES, mimeTypes.toArray(new String[0]));
            }
            try {
                startActivityForResult(intent, REQUEST_FILE_CHOOSER);
            } catch (ActivityNotFoundException e) {
                filePathCallback = null;
                callback.onReceiveValue(null);
                return false;
            }
            return true;
        }

        @Override
        public boolean onCreateWindow(
                WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            if (!(resultMsg.obj instanceof WebView.WebViewTransport)) {
                return false;
            }
            final WebView popup = new WebView(MainActivity.this);
            popup.setVisibility(View.INVISIBLE);
            popup.setLayoutParams(new FrameLayout.LayoutParams(1, 1));
            root.addView(popup);

            popup.setWebViewClient(
                    new WebViewClient() {
                        private boolean handled;

                        private void handle(Uri uri) {
                            if (handled || uri == null) {
                                return;
                            }
                            String scheme =
                                    uri.getScheme() == null
                                            ? ""
                                            : uri.getScheme().toLowerCase(Locale.ROOT);
                            // about:blank 等中间页不算目标地址，等真正的导航
                            if (scheme.isEmpty()
                                    || "about".equals(scheme)
                                    || "javascript".equals(scheme)) {
                                return;
                            }
                            handled = true;
                            handleNewWindowUrl(uri);
                            destroyPopup(popup);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(
                                WebView v, WebResourceRequest request) {
                            handle(request.getUrl());
                            return true;
                        }

                        @Override
                        public void onPageStarted(WebView v, String url, Bitmap favicon) {
                            handle(Uri.parse(url));
                        }

                        @Override
                        public void onReceivedError(
                                WebView v, WebResourceRequest request, WebResourceError error) {
                            destroyPopup(popup);
                        }
                    });

            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public boolean onJsAlert(
                WebView view, String url, String message, final JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                    .setOnCancelListener(dialog -> result.cancel())
                    .show();
            return true;
        }

        @Override
        public boolean onJsConfirm(
                WebView view, String url, String message, final JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                    .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel())
                    .show();
            return true;
        }

        @Override
        public boolean onJsPrompt(
                WebView view,
                String url,
                String message,
                String defaultValue,
                final JsPromptResult result) {
            final EditText input = new EditText(MainActivity.this);
            input.setText(defaultValue == null ? "" : defaultValue);
            new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setView(input)
                    .setPositiveButton(
                            android.R.string.ok,
                            (dialog, which) -> result.confirm(input.getText().toString()))
                    .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel())
                    .show();
            return true;
        }
    }

    private void handlePermissionRequest(PermissionRequest request) {
        boolean wantsAudio = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                wantsAudio = true;
                break;
            }
        }
        if (!wantsAudio) {
            request.deny();
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[] {PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            return;
        }
        if (pendingAudioRequest != null) {
            pendingAudioRequest.deny();
        }
        pendingAudioRequest = request;
        requestPermissions(
                new String[] {Manifest.permission.RECORD_AUDIO}, REQUEST_AUDIO_PERMISSION);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_AUDIO_PERMISSION) {
            return;
        }
        PermissionRequest request = pendingAudioRequest;
        pendingAudioRequest = null;
        if (request == null) {
            return;
        }
        boolean granted =
                grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (granted) {
            request.grant(new String[] {PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            request.deny();
            showToast("未授予麦克风权限，无法使用语音输入");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_FILE_CHOOSER) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        Uri[] results = resultCode == RESULT_OK ? parseChooserResult(data) : null;
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    private static Uri[] parseChooserResult(Intent data) {
        if (data == null) {
            return null;
        }
        ClipData clipData = data.getClipData();
        if (clipData != null) {
            Uri[] uris = new Uri[clipData.getItemCount()];
            for (int i = 0; i < clipData.getItemCount(); i++) {
                uris[i] = clipData.getItemAt(i).getUri();
            }
            return uris;
        }
        Uri single = data.getData();
        return single == null ? null : new Uri[] {single};
    }

    // ---------------------------------------------------------------------
    // 链接 / 弹窗 / 下载处理
    // ---------------------------------------------------------------------
    private static boolean isInternalUrl(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme())
                && AssetServer.HOST.equals(uri.getHost());
    }

    private void handleNewWindowUrl(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if ("blob".equals(scheme) || "data".equals(scheme)) {
            requestBlobSave(uri.toString(), "");
            return;
        }
        if (isInternalUrl(uri)) {
            webView.loadUrl(uri.toString());
            return;
        }
        openExternal(uri);
    }

    private void destroyPopup(final WebView popup) {
        popup.post(
                () -> {
                    try {
                        root.removeView(popup);
                        popup.destroy();
                    } catch (RuntimeException e) {
                        Log.w(TAG, "销毁弹窗 WebView 失败", e);
                    }
                });
    }

    private void openExternal(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        Intent intent;
        if ("intent".equals(scheme)) {
            try {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
            } catch (Exception e) {
                Log.w(TAG, "无法解析 intent 链接：" + uri, e);
                return;
            }
        } else {
            intent = new Intent(Intent.ACTION_VIEW, uri);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            showToast("没有可以打开该链接的应用");
        }
    }

    /** 让网页把 blob: / data: URL 的内容转成 base64 交给原生保存。 */
    private void requestBlobSave(String url, String mimeType) {
        String fallbackName = defaultFileName(mimeType, "zip");
        String script =
                "(function(){try{fetch("
                        + jsString(url)
                        + ").then(function(r){return r.blob()}).then(function(b){"
                        + "var fr=new FileReader();fr.onload=function(){var s=String(fr.result);"
                        + "var i=s.indexOf(',');window.DSChatNative.saveDownload("
                        + "s.slice(i+1),b.type||"
                        + jsString(mimeType == null ? "" : mimeType)
                        + ",window.__dsChatDownloadName||"
                        + jsString(fallbackName)
                        + ");};fr.readAsDataURL(b);});}catch(e){}})()";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void downloadWithManager(
            String url, String userAgent, String contentDisposition, String mimeType) {
        try {
            String name = defaultFileName(mimeType, "zip");
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.addRequestHeader("User-Agent", userAgent);
            request.setMimeType(mimeType);
            request.setTitle(name);
            request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS, "DSChat/" + name);
            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (manager == null) {
                throw new IllegalStateException("DownloadManager 不可用");
            }
            manager.enqueue(request);
            showToast("已开始下载：" + name);
        } catch (Exception e) {
            Log.e(TAG, "下载失败", e);
            showToast("下载失败：" + e.getMessage());
        }
    }

    private static String defaultFileName(String mimeType, String fallbackExtension) {
        String extension = fallbackExtension;
        if (mimeType != null) {
            String lower = mimeType.toLowerCase(Locale.ROOT);
            if (lower.contains("zip")) {
                extension = "zip";
            } else if (lower.contains("png")) {
                extension = "png";
            } else if (lower.contains("jpeg") || lower.contains("jpg")) {
                extension = "jpg";
            } else if (lower.contains("webp")) {
                extension = "webp";
            } else if (lower.contains("gif")) {
                extension = "gif";
            } else if (lower.contains("pdf")) {
                extension = "pdf";
            } else if (lower.contains("wav")) {
                extension = "wav";
            } else if (lower.contains("mpeg") || lower.contains("mp3")) {
                extension = "mp3";
            }
        }
        String stamp = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new Date());
        return "chat-demo-" + stamp + "." + extension;
    }

    // ---------------------------------------------------------------------
    // 原生桥接入口（由 NativeBridge 调用，可能运行在 JavaBridge 线程）
    // ---------------------------------------------------------------------
    void handleBlobDownload(String base64, String mimeType, String fileName) {
        try {
            if (base64 == null || base64.isEmpty()) {
                throw new IllegalArgumentException("文件内容为空");
            }
            String mime =
                    (mimeType == null || mimeType.isEmpty())
                            ? "application/octet-stream"
                            : mimeType;
            byte[] data = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
            String message = DownloadStore.save(this, data, mime, fileName);
            Log.i(TAG, message);
            showToast(message);
        } catch (Exception e) {
            Log.e(TAG, "保存网页下载内容失败", e);
            showToast("保存文件失败：" + e.getMessage());
        }
    }

    void handleThemeColor(String color) {
        if (color == null || color.isEmpty()) {
            return;
        }
        final int parsed;
        try {
            parsed = Color.parseColor(color.trim()) | 0xFF000000;
        } catch (IllegalArgumentException e) {
            return;
        }
        applyThemeColor(parsed);
    }

    void setOverlayOpen(boolean open) {
        overlayOpen = open;
    }

    void showToast(final String message) {
        if (message == null) {
            return;
        }
        runOnUiThread(
                () -> {
                    try {
                        Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                    } catch (RuntimeException ignored) {
                        // 页面销毁过程中忽略
                    }
                });
    }

    /** 同步根布局背景色（状态栏/导航栏区域）与系统栏图标明暗。 */
    private void applyThemeColor(final int color) {
        runOnUiThread(
                () -> {
                    if (root != null) {
                        root.setBackgroundColor(color);
                    }
                    boolean lightBackground = isLightColor(color);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        WindowInsetsController controller = getWindow().getInsetsController();
                        if (controller != null) {
                            int mask =
                                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                            | WindowInsetsController
                                                    .APPEARANCE_LIGHT_NAVIGATION_BARS;
                            controller.setSystemBarsAppearance(lightBackground ? mask : 0, mask);
                        }
                    } else {
                        int flags = 0;
                        if (lightBackground) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                            }
                        }
                        getWindow().getDecorView().setSystemUiVisibility(flags);
                        getWindow().setStatusBarColor(color);
                        getWindow().setNavigationBarColor(color);
                    }
                });
    }

    private static boolean isLightColor(int color) {
        double luminance =
                (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color))
                        / 255.0;
        return luminance > 0.5;
    }

    private void injectPageScript(WebView view) {
        try (InputStream input = getAssets().open("inject.js")) {
            String script = readText(input);
            view.evaluateJavascript(script, null);
        } catch (IOException e) {
            Log.w(TAG, "注入页面脚本失败", e);
        }
    }

    private static String readText(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = input.read(buffer)) != -1) {
            output.write(buffer, 0, read);
        }
        return output.toString(StandardCharsets.UTF_8.name());
    }

    private static String jsString(String value) {
        if (value == null) {
            return "\"\"";
        }
        StringBuilder builder = new StringBuilder(value.length() + 2);
        builder.append('"');
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            switch (ch) {
                case '"':
                    builder.append("\\\"");
                    break;
                case '\\':
                    builder.append("\\\\");
                    break;
                case '\n':
                    builder.append("\\n");
                    break;
                case '\r':
                    builder.append("\\r");
                    break;
                case '\t':
                    builder.append("\\t");
                    break;
                case '<':
                    builder.append("\\u003c");
                    break;
                default:
                    builder.append(ch);
                    break;
            }
        }
        builder.append('"');
        return builder.toString();
    }

    // ---------------------------------------------------------------------
    // 生命周期
    // ---------------------------------------------------------------------
    @Override
    public void onBackPressed() {
        if (overlayOpen) {
            overlayOpen = false;
            if (webView != null) {
                webView.evaluateJavascript(
                        "window.__dsChatCloseOverlay && window.__dsChatCloseOverlay()", null);
            }
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBackPressedAt < EXIT_CONFIRM_INTERVAL_MS) {
            super.onBackPressed();
            return;
        }
        lastBackPressedAt = now;
        showToast("再按一次返回键退出");
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
