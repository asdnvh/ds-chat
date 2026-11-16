package com.dschat.android;

import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 把 APK 内置的 dist 静态资源通过虚拟域名提供给 WebView。
 *
 * <p>页面地址是 https://appassets.androidplatform.net/，该域名不会真实联网，所有请求都在
 * {@link android.webkit.WebViewClient#shouldInterceptRequest} 中从 assets 读取。
 * 这样页面处于「安全上下文」（secure context），localStorage、IndexedDB、getUserMedia、
 * AudioContext 等能力与在 https 网站上一致，而 file:// 页面会因来源不透明而受限。
 */
final class AssetServer {

    /** 系统为 WebViewAssetLoader 保留的虚拟域名，这里自行实现同样的拦截逻辑。 */
    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;

    private static final Map<String, String> MIME_TYPES = new HashMap<>();

    static {
        MIME_TYPES.put("html", "text/html");
        MIME_TYPES.put("htm", "text/html");
        MIME_TYPES.put("js", "text/javascript");
        MIME_TYPES.put("mjs", "text/javascript");
        MIME_TYPES.put("css", "text/css");
        MIME_TYPES.put("json", "application/json");
        MIME_TYPES.put("map", "application/json");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("jpg", "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif", "image/gif");
        MIME_TYPES.put("webp", "image/webp");
        MIME_TYPES.put("ico", "image/x-icon");
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("woff2", "font/woff2");
        MIME_TYPES.put("ttf", "font/ttf");
        MIME_TYPES.put("otf", "font/otf");
        MIME_TYPES.put("mp3", "audio/mpeg");
        MIME_TYPES.put("wav", "audio/wav");
        MIME_TYPES.put("ogg", "audio/ogg");
        MIME_TYPES.put("wasm", "application/wasm");
        MIME_TYPES.put("txt", "text/plain");
        MIME_TYPES.put("md", "text/plain");
        MIME_TYPES.put("zip", "application/zip");
        MIME_TYPES.put("pdf", "application/pdf");
    }

    private final AssetManager assets;

    AssetServer(AssetManager assets) {
        this.assets = assets;
    }

    /** 根据请求 URL 从 assets 读取资源并构造响应；找不到时返回 404。 */
    WebResourceResponse respond(Uri uri) {
        String path = uri.getPath();
        if (path == null || path.isEmpty() || "/".equals(path)) {
            path = "/index.html";
        } else if (path.endsWith("/")) {
            path = path + "index.html";
        }
        String relative = path.startsWith("/") ? path.substring(1) : path;
        // 防止路径穿越：assets 中本来没有上级目录，这里做显式保护
        if (relative.contains("..")) {
            return notFound();
        }
        InputStream input = null;
        try {
            input = assets.open(relative);
            return new WebResourceResponse(
                    mimeTypeOf(relative),
                    "utf-8",
                    200,
                    "OK",
                    headersOf(relative),
                    input);
        } catch (IOException e) {
            closeQuietly(input);
            return notFound();
        }
    }

    private WebResourceResponse notFound() {
        return new WebResourceResponse(
                "text/plain",
                "utf-8",
                404,
                "Not Found",
                new HashMap<String, String>(),
                new ByteArrayInputStream("404 Not Found".getBytes()));
    }

    private static Map<String, String> headersOf(String relative) {
        Map<String, String> headers = new HashMap<>();
        if (relative.startsWith("static/")) {
            // 文件名带内容哈希，可以长期缓存
            headers.put("Cache-Control", "public, max-age=31536000, immutable");
        } else {
            headers.put("Cache-Control", "no-cache");
        }
        return headers;
    }

    private static String mimeTypeOf(String path) {
        int dot = path.lastIndexOf('.');
        if (dot < 0) {
            return "application/octet-stream";
        }
        String extension = path.substring(dot + 1).toLowerCase();
        String mimeType = MIME_TYPES.get(extension);
        return mimeType == null ? "application/octet-stream" : mimeType;
    }

    private static void closeQuietly(Closeable closeable) {
        if (closeable == null) {
            return;
        }
        try {
            closeable.close();
        } catch (IOException ignored) {
            // 忽略关闭异常
        }
    }
}
