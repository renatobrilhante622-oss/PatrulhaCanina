package com.t4b.patrulhacanina;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.IOException;

/** Conteúdo somente local; o APK nem sequer solicita permissão de Internet. */
public final class MainActivity extends Activity {
    private WebView game;
    private static final String ORIGIN = "https://game.local/";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        game = new WebView(this);
        game.setBackgroundColor(0xff9cdaef);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // Não abre links nem sai do jogo.
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (!url.startsWith(ORIGIN)) return empty();
                String path = request.getUrl().getPath();
                if (path == null || path.contains("..") || path.contains("\\")) return empty();
                if (path.equals("/")) path = "/index.html";
                String mime = path.endsWith(".js") ? "application/javascript" :
                        path.endsWith(".css") ? "text/css" :
                        path.endsWith(".json") ? "application/json" :
                        path.endsWith(".wav") ? "audio/wav" : "text/html";
                try { return new WebResourceResponse(mime, "UTF-8", getAssets().open("game" + path)); }
                catch (IOException ignored) { return empty(); }
            }
            private WebResourceResponse empty() {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", java.util.Collections.emptyMap(),
                        new java.io.ByteArrayInputStream(new byte[0]));
            }
        });
        FrameLayout area = new FrameLayout(this);
        area.addView(game, new FrameLayout.LayoutParams(-1, -1));
        area.setOnApplyWindowInsetsListener((view, insets) -> {
            int left = 0, top = 0, right = 0, bottom = 0;
            if (Build.VERSION.SDK_INT >= 28 && insets.getDisplayCutout() != null) {
                android.view.DisplayCutout cutout = insets.getDisplayCutout();
                left = cutout.getSafeInsetLeft(); top = cutout.getSafeInsetTop();
                right = cutout.getSafeInsetRight(); bottom = cutout.getSafeInsetBottom();
            }
            view.setPadding(left, top, right, bottom);
            return insets;
        });
        setContentView(area);
        game.loadUrl(ORIGIN);
        immersive();
    }

    @SuppressWarnings("deprecation") private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused); if (focused) immersive();
    }
    @Override protected void onPause() {
        game.evaluateJavascript("window.game && window.game.pause()", null);
        game.onPause(); super.onPause();
    }
    @Override protected void onResume() {
        super.onResume(); if (game != null) game.onResume(); immersive();
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("window.game && window.game.home()", null);
    }
    @Override protected void onDestroy() {
        game.destroy(); super.onDestroy();
    }
}
