## 改动说明

<!-- 这个 PR 做了什么、为什么 -->

## 关联 issue

<!-- Fixes #123 -->

## 验证方式

- [ ] `./gradlew assembleDebug` 本地构建通过（Windows 用 `.\gradlew.bat`）
- [ ] 涉及原生逻辑时，已在真机回归 `tools/DEVICE-TEST-CHECKLIST.md` 中受影响的用例
- [ ] 涉及界面变化时，已附截图

## 自查清单

- [ ] 没有提交 `keystore.properties` / `*.jks` / `local.properties` / API Key / 聊天记录
- [ ] 没有改动 `android/app/src/main/assets/` 里的官方 dist 文件（`inject.js` 除外）
- [ ] 未使用 DeepSeek 官方商标/Logo 作为应用名、图标或暗示官方背书
- [ ] 新代码以 MIT 协议发布（如新增了第三方代码，已更新 `docs/THIRD-PARTY-NOTICES.md`）
