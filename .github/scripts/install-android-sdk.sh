#!/usr/bin/env bash
# 安装/校验 DS Chat 构建所需的 Android SDK 组件。
# 兼容 GitHub Actions runner：自动定位 ANDROID_HOME 与 sdkmanager，失败重试，并校验目录。
set -uo pipefail

LOG="${ANDROID_SDK_INSTALL_LOG:-sdk-install.log}"
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "=== 环境信息 ==="
echo "ANDROID_HOME=${ANDROID_HOME:-<unset>}"
echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-<unset>}"
echo "JAVA_HOME=${JAVA_HOME:-<unset>}"
whoami || true
uname -a || true

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK_ROOT" ] || [ ! -d "$SDK_ROOT" ]; then
  SDK_ROOT="/usr/local/lib/android/sdk"
fi
echo "SDK_ROOT=$SDK_ROOT"
ls -la "$SDK_ROOT" || true

REQUIRED_PLATFORM="android-37"
REQUIRED_BUILDTOOLS="36.0.0"

# ---------- 定位 sdkmanager ----------
find_sdkmanager() {
  local sm=""
  sm="$(command -v sdkmanager 2>/dev/null || true)"
  [ -n "$sm" ] && { echo "$sm"; return 0; }
  sm="$(find "$SDK_ROOT" -type f -path '*/cmdline-tools/*/bin/sdkmanager' 2>/dev/null | sort | tail -n1)"
  [ -n "$sm" ] && { echo "$sm"; return 0; }
  return 1
}

SDKMANAGER="$(find_sdkmanager || true)"

if [ -z "$SDKMANAGER" ]; then
  echo "未找到 sdkmanager，尝试下载 Android command-line tools..."
  mkdir -p "$SDK_ROOT/cmdline-tools"
  CTMP="$SDK_ROOT/cmdline-tools/.download"
  rm -rf "$CTMP"; mkdir -p "$CTMP"
  CT_URL="https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"
  if curl -fsSL --retry 3 -o "$CTMP/cmdline-tools.zip" "$CT_URL"; then
    unzip -q "$CTMP/cmdline-tools.zip" -d "$CTMP" || true
    rm -rf "$SDK_ROOT/cmdline-tools/latest"
    mv "$CTMP/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest" || true
  fi
  SDKMANAGER="$(find_sdkmanager || true)"
fi

if [ -z "$SDKMANAGER" ]; then
  echo "::error::无法找到或安装 sdkmanager"
  exit 1
fi
chmod +x "$SDKMANAGER" 2>/dev/null || true
echo "SDKMANAGER=$SDKMANAGER"
"$SDKMANAGER" --version || true

# ---------- 接受许可 ----------
yes | "$SDKMANAGER" --sdk_root="$SDK_ROOT" --licenses > /dev/null 2>&1 || true

# ---------- 安装组件（已存在则跳过；失败重试） ----------
need_install() {
  [ -d "$SDK_ROOT/platforms/$REQUIRED_PLATFORM" ] && [ -d "$SDK_ROOT/build-tools/$REQUIRED_BUILDTOOLS" ] && return 1
  return 0
}

install_packages() {
  local args=(--sdk_root="$SDK_ROOT" "platforms;$REQUIRED_PLATFORM" "build-tools;$REQUIRED_BUILDTOOLS")
  if [ "${1:-}" = "canary" ]; then
    args=(--sdk_root="$SDK_ROOT" --channel=3 "platforms;$REQUIRED_PLATFORM" "build-tools;$REQUIRED_BUILDTOOLS")
    echo "== 尝试 canary 通道 =="
  fi
  for i in 1 2 3; do
    echo "== 安装尝试 $i: ${args[*]} =="
    "$SDKMANAGER" "${args[@]}" && return 0
    echo "第 $i 次安装失败，10 秒后重试"
    sleep 10
  done
  return 1
}

if need_install; then
  install_packages || install_packages canary || true
else
  echo "所需 SDK 组件已存在，跳过安装"
fi

# ---------- 校验 ----------
echo "=== 安装结果 ==="
ls -la "$SDK_ROOT/platforms" 2>/dev/null || true
ls -la "$SDK_ROOT/build-tools" 2>/dev/null || true

status=0
if [ -d "$SDK_ROOT/platforms/$REQUIRED_PLATFORM" ]; then
  echo "OK: platforms/$REQUIRED_PLATFORM"
else
  echo "::error::缺少 platforms/$REQUIRED_PLATFORM"
  status=1
fi
if [ -d "$SDK_ROOT/build-tools/$REQUIRED_BUILDTOOLS" ]; then
  echo "OK: build-tools/$REQUIRED_BUILDTOOLS"
else
  echo "::error::缺少 build-tools/$REQUIRED_BUILDTOOLS"
  status=1
fi

exit $status
