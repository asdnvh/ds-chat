package com.dschat.android;

import android.util.Log;
import android.webkit.JavascriptInterface;

/**
 * 注入到网页中的原生桥接对象（window.DSChatNative）。
 *
 * <p>注意：JavascriptInterface 方法运行在 WebView 的 JavaBridge 后台线程，不阻塞 UI。
 * 由于 WebView 只加载 APK 内置页面、外链一律交给系统浏览器，这个桥接对象只会暴露给
 * 我们自己的页面代码。
 */
final class NativeBridge {

    private final MainActivity activity;

    NativeBridge(MainActivity activity) {
        this.activity = activity;
    }

    /** 网页把 blob/data URL 的内容以 base64 交给原生保存到系统下载目录。 */
    @JavascriptInterface
    public void saveDownload(String base64, String mimeType, String fileName) {
        activity.handleBlobDownload(base64, mimeType, fileName);
    }

    /** 网页主题色变化时同步系统状态栏 / 导航栏颜色与图标明暗。 */
    @JavascriptInterface
    public void setThemeColor(String color) {
        activity.handleThemeColor(color);
    }

    /** 图片预览浮层开合状态，用于让返回键先关闭浮层。 */
    @JavascriptInterface
    public void setOverlayOpen(boolean open) {
        activity.setOverlayOpen(open);
    }

    /** 网页 console.log 汇总到 logcat，便于排查问题。 */
    @JavascriptInterface
    public void log(String message) {
        Log.i("DSChatWeb", String.valueOf(message));
    }

    /** 网页请求的原生 Toast。 */
    @JavascriptInterface
    public void toast(String message) {
        activity.showToast(String.valueOf(message));
    }

    /** 稍长的原生 Toast（导入历史对话等耗时操作的提示）。 */
    @JavascriptInterface
    public void openPdf(String base64, String fileName) {
        activity.openPdf(String.valueOf(base64), String.valueOf(fileName));
    }

    @JavascriptInterface
    public void openFile(String base64, String mimeType, String fileName) {
        activity.openFile(String.valueOf(base64), String.valueOf(mimeType), String.valueOf(fileName));
    }
    @JavascriptInterface
    public void shareFile(String base64, String mimeType, String fileName) {
        activity.shareFile(String.valueOf(base64), String.valueOf(mimeType), String.valueOf(fileName));
    }

    @JavascriptInterface
    public void saveImage(String url, String fileName) {
        activity.saveImage(String.valueOf(url), String.valueOf(fileName));
    }
    @JavascriptInterface
    public void toastLong(String message) {
        activity.showToastLong(String.valueOf(message));
    }
}
