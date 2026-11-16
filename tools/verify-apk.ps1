<#
SYNOPSIS
    Smoke-verify an Android APK on an emulator/device:
    ensure device is booted -> adb install -r -g -> launch main activity ->
    screenshot -> collect logcat errors -> PASS/FAIL summary.

.DESCRIPTION
    Idempotent and parameterized. Safe to re-run. Works with PowerShell 5.1 and 7+.
    Resolves the Android SDK from ANDROID_HOME / ANDROID_SDK_ROOT, then falls back
    to adb on PATH. Relative paths are resolved against the current directory.

.PARAMETER ApkPath
    Required. Path to the .apk file to install.

.PARAMETER Serial
    Optional adb serial (e.g. emulator-5554). If omitted, the first device in
    state "device" is used.

.PARAMETER OutDir
    Optional output directory for screenshots and logs.
    Default: <repo root>/artifacts/screenshots (repo root = parent of tools/).

.PARAMETER Package
    Application package name. Default: com.dschat.android

.PARAMETER Activity
    Main activity class, relative form allowed (".MainActivity") or fully qualified.
    Default: .MainActivity

.PARAMETER AvdName
    AVD to auto-start when no booted device is found. Default: chatdemo_api37

.PARAMETER NoAutoStart
    Do not start the emulator automatically; fail with exit code 2 if no device.

.PARAMETER BootTimeoutSec
    Max seconds to wait for sys.boot_completed. Default: 900

.PARAMETER SettleSeconds
    Seconds to wait after launching the activity before screencap. Default: 10

.PARAMETER SkipInstall
    Skip adb install (verify an already installed build).

.PARAMETER NoClearLogcat
    Do not clear logcat before launching (keeps prior logs).

.EXAMPLE
    pwsh -File tools\verify-apk.ps1 -ApkPath android\app\build\outputs\apk\debug\app-debug.apk

.EXAMPLE
    pwsh -File tools\verify-apk.ps1 -ApkPath C:\out\app.apk -Serial emulator-5554 -OutDir artifacts\screenshots\run1

.NOTES
    Exit codes: 0 = PASS, 1 = FAIL, 2 = environment/device unavailable.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ApkPath,

    [string]$Serial,
    [string]$OutDir,
    [string]$Package = 'com.dschat.android',
    [string]$Activity = '.MainActivity',
    [string]$AvdName = 'chatdemo_api37',
    [switch]$NoAutoStart,
    [int]$BootTimeoutSec = 900,
    [int]$SettleSeconds = 10,
    [switch]$SkipInstall,
    [switch]$NoClearLogcat
)

$ErrorActionPreference = 'Continue'
Set-StrictMode -Version 2.0

# ---------------------------------------------------------------- paths / tools
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir

function Resolve-FullPath([string]$Path, [string]$Base) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }
    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path $Base $Path))
}

$ApkFull = Resolve-FullPath $ApkPath (Get-Location).Path
if (-not (Test-Path -LiteralPath $ApkFull -PathType Leaf)) {
    Write-Host "[FAIL] APK not found: $ApkFull" -ForegroundColor Red
    exit 1
}
$ApkFull = (Resolve-Path -LiteralPath $ApkFull).Path

if ([string]::IsNullOrWhiteSpace($OutDir)) {
    $OutDir = 'artifacts\screenshots'
}
$OutDirFull = Resolve-FullPath $OutDir $RepoRoot
if (-not (Test-Path -LiteralPath $OutDirFull)) {
    New-Item -ItemType Directory -Force -Path $OutDirFull | Out-Null
}
$LogDir = Join-Path $RepoRoot 'artifacts\logs'
if (-not (Test-Path -LiteralPath $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

function Find-Adb {
    $candidates = @()
    if ($env:ANDROID_HOME)    { $candidates += (Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe') }
    if ($env:ANDROID_SDK_ROOT){ $candidates += (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe') }
    $candidates += 'E:\Android\Sdk\platform-tools\adb.exe'
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c -PathType Leaf)) { return $c }
    }
    $cmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}
function Find-Emulator {
    $candidates = @()
    if ($env:ANDROID_HOME)    { $candidates += (Join-Path $env:ANDROID_HOME 'emulator\emulator.exe') }
    if ($env:ANDROID_SDK_ROOT){ $candidates += (Join-Path $env:ANDROID_SDK_ROOT 'emulator\emulator.exe') }
    $candidates += 'E:\Android\Sdk\emulator\emulator.exe'
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c -PathType Leaf)) { return $c }
    }
    return $null
}

