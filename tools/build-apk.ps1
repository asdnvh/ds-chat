<#
.SYNOPSIS
    Build the DS Chat APK from source.
.PARAMETER Release
    Build the release variant (app-release.apk). Default: debug.
.EXAMPLE
    pwsh tools/build-apk.ps1
    pwsh tools/build-apk.ps1 -Release
#>
[CmdletBinding()]
param(
    [switch]$Release
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$gradlew = Join-Path $android 'gradlew.bat'

if (-not (Test-Path $gradlew)) {
    throw "gradlew.bat not found under $android. Open the repo root, not the tools folder."
}
if (-not $env:JAVA_HOME) {
    Write-Warning "JAVA_HOME is not set. Gradle will use the JDK on PATH; the build needs JDK 17+."
}
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    Write-Warning "ANDROID_HOME / ANDROID_SDK_ROOT is not set. Gradle needs the Android SDK (platform android-37, build-tools 36.0.0)."
}

$task = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
Push-Location $android
try {
    & $gradlew --no-daemon --console=plain $task
    if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$outDir = if ($Release) { 'app\build\outputs\apk\release' } else { 'app\build\outputs\apk\debug' }
$apk = Get-ChildItem (Join-Path $android $outDir) -Filter *.apk -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $apk) { throw "APK not found under $outDir" }
Write-Host ""
Write-Host "APK: $($apk.FullName)" -ForegroundColor Green
Write-Host "Size: $([math]::Round($apk.Length / 1MB, 2)) MB"
if ($Release) {
    Write-Host "Note: release APK is debug-signed unless android/keystore.properties is configured." -ForegroundColor Yellow
}
