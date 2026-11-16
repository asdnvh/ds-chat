# 上游版本与升级

本仓库内嵌的上游产物来自 [DeepSeek chat-demo](https://github.com/deepseek-ai/chat-demo) 的官方发布物。

## 当前对应的上游版本

| 项目 | 值 |
|---|---|
| 上游版本 | v0.1.1（2026-11-13 发布） |
| 上游源码包 SHA256 | `99255FF7D89F41BE0A4C3CF5F6F7FA8E813849893B1A50B306521FA7A3B6E41B`（zip） |
| 上游源码包 SHA256 | `14F12E37BCC689BD7AD424EF103F3A72A6627257AF8007CEA9C5A0DC2B304E10`（tar.gz） |
| 上游构建产物 SHA256 | `A7881BE425C5C6BA63BC4909FB4C5CC8AF4350EC7A9BD50486908F264D370B17`（chat-demo-v0.1.1.zip） |
| 内嵌位置 | `android/app/src/main/assets/`（官方 dist 原样 153 个文件，含 `LICENSE`） |

> 上述 SHA256 与本仓库内嵌文件的对应关系，已在 [docs/01-文件检查报告.md](01-文件检查报告.md) 中
> 用「与官方发布物逐字节比对 + 源码真实重建 153/153 文件一致」双重验证。

## 升级到新的上游版本

1. 从上游 Releases 下载新的 `chat-demo-vX.Y.Z.zip`，用 `certutil -hashfile` / `sha256sum` 校验；
2. 解压后，用其中 `index.html`、`static/`、`LICENSE` **覆盖** `android/app/src/main/assets/`
   下同名内容（**保留** `inject.js`、`THIRD-PARTY-NOTICES.txt`、`PORT-LICENSE.txt`）；
3. 更新 `android/app/build.gradle.kts` 的 `versionName`（建议 `X.Y.Z` 或 `X.Y.Z-port.N`）、
   `versionCode` +1；
4. 若上游依赖变化（看 `package.json` / `pnpm-lock.yaml`），重新生成第三方声明
   （见 `docs/THIRD-PARTY-NOTICES.md` 的生成说明或联系维护者）；
5. 真机回归 [tools/DEVICE-TEST-CHECKLIST.md](../tools/DEVICE-TEST-CHECKLIST.md)，重点：
   文件选择、blob 导出、语音输入、朗读、外链、深色模式 —— `inject.js` 依赖
   `<meta name="theme-color">`、`<a download>`、`blob:` 链接与 `window.open` 这四个约定，
   上游若改动需同步调整 `inject.js`；
6. 更新本文件、`CHANGELOG.md`，提交 PR。

## 可选：从上游源码重新构建 dist

本仓库直接内嵌官方构建产物（可离线构建、与上游发布字节一致）。若需要自行构建：

```bash
# 需要 Node.js 22.12+ 与 pnpm
PNPM=...   # 本机 pnpm 路径
cd chat-demo
pnpm install --frozen-lockfile
pnpm build            # 输出 dist/
```

然后把 `dist/` 内容覆盖到 `android/app/src/main/assets/`（保留上面提到的三个自定义文件）。
官方构建确定性已由本仓库验证：同样源码/lockfile 下 `dist` 的 153 个文件 SHA256 与官方发布物完全一致。

## 上游许可

上游为 MIT，Copyright (c) 2026 DeepSeek。再分发时必须保留其版权声明与许可证全文
（本仓库通过 `android/app/src/main/assets/LICENSE`、`LICENSE`、`NOTICE` 多处保留）。
