# Cross-Browser Testing

## Tested engines

### Chromium 151 — passed

Playwright Chromium covers the complete unit and interaction suite, all six memory orders,
all ending profiles, seven responsive viewports, real Web Audio initialization, muted and
unmuted journeys, visibility recovery, replay, focus restoration, low quality, WebGL
fallback, screenshots, local diagnostic traces, and video. Trace ZIPs remain local because
they contain machine-specific stack paths and are excluded from the public repository.

### Firefox 153 — passed

Playwright Firefox completed a Hope → Fear → Identity journey with:

- WebGL renderer initialization;
- Web Audio running/suspended lifecycle;
- fragment focus and controls;
- reconstruction and Hope ending;
- replay without duplicate ambience;
- system-font fallback;
- zero application console warnings or errors.

The WebGL capability probe was adjusted after Firefox correctly warned when a temporary
probe context was explicitly lost. The final probe simply releases its local reference and
the warning is gone.

### WebKit 26.5 — unavailable on this host

The Playwright WebKit binary downloaded successfully. Launch was attempted, but this host is
missing `libicu74`, `libxml2`, and `libflite1`. Playwright's dependency installer requires
sudo and the environment does not provide a sudo password. No Safari/WebKit compatibility
claim is made from Chromium or Firefox results.

Run the dedicated configuration on a supported host with dependencies installed:

```bash
npm run test:visual:webkit
```

## Remaining physical-device checks

- Safari on macOS and iOS;
- mobile browser chrome and notch combinations;
- OLED versus lifted LCD near-blacks;
- real headphone and laptop-speaker balance;
- VoiceOver and TalkBack focus announcements.