$Adb = Find-Adb
if (-not $Adb) {
    Write-Host '[FAIL] adb not found. Set ANDROID_HOME or add platform-tools to PATH.' -ForegroundColor Red
    exit 2
}

# ------------------------------------------------------------- helper: binaries
function Save-AdbScreenCapture([string]$OutFile) {
    # Primary: exec-out screencap -p streamed as raw bytes (no text corruption).
    $ok = $false
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $Adb
        $psi.Arguments = "-s $Serial exec-out screencap -p"
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.CreateNoWindow = $true
        $p = [System.Diagnostics.Process]::Start($psi)
        $ms = New-Object System.IO.MemoryStream
        $p.StandardOutput.BaseStream.CopyTo($ms)
        $p.WaitForExit(60000) | Out-Null
        $bytes = $ms.ToArray()
        if ($bytes.Length -ge 8 -and $bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47) {
            [System.IO.File]::WriteAllBytes($OutFile, $bytes)
            $ok = $true
        }
    } catch { $ok = $false }

    if (-not $ok) {
        # Fallback: write on-device, then pull (immune to stdout encoding issues).
        $tmp = '/data/local/tmp/_verify_probe.png'
        & $Adb -s $Serial shell screencap -p $tmp 2>&1 | Out-Null
        & $Adb -s $Serial pull $tmp $OutFile 2>&1 | Out-Null
        & $Adb -s $Serial shell rm -f $tmp 2>&1 | Out-Null
        if (Test-Path -LiteralPath $OutFile) {
            $len = (Get-Item -LiteralPath $OutFile).Length
            if ($len -lt 100) { $ok = $false } else { $ok = $true }
        }
    }
    if (-not $ok) { return $false }
    if (-not (Test-Path -LiteralPath $OutFile)) { return $false }
    return ((Get-Item -LiteralPath $OutFile).Length -gt 100)
}

function Get-AdbProp([string]$Name) {
    $v = & $Adb -s $Serial shell getprop $Name 2>$null
    if ($null -eq $v) { return '' }
    return ($v -join '').Trim()
}

function Get-DeviceList {
    $raw = & $Adb devices 2>&1
    $result = @()
    foreach ($line in $raw) {
        if ($line -match '^(\S+)\s+(device|offline|unauthorized)\s*$') {
            $result += [pscustomobject]@{ Serial = $matches[1]; State = $matches[2] }
        }
    }
    return $result
}

function Wait-ForBoot([int]$TimeoutSec) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        $booted = Get-AdbProp 'sys.boot_completed'
        if ($booted -eq '1') { return $true }
        Start-Sleep -Seconds 5
        # Re-check that the transport is still alive.
        $dev = Get-DeviceList | Where-Object { $_.Serial -eq $Serial -and $_.State -eq 'device' }
        if (-not $dev) { Start-Sleep -Seconds 5 }
    }
    return $false
}

