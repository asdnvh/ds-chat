# 发布与签名流程

本文件说明如何从源码产出可分发 APK，以及 CI（GitHub Actions）签名与发布配置。

## 1. 版本号

- `android/app/build.gradle.kts`：`versionCode` 每次发版 **+1**（只能增大）；`versionName` 与上游版本对齐
  （如上游 v0.1.1 的移植可写 `0.1.1`，移植补丁写 `0.1.1-port.2`）。
- 同步更新 `CHANGELOG.md`。

## 2. 本地正式签名构建

首次生成 keystore（只做一次，**务必备份**）：

```bash
keytool -genkeypair -v \
  -keystore dschat-release.jks -storetype PKCS12 \
  -alias dschat -keyalg RSA -keysize 4096 -validity 10950 \
  -dname "CN=DS Chat, O=DS Chat Unofficial Build, C=CN"
```

在 `android/keystore.properties` 写入（该文件与 `keystore/` 已被 `.gitignore` 排除，**不要提交**）：

```properties
storeFile=keystore/dschat-release.jks
storePassword=你的密码
keyAlias=dschat
keyPassword=你的密码
```

然后构建：

```bash
cd android
./gradlew assembleRelease        # 产物：app/build/outputs/apk/release/app-release.apk
```

验证签名：

```bash
apksigner verify --verbose --print-certs app/build/outputs/apk/release/app-release.apk
# 应看到 Signer #1 certificate DN: CN=DS Chat, ...
```

> ⚠️ 未配置 `keystore.properties` 时，release 包会回退到 **debug 签名**（便于试装），
> 不要用 debug 签名对外分发。keystore 或密码丢失后，已安装用户将无法覆盖升级（只能卸载重装）。

## 3. CI 签名（GitHub Actions）

在仓库 Settings → Secrets and variables → Actions 添加：

| Secret | 说明 |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 dschat-release.jks` 后的内容 |
| `KEYSTORE_PASSWORD` | keystore 密码 |
| `KEY_ALIAS` | `dschat` |
| `KEY_PASSWORD` | key 密码 |

Base64 生成：

```bash
# Linux/macOS
base64 -w0 dschat-release.jks > keystore.b64
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("dschat-release.jks")) > keystore.b64
```

`release.yml` 会在打 tag（`v*`）时用这些 secrets 配置签名并创建 Release；
若 secrets 未配置，CI 也会出包（debug 签名），但 workflow 会打印警告，**不应用于正式分发**。

## 4. 发布步骤

1. 更新版本号 + CHANGELOG，提交；
2. 打 tag 并推送：`git tag v0.1.1 && git push origin v0.1.1`；
3. CI 自动构建并创建 GitHub Release，附件包含：
   `DSChat-<版本>.apk`、`LICENSE.txt`、`NOTICE.txt`、`THIRD-PARTY-NOTICES.txt`、`SHA256SUMS.txt`；
4. 本地也可以用 `tools/build-apk.ps1 -Release`（或 `tools/build-apk.sh --release`）出包后手动上传；
5. 如要发到 QQ 群/网盘，可参考发布包结构：APK + 安装说明 + 群文案 + LICENSE + 第三方声明 + 校验值，
   打包成 zip 分发（不要包含 keystore 或任何密码）。

## 5. 发布前检查

- [ ] `tools/static-verify-apk.ps1` 全部 PASS（包名、版本、签名、assets 数量、许可证文件齐全）
- [ ] `apksigner verify` 显示的是正式证书，不是 `CN=Android Debug`
- [ ] APK 内 `assets/LICENSE`、`assets/PORT-LICENSE.txt`、`assets/THIRD-PARTY-NOTICES.txt` 均存在
- [ ] 真机按 [tools/DEVICE-TEST-CHECKLIST.md](../tools/DEVICE-TEST-CHECKLIST.md) 回归
- [ ] README / CHANGELOG 中的版本、截图、功能描述与实际一致
- [ ] 提交记录里不含 keystore、密码、API Key、聊天记录
