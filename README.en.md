# DS Chat (English)

An unofficial Android client for [DeepSeek's open-source chat-demo](https://github.com/deepseek-ai/chat-demo)
(MIT), built as a WebView host with native bridges. The web app is embedded unchanged — no backend required.

> **Unofficial.** This is a community build, not affiliated with or endorsed by DeepSeek.
> "DeepSeek" and its logo are trademarks of their respective owner.
>
> **Upstream note:** the upstream `chat-demo` project ships a web app only (no Android project or APK).
> DeepSeek distributes a separate official mobile app, which is unrelated to this open-source project.
> This repository is a third-party Android wrapper around the open-source web frontend — not an official client.

## Scope

- **Android packaging only**: the upstream chat-demo `dist` build is embedded in a native WebView host,
  which adds Android platform glue (file picking, blob downloads, microphone permission, external links,
  back handling, system bars, keyboard/insets).
- **No chat features are added or changed**: functionality follows upstream; upstream updates are simply
  re-packaged here.
- **Not an official client**: upstream ships a web app only (no Android project/APK); DeepSeek distributes
  a separate official app that is unrelated to this project.
- Contributions/issues about the web app itself belong to the
  [upstream project](https://github.com/deepseek-ai/chat-demo/issues); issues about the Android wrapper
  (install, permissions, WebView compatibility, system bars/keyboard) are welcome here.

## Features

Multi-session chat with streaming replies, reasoning, web search and citations; file paste/upload;
voice input; text-to-speech; Markdown / syntax highlighting / KaTeX / Mermaid; zh-CN and English UI;
light/dark themes; ZIP import/export of chat history. All data stays on device.

## Download & build

- Get the latest APK from [Releases](../../releases). Android 8.0+ (API 26), WebView 108+ recommended.
- Build from source:

```bash
cd android
./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease
```

JDK 17+ and Android SDK (platform `android-36`, build-tools `36.0.0`) are required.
The upstream `dist` assets are vendored under `android/app/src/main/assets/` so builds work offline;
see [docs/UPSTREAM.md](docs/UPSTREAM.md) to refresh them.

## How it works

- Pages are served from `https://appassets.androidplatform.net/` (virtual, backed by APK assets), so
  `localStorage`, `IndexedDB`, `getUserMedia` and `AudioContext` work as on a real HTTPS origin.
- The app talks only to `https://api.deepseek.com`; external links open in the system browser.
- Native bridges cover file picking, blob downloads, microphone permission, theme-colored system bars,
  back handling and keyboard/inset avoidance.

Details: [docs/02-安卓移植方案.md](docs/02-安卓移植方案.md) (Chinese).

## Privacy

No telemetry, no third-party SDKs, three permissions only. Your API key is stored in the WebView's
local storage on device and is never uploaded anywhere else. Please report security issues per
[SECURITY.md](SECURITY.md) — never post API keys in issues.

## License

Android port: MIT, Copyright (c) 2026 DS Chat project contributors.
Upstream chat-demo: MIT, Copyright (c) 2026 DeepSeek. See [LICENSE](LICENSE) and
[docs/THIRD-PARTY-NOTICES.md](docs/THIRD-PARTY-NOTICES.md).
