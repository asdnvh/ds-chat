package com.dschat.android;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.File;

/** 极简 PDF 阅读器：使用系统 PdfRenderer 逐页渲染。 */
public class PdfViewerActivity extends Activity {
    public static final String EXTRA_PATH = "path";
    public static final String EXTRA_NAME = "name";

    private PdfRenderer renderer;
    private PdfRenderer.Page page;
    private ImageView imageView;
    private TextView pageLabel;
    private int pageIndex;
    private int pageCount;
    private int targetWidth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String path = getIntent().getStringExtra(EXTRA_PATH);
        String name = getIntent().getStringExtra(EXTRA_NAME);
        if (path == null) {
            finish();
            return;
        }
        try {
            File file = new File(path);
            ParcelFileDescriptor descriptor =
                    ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
            renderer = new PdfRenderer(descriptor);
            pageCount = renderer.getPageCount();
        } catch (Exception error) {
            finish();
            return;
        }
        targetWidth = getResources().getDisplayMetrics().widthPixels;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(18, 18, 18));
        root.setFitsSystemWindows(true);

        // 顶部栏：标题 + 关闭（始终可见，避免退不出去）
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(28, 26, 28, 14);
        TextView title = new TextView(this);
        title.setText(name == null ? "PDF" : name);
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setSingleLine(true);
        title.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
        LinearLayout.LayoutParams titleParams =
                new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        title.setLayoutParams(titleParams);
        Button close = styledButton("关闭");
        close.setTextColor(Color.WHITE);
        close.setBackground(rounded(Color.rgb(60, 60, 64)));
        close.setOnClickListener(view -> finish());
        header.addView(title);
        header.addView(close);

        FrameLayout content = new FrameLayout(this);
        content.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        imageView = new ImageView(this);
        imageView.setAdjustViewBounds(true);
        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        content.addView(
                imageView,
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        Gravity.CENTER));

        // 底部栏：页码 + 上一页/下一页（留出导航栏空间）
        LinearLayout footer = new LinearLayout(this);
        footer.setOrientation(LinearLayout.HORIZONTAL);
        footer.setGravity(Gravity.CENTER_VERTICAL);
        footer.setPadding(28, 12, 28, 40);
        Button previous = styledButton("上一页");
        previous.setOnClickListener(view -> showPage(pageIndex - 1));
        pageLabel = new TextView(this);
        pageLabel.setTextColor(Color.WHITE);
        pageLabel.setTextSize(14);
        pageLabel.setGravity(Gravity.CENTER);
        pageLabel.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        Button next = styledButton("下一页");
        next.setOnClickListener(view -> showPage(pageIndex + 1));
        footer.addView(previous);
        footer.addView(pageLabel);
        footer.addView(next);

        root.addView(header);
        root.addView(content);
        root.addView(footer);
        setContentView(root);
        showPage(0);
    }

    private Button styledButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(15);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        button.setTypeface(Typeface.DEFAULT);
        button.setBackground(rounded(Color.rgb(44, 44, 46)));
        button.setPadding(28, 12, 28, 12);
        return button;
    }

    private GradientDrawable rounded(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(24);
        return drawable;
    }

    private void showPage(int index) {
        if (renderer == null || index < 0 || index >= pageCount) {
            return;
        }
        if (page != null) {
            page.close();
            page = null;
        }
        page = renderer.openPage(index);
        float ratio = (float) page.getHeight() / page.getWidth();
        int height = Math.round(targetWidth * ratio);
        Bitmap bitmap = Bitmap.createBitmap(targetWidth, height, Bitmap.Config.ARGB_8888);
        bitmap.eraseColor(Color.WHITE);
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
        pageIndex = index;
        imageView.setImageBitmap(bitmap);
        pageLabel.setText((index + 1) + " / " + pageCount);
    }

    @Override
    protected void onDestroy() {
        if (page != null) {
            page.close();
        }
        if (renderer != null) {
            renderer.close();
        }
        super.onDestroy();
    }
}
