# chat-demo Android（WebView 宿主）

把 [DeepSeek chat-demo](https://github.com/deepseek-ai/chat-demo) v0.1.1 的官方网页构建产物
（MIT）封装为可侧载安装的 Android APK。网页代码零改动，原生层只补齐 WebView 缺失的浏览器能力。

- 包名：`com.dschat.android`，显示名：`DS Chat`
- compileSdk 36 / targetSdk 36 / minSdk 26（Android 8.0+），纯 Java，无第三方运行库
- 页面通过虚拟域名 `https://appassets.androidplatform.net/` 从 `assets/` 加载（安全上下文，
  localStorage / IndexedDB / getUserMedia / AudioContext 均可用），不会产生真实网络请求

完整方案与限制见 [../docs/02-安卓移植方案.md](../docs/02-安卓移植方案.md)，
源文件审计见 [../docs/01-文件检查报告.md](../docs/01-文件检查报告.md)。

## 构建

```powershell
# 按本机实际路径修改（下方为 Android Studio 默认安装位置）
$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleDebug
# 产物：app\build\outputs\apk\debug\app-debug.apk
```

Android Studio：`File → Open` 选择本目录（`android/`），等待 Sync 完成后
`Build → Build APK(s)` 或直接 `Run 'app'`。

## 安装

```powershell
adb install -r ..\DSChat-0.1.2-debug.apk
```

首次启动会弹出设置页要求填写 DeepSeek API Key（网页原有逻辑，Key 只存开发机）。

## 目录说明

| 路径 | 作用 |
|---|---|
| `app/src/main/assets/` | 官方 `dist` 原样（`index.html` + `static/` + `LICENSE`）+ `inject.js` |
| `app/src/main/assets/inject.js` | 运行时注入的少量增强：记录导出文件名、同步状态栏主题色、`blob:` 图片预览/保存 |
| `app/src/main/java/com/dschat/android/MainActivity.java` | WebView 宿主：权限、文件选择、外链、弹窗、返回键、系统栏/键盘 |
| `.../AssetServer.java` | assets → `https://appassets.androidplatform.net` 虚拟服务 |
| `.../DownloadStore.java` | blob 内容落盘（Android 10+ MediaStore，8/9 兜底） |
| `.../NativeBridge.java` | `window.DSChatNative` 桥接（保存下载、主题色、浮层状态、日志、Toast） |

## 替换上游版本

1. 下载新版官方 `chat-demo-vX.Y.Z.zip`，解压；
2. 用它覆盖 `app/src/main/assets/` 下的 `index.html`、`static/`、`LICENSE`（**保留 `inject.js`**）；
3. 更新 `app/build.gradle.kts` 的 `versionName`（与官方版本保持一致便于排查）；
4. 重新构建并在真机回归：聊天、上传附件、语音输入、朗读、历史导入导出、深色模式、外链。

> `inject.js` 依赖的页面约定：`<meta name="theme-color">`、`<a download>`、`blob:` 预览链接/`window.open`。
> 上游若改动这几处，需要同步调整注入脚本。

## 签名

默认 debug 签名便于试装。正式分发请在 `keystore.properties` 配置后 `assembleRelease`，
详见方案文档 §5.6。

## 许可

- 本 Android 移植工程：`LICENSE`（含上游版权归属声明，MIT）。
- 上游网页应用及其产物：MIT，Copyright (c) 2026 DeepSeek。上游许可证原文见
  `app/src/main/assets/LICENSE`（官方 dist 原样文件），上游版权归属说明见本工程 `LICENSE`
  与 `app/src/main/assets/PORT-LICENSE.txt`。
- 第三方依赖声明见 `app/src/main/assets/THIRD-PARTY-NOTICES.txt`。
- 请勿使用 DeepSeek 官方商标作为应用名称或图标。
