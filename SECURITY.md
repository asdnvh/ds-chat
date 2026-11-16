# 安全说明

## 报告漏洞

请通过以下方式私下联系维护者（**不要**开公开 issue）：

- GitHub Security Advisories（仓库 → Security → Report a vulnerability）
- 或发邮件给维护者（在仓库主页/README 补充）

请尽量包含：影响版本、复现步骤、影响范围、PoC（如有）。
我们会在确认后尽快修复并在 CHANGELOG 致谢（如你愿意署名）。

## 威胁模型与设计

- 本应用是网页应用的 WebView 外壳，页面只从 APK 内 assets 加载，不加载任何远程页面。
- 运行时网络出口只有 `https://api.deepseek.com`；外部链接交给系统浏览器。
- 仅申请 3 个权限：`INTERNET`、`RECORD_AUDIO`（运行时申请）、
  `WRITE_EXTERNAL_STORAGE`（仅 Android 9 及以下）。
- `allowBackup=false`；无后台服务、无自启动、无第三方 SDK、无遥测。
- API Key 由用户自己填写，保存在应用私有目录的 WebView `localStorage` 中，不上传第三方。
- JS 桥接对象只暴露 5 个低风险方法，且 WebView 不允许导航到外部页面。

## 已知风险（用户需知）

- Android 8/9 设备上，导出文件写入应用专属外部目录（其他应用在有权限时可能读取）。
- 未 root 的设备上，其他应用无法读取本应用私有存储；root/越狱环境不在此威胁模型内。
- 若系统 WebView 过旧（< 108），可能出现布局或功能异常，请更新系统 WebView。

## 支持版本

仅最新 Release 版本接受安全修复；旧版本请先升级。