function Start-EmulatorIfNeeded {
    $emu = Find-Emulator
    if (-not $emu) {
        Write-Host '[FAIL] emulator.exe not found; cannot auto-start.' -ForegroundColor Red
        return $false
    }
    $emuLog = Join-Path $LogDir ('emulator-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    # The qemu backend needs the emulator lib dirs on PATH, otherwise it aborts
    # with 0xC0000135 (DLL not found) before the guest starts.
    $emuRoot = Split-Path -Parent $emu
    $libDirs = @(
        $emuRoot,
        (Join-Path $emuRoot 'qemu\windows-x86_64'),
        (Join-Path $emuRoot 'lib64'),
        (Join-Path $emuRoot 'lib64\gles_swiftshader'),
        (Join-Path $emuRoot 'lib64\vulkan')
    )
    $env:PATH = ((@($libDirs) | Where-Object { Test-Path -LiteralPath $_ }) -join ';') + ';' + $env:PATH
    $env:ANDROID_EMULATOR_LAUNCHER_DIR = $emuRoot
    $emuArgs = @('-avd', $AvdName, '-no-window', '-no-snapshot', '-no-audio',
              '-gpu', 'swiftshader_indirect', '-no-boot-anim', '-no-metrics',
              '-accel', 'off')
    Write-Host "[INFO] starting emulator: $emu $($emuArgs -join ' ')" -ForegroundColor Yellow
    Start-Process -FilePath $emu -ArgumentList $emuArgs -WindowStyle Hidden `
        -RedirectStandardOutput $emuLog -RedirectStandardError ($emuLog + '.err') | Out-Null
    return $true
}

# --------------------------------------------------------------- result tracking
$script:Failures = @()
$script:Warnings = @()
function Add-Failure([string]$msg) { $script:Failures += $msg; Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Add-Warning([string]$msg) { $script:Warnings += $msg; Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Add-Info([string]$msg)    { Write-Host "[INFO] $msg" }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$baseName = 'apk-verify-' + $stamp
$shotPath = Join-Path $OutDirFull ($baseName + '.png')
$logcatPath = Join-Path $LogDir ($baseName + '.logcat.txt')
$summaryPath = Join-Path $LogDir ($baseName + '.summary.txt')

Add-Info "adb           : $Adb"
Add-Info "apk           : $ApkFull"
Add-Info "package/act   : $Package/$Activity"
Add-Info "out dir       : $OutDirFull"

# ------------------------------------------------------------------ device setup
$devices = Get-DeviceList
if ($Serial) {
    $match = $devices | Where-Object { $_.Serial -eq $Serial }
    if (-not $match -and -not $NoAutoStart) {
        if (-not (Start-EmulatorIfNeeded)) { exit 2 }
    }
} else {
    $booted = $devices | Where-Object { $_.State -eq 'device' } | Select-Object -First 1
    if ($booted) { $Serial = $booted.Serial }
    else {
        if ($NoAutoStart) {
            Write-Host '[FAIL] no booted device and -NoAutoStart was given.' -ForegroundColor Red
            exit 2
        }
        if (-not (Start-EmulatorIfNeeded)) { exit 2 }
    }
}

if (-not $Serial) {
    # Wait for a device to appear, then take the first emulator (or any) device.
    $deadline = (Get-Date).AddSeconds($BootTimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $devices = Get-DeviceList
        $cand = $devices | Where-Object { $_.State -eq 'device' } | Select-Object -First 1
        if ($cand) { $Serial = $cand.Serial; break }
        Start-Sleep -Seconds 5
    }
    if (-not $Serial) {
        Write-Host '[FAIL] timed out waiting for any adb device.' -ForegroundColor Red
        exit 2
    }
}

Add-Info "serial        : $Serial"
$connected = $false
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt $BootTimeoutSec) {
    $devices = Get-DeviceList
    $d = $devices | Where-Object { $_.Serial -eq $Serial }
    if ($d -and $d.State -eq 'device') { $connected = $true; break }
    Start-Sleep -Seconds 5
}
if (-not $connected) {
    Write-Host "[FAIL] device $Serial did not reach state 'device' within $BootTimeoutSec s." -ForegroundColor Red
    exit 2
}

Add-Info 'waiting for sys.boot_completed ...'
if (-not (Wait-ForBoot $BootTimeoutSec)) {
    Write-Host "[FAIL] system did not finish booting within $BootTimeoutSec s." -ForegroundColor Red
    exit 2
}
Add-Info 'device booted.'

$sdkVer = Get-AdbProp 'ro.build.version.sdk'
$relVer = Get-AdbProp 'ro.build.version.release'
Add-Info "android       : API $sdkVer (release $relVer)"

$webViewRaw = & $Adb -s $Serial shell dumpsys webviewupdate 2>&1
$webViewLine = ($webViewRaw | Select-String -Pattern 'Current WebView package' | Select-Object -First 1)
$webView = ''
if ($webViewLine) { $webView = $webViewLine.ToString().Trim() }
if (-not $webView) { $webView = 'unknown' }
Add-Info "webview       : $webView"

# --------------------------------------------------------------------- install
if (-not $SkipInstall) {
    Add-Info 'installing APK (adb install -r -g) ...'
    $installOut = & $Adb -s $Serial install -r -g $ApkFull 2>&1
    $installText = ($installOut -join "`n")
    Write-Host $installText
    if ($installText -notmatch 'Success') {
        Add-Failure 'adb install did not report Success.'
        if ($installText -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') {
            Add-Info 'trying uninstall then reinstall ...'
            & $Adb -s $Serial uninstall $Package 2>&1 | Out-Null
            $installOut = & $Adb -s $Serial install -r -g $ApkFull 2>&1
            $installText = ($installOut -join "`n")
            Write-Host $installText
            if ($installText -match 'Success') {
                $script:Failures = @($script:Failures | Where-Object { $_ -ne 'adb install did not report Success.' })
                Add-Info 'reinstall after uninstall succeeded.'
            }
        }
    } else {
        Add-Info 'install OK.'
    }
} else {
    Add-Info 'install skipped (-SkipInstall).'
}

# Verify the package actually exists on the device.
$pkgPath = (& $Adb -s $Serial shell pm path $Package 2>&1 | Out-String).Trim()
if (-not $pkgPath -or $pkgPath -notmatch '^package:') {
    Add-Failure "package '$Package' is not installed on the device."
} else {
    Add-Info "installed     : $pkgPath"
}

if (-not $NoClearLogcat) {
    & $Adb -s $Serial logcat -c 2>&1 | Out-Null
    Add-Info 'logcat cleared.'
}

# ---------------------------------------------------------------------- launch
$component = if ($Activity.StartsWith('.')) { "$Package/$Activity" } else { "$Package/$Activity" }
Add-Info "launching     : $component"
$startOut = & $Adb -s $Serial shell am start -W -n $component 2>&1
$startText = ($startOut -join "`n")
Write-Host $startText
if ($startText -match 'Error type|does not exist|Activity not started|Exception') {
    Add-Failure 'am start reported an error.'
}

# Give the WebView time to render and run JS.
Add-Info "waiting $SettleSeconds s for render ..."
Start-Sleep -Seconds $SettleSeconds

$pidOf = (& $Adb -s $Serial shell pidof $Package 2>&1 | Out-String).Trim()
if ($pidOf) { Add-Info "pid           : $pidOf" }
else { Add-Warning "package '$Package' has no running process after launch." }

# ------------------------------------------------------------------ screenshot
Add-Info "screencap ->  : $shotPath"
$shotOk = Save-AdbScreenCapture $shotPath
if (-not $shotOk) {
    Add-Failure 'screencap failed (no valid PNG produced).'
} else {
    Add-Info ("screenshot OK : {0} bytes" -f (Get-Item -LiteralPath $shotPath).Length)
}

# --------------------------------------------------------------- logcat capture
$logcatRaw = & $Adb -s $Serial logcat -d -v time 2>&1
if ($logcatRaw) {
    $logcatRaw | Out-File -LiteralPath $logcatPath -Encoding utf8
    Add-Info "logcat saved  : $logcatPath"
} else {
    Add-Warning 'logcat was empty.'
}

$fatalPattern = 'FATAL EXCEPTION|E/AndroidRuntime|Uncaught .*Exception|Unhandled .*Exception|E/chromium.*(ERROR|FATAL)|E/WebView.*(ERROR|FATAL)'
$fatalHits = @()
if ($logcatRaw) {
    $fatalHits = @($logcatRaw | Select-String -Pattern $fatalPattern)
}
$webviewHits = @()
if ($logcatRaw) {
    $webviewHits = @($logcatRaw | Select-String -Pattern 'WebView|chromium|console' | Select-Object -First 40)
}

if ($fatalHits.Count -gt 0) {
    Add-Failure ("logcat shows {0} fatal/crash line(s)." -f $fatalHits.Count)
    $fatalHits | Select-Object -First 15 | ForEach-Object { Write-Host ("    " + $_.ToString()) -ForegroundColor DarkRed }
} else {
    Add-Info 'logcat: no fatal/crash lines.'
}
if ($webviewHits.Count -gt 0) {
    Add-Info ("logcat: {0} WebView/chromium line(s):" -f $webviewHits.Count)
    $webviewHits | Select-Object -First 10 | ForEach-Object { Write-Host ("    " + $_.ToString()) -ForegroundColor DarkGray }
}

# ---------------------------------------------------------------------- summary
$verdict = if ($script:Failures.Count -eq 0) { 'PASS' } else { 'FAIL' }
$summaryLines = @(
    "verdict      : $verdict",
    "timestamp    : $stamp",
    ("apk          : " + (Split-Path -Leaf $ApkFull)),
    "apk path     : $ApkFull",
    "serial       : $Serial",
    "android api  : $sdkVer ($relVer)",
    "webview      : $webView",
    "component    : $component",
    "screenshot   : $shotPath",
    "logcat       : $logcatPath",
    ("failures     : " + $(if ($script:Failures.Count -eq 0) { 'none' } else { $script:Failures -join ' | ' })),
    ("warnings     : " + $(if ($script:Warnings.Count -eq 0) { 'none' } else { $script:Warnings -join ' | ' }))
)
$summaryText = ($summaryLines -join "`r`n")
$summaryText | Out-File -LiteralPath $summaryPath -Encoding utf8

Write-Host ''
Write-Host '============ SMOKE TEST SUMMARY ============'
Write-Host $summaryText
Write-Host '============================================'
if ($verdict -eq 'PASS') {
    Write-Host '[PASS] APK smoke test passed.' -ForegroundColor Green
    exit 0
} else {
    Write-Host '[FAIL] APK smoke test failed.' -ForegroundColor Red
    exit 1
}
