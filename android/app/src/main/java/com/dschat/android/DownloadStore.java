package com.dschat.android;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Locale;

/**
 * 保存页面导出的文件（历史记录 ZIP、附件原件等），返回给用户看的结果描述。
 */
final class DownloadStore {

    private static final String SUB_DIR = "DSChat";

    private DownloadStore() {
    }

    static String save(Context context, byte[] data, String mimeType, String requestedName)
            throws IOException {
        String mime = (mimeType == null || mimeType.isEmpty())
                ? "application/octet-stream"
                : mimeType;
        String fileName = sanitizeName(requestedName, mime);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return saveWithMediaStore(context, data, mime, fileName);
        }
        return saveToAppExternalDir(context, data, fileName);
    }

    /** Android 10+：写入公共「下载/DSChat」目录，无需任何存储权限。 */
    private static String saveWithMediaStore(
            Context context, byte[] data, String mime, String fileName) throws IOException {
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS + "/" + SUB_DIR);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        ContentResolver resolver = context.getContentResolver();
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            throw new IOException("无法创建下载文件");
        }
        try (OutputStream output = resolver.openOutputStream(uri)) {
            if (output == null) {
                throw new IOException("无法写入下载文件");
            }
            output.write(data);
        } catch (IOException e) {
            resolver.delete(uri, null, null);
            throw e;
        }
        ContentValues done = new ContentValues();
        done.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, done, null, null);
        return "已保存到「下载/" + SUB_DIR + "/" + fileName + "」";
    }

    /** Android 8/9 兜底：写入应用专属外部目录（卸载应用时会被清理），无需存储权限。 */
    private static String saveToAppExternalDir(Context context, byte[] data, String fileName)
            throws IOException {
        File base = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (base == null) {
            throw new IOException("外部存储不可用");
        }
        File dir = new File(base, SUB_DIR);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("无法创建目录 " + dir);
        }
        File target = new File(dir, fileName);
        try (FileOutputStream output = new FileOutputStream(target)) {
            output.write(data);
        }
        return "已保存到应用目录：" + target.getAbsolutePath();
    }

    private static String sanitizeName(String requestedName, String mime) {
        String name = requestedName == null ? "" : requestedName.trim();
        name = name.replaceAll("[\\\\/:*?\"<>|\\r\\n\\t]", "_");
        if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
            name = "chat-demo-" + System.currentTimeMillis() + extensionOf(mime);
        }
        if (name.length() > 120) {
            int dot = name.lastIndexOf('.');
            String extension = dot > 0 ? name.substring(dot) : "";
            name = name.substring(0, Math.min(100, name.length() - extension.length())) + extension;
        }
        if (!name.contains(".")) {
            name = name + extensionOf(mime);
        }
        return name;
    }

    private static String extensionOf(String mime) {
        String lower = mime == null ? "" : mime.toLowerCase(Locale.ROOT);
        switch (lower) {
            case "application/zip":
                return ".zip";
            case "image/png":
                return ".png";
            case "image/jpeg":
                return ".jpg";
            case "image/webp":
                return ".webp";
            case "image/gif":
                return ".gif";
            case "image/svg+xml":
                return ".svg";
            case "application/pdf":
                return ".pdf";
            case "text/plain":
                return ".txt";
            case "audio/wav":
                return ".wav";
            case "audio/mpeg":
                return ".mp3";
            case "application/json":
                return ".json";
            default:
                String subtype = lower.contains("/") ? lower.substring(lower.indexOf('/') + 1) : "";
                subtype = subtype.replaceAll("[^a-z0-9]", "");
                return subtype.isEmpty() ? ".bin" : "." + subtype;
        }
    }
}
