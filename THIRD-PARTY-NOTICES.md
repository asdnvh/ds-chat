# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，版本号跟随上游
chat-demo 版本，Android 移植自身的改动在条目中注明。

## [0.1.2] - 2026-11-17

### Added

- 原生层新增「历史导入」进度提示：点击「确认导入」后弹出 Toast
  「正在导入历史对话，请稍候…」，导入完成或失败时再提示一次。
  大包（上百个会话）在手机上可能需要数十秒，此提示用于避免被误认为卡死。
  仅读取界面文本做提示，不改变上游导入逻辑与数据格式。

### Notes

- 上游 chat-demo 功能无改动；v0.1.1 导出的 `deepseek_data-*.zip` 可直接导入。
## [0.1.1] - 2026-11-16

首个公开版本：基于 DeepSeek chat-demo v0.1.1 的 Android 移植。

### Added

- WebView 宿主（纯 Java，无第三方运行库），页面通过虚拟域名
  `https://appassets.androidplatform.net/` 从 APK 内 assets 加载（安全上下文）。
- 原生桥接补齐：多选文件上传、blob 导出保存到 `下载/DSChat`、麦克风运行时权限、
  外链跳系统浏览器、`window.open`/`target=_blank` 处理、返回键与双击退出。
- 状态栏/导航栏跟随网页深浅色主题；Android 11+ 边到边布局 + 键盘/刘海避让。
- 注入脚本 `inject.js`：导出文件名记录、主题色同步、`blob:` 图片全屏预览与非图片保存。
- 正式签名配置（keystore.properties 可选，CI 支持 secrets 注入）、Gradle wrapper。
- 文档：文件审计报告、移植方案、上游版本与升级方式、发布/签名流程。
- 第三方许可证声明（209 个生产依赖，含 Apache-2.0 全文）。
- 验证工具：静态 APK 验收脚本、真机冒烟脚本、真机测试清单。

### Known limitations

- TTS 依赖 WebView 播放 24 kHz PCM，个别厂商 WebView 行为不同。
- 语音输入使用已废弃但仍可用的 `ScriptProcessorNode`。
- 大体积历史导出经 base64 桥接，占用内存较多。

## v0.1.3 新增依赖
- mammoth (MIT), xlsx/SheetJS (Apache-2.0), pdf-lib (MIT), @pdf-lib/fontkit (MIT), libarchive.js (Apache-2.0), Noto Sans SC (SIL OFL 1.1)
