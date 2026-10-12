package io.github.sevaan.spacecollector;

import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Android's text size setting scales the web view's text without limit, which broke the cards at 1.6x (QA
    // 2026-10-11). Follow the setting, but no further than 115%, so bigger text never wrecks the layout.
    private void applyTextZoom() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        float scale = getResources().getConfiguration().fontScale;
        WebSettings s = getBridge().getWebView().getSettings();
        s.setTextZoom(Math.round(Math.min(1.15f, Math.max(1f, scale)) * 100));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyTextZoom();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyTextZoom();
    }
}
