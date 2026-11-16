# 贡献指南

感谢参与 DS Chat！本仓库是 [DeepSeek chat-demo](https://github.com/deepseek-ai/chat-demo) 的
Android 移植（MIT），提交贡献即表示同意以 MIT 协议发布。

## 开发环境

- JDK 17+（Android Studio 自带 JDK 即可）
- Android SDK：platform `android-37`、build-tools `36.0.0`
- 首次构建需联网下载 Gradle 发行版（wrapper）与 AGP 依赖

## 本地构建

```bash
cd android
./gradlew assembleDebug        # Windows: .\gradlew.bat assembleDebug
```

真机验证：

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 可以改什么 / 注意什么

- ✅ 欢迎：原生桥接能力（相机、分享、原生 TTS）、UI 细节、文档、兼容性适配、`inject.js` 增强。
- ⚠️ **不要提交**：`keystore.properties`、`*.jks`、`local.properties`、任何 API Key / 聊天记录、
  构建产物（`build/`、`*.apk`）。仓库的 `.gitignore` 已覆盖，但仍请自查。
- ⚠️ **不要修改 `android/app/src/main/assets/` 里的官方 dist 文件**（除非同步升级上游版本，
  见 [docs/UPSTREAM.md](docs/UPSTREAM.md)）；对网页行为的增强请写进 `assets/inject.js`。
- ⚠️ 上游 dist 是 MIT 授权，但**不要**把「DeepSeek」名称/Logo 用作应用名、图标或商店文案，
  也不要暗示官方背书。

## 代码风格

- Java 遵循项目现有风格（4 空格缩进、中文注释说明"为什么"）；
- Kotlin DSL / XML 2 空格缩进；Markdown 保持现有结构；
- 提交前跑一次 `.\gradlew.bat assembleDebug`，确认能编译；改原生逻辑时尽量在真机回归
  [tools/DEVICE-TEST-CHECKLIST.md](tools/DEVICE-TEST-CHECKLIST.md) 中受影响的用例。

## 提交 PR

1. 从 `main` 切分支（建议 `feat/xxx`、`fix/xxx`）；
2. 一个 PR 只做一件事，说明动机、改动点、验证方式（截图/日志更好）；
3. 涉及界面变化请附截图；涉及权限/网络行为变化请单独说明；
4. 维护者会尽快 review。

## 安全问题

请勿在公开 issue 中讨论漏洞细节，按 [SECURITY.md](SECURITY.md) 私下报告。
