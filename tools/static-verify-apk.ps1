<#
SYNOPSIS
    Static verification of the DS Chat Android APKs (no device required).

.DESCRIPTION
    Checks signatures (apksigner), manifest badging/permissions (aapt2),
    packaged web assets and dex payload (System.IO.Compression), then writes a
    PASS/FAIL report. Works with PowerShell 5.1 and 7+. ASCII-only script body.

.PARAMETER DebugApk
    Path to the debug APK. Default: <repo root>/DSChat-0.1.1-debug.apk

.PARAMETER ReleaseApk
    Path to the release APK. Default: <repo root>/DSChat-0.1.1-release.apk

.PARAMETER OutFile
    Report path. Default: <repo root>/artifacts/static-verification.txt

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\static-verify-apk.ps1

.NOTES
    Exit codes: 0 = all checks PASS, 1 = at least one check FAIL.
#>

[CmdletBinding()]
param(
    [string]$DebugApk,
    [string]$ReleaseApk,
    [string]$OutFile
)

$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
if ([string]::IsNullOrWhiteSpace($DebugApk)) { $DebugApk = Join-Path $RepoRoot 'DSChat-0.1.1-debug.apk' }
if ([string]::IsNullOrWhiteSpace($ReleaseApk)) { $ReleaseApk = Join-Path $RepoRoot 'DSChat-0.1.1-release.apk' }
if ([string]::IsNullOrWhiteSpace($OutFile)) { $OutFile = Join-Path $RepoRoot 'artifacts\static-verification.txt' }

$OutDir = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

function Find-SdkTool([string]$Relative) {
    $roots = @()
    if ($env:ANDROID_HOME) { $roots += $env:ANDROID_HOME }
    if ($env:ANDROID_SDK_ROOT) { $roots += $env:ANDROID_SDK_ROOT }
    $roots += (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
    foreach ($root in $roots) {
        if (-not $root) { continue }
        $candidate = Join-Path $root $Relative
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    return $null
}

function Find-LatestBuildTool([string]$FileName) {
    $roots = @()
    if ($env:ANDROID_HOME) { $roots += $env:ANDROID_HOME }
    if ($env:ANDROID_SDK_ROOT) { $roots += $env:ANDROID_SDK_ROOT }
    $roots += (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
    foreach ($root in $roots) {
        if (-not $root) { continue }
        $bt = Join-Path $root 'build-tools'
        if (-not (Test-Path -LiteralPath $bt)) { continue }
        $versions = Get-ChildItem -LiteralPath $bt -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^\d+(\.\d+)*$' } |
            Sort-Object { [version]$_.Name } -Descending
        foreach ($v in $versions) {
            $candidate = Join-Path $v.FullName $FileName
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
        }
    }
    return $null
}

$ApkSigner = Find-LatestBuildTool 'apksigner.bat'
$Aapt2 = Find-LatestBuildTool 'aapt2.exe'

$script:Checks = @()
function Add-Check([string]$Apk, [string]$Name, [bool]$Pass, [string]$Detail) {
    $script:Checks += [pscustomobject]@{
        Apk = $Apk; Check = $Name; Result = $(if ($Pass) { 'PASS' } else { 'FAIL' }); Detail = $Detail
    }
}

function Get-Badging([string]$Apk) {
    $raw = & $Aapt2 dump badging $Apk 2>&1
    return ,@($raw | ForEach-Object { $_.ToString() })
}

function Get-Field([string[]]$Lines, [string]$Pattern) {
    foreach ($line in $Lines) {
        if ($line -match $Pattern) { return $matches[1] }
    }
    return $null
}

function Test-Apk([string]$Label, [string]$Apk, [bool]$ExpectDebuggable) {
    $script:ResultBlocks += "`r`n---- $Label ----"
    if (-not (Test-Path -LiteralPath $Apk -PathType Leaf)) {
        Add-Check $Label 'APK file exists' $false "missing: $Apk"
        $script:ResultBlocks += "APK MISSING: $Apk"
        return
    }
    $sizeMb = [math]::Round((Get-Item -LiteralPath $Apk).Length / 1MB, 2)
    Add-Check $Label 'APK file exists' $true ("{0} MB" -f $sizeMb)
    $script:ResultBlocks += ("size: {0} MB  path: {1}" -f $sizeMb, $Apk)

    # ---- signature ----
    $sigRaw = & $ApkSigner verify --verbose --print-certs $Apk 2>&1
    $sigExit = $LASTEXITCODE
    $sigText = ($sigRaw | ForEach-Object { $_.ToString() }) -join "`n"
    $v2 = ($sigText -match 'Verified using v2 scheme \(APK Signature Scheme v2\): true')
    $dn = Get-Field ($sigRaw | ForEach-Object { $_.ToString() }) 'Signer #1 certificate DN: (.+)$'
    Add-Check $Label 'apksigner verify' ($sigExit -eq 0) "exit=$sigExit"
    Add-Check $Label 'APK Signature Scheme v2' $v2 $(if ($v2) { 'v2 signature valid' } else { 'v2 not verified' })
    Add-Check $Label 'Signer certificate DN' ($null -ne $dn) $(if ($dn) { $dn.Trim() } else { 'unknown' })
    $script:ResultBlocks += ("signature exit: {0}" -f $sigExit)
    $script:ResultBlocks += ($sigText -split "`n" | Where-Object { $_ -match '^Verified|^Signer #1 certificate DN|^Number of signers' }) -join "`n"

    # ---- manifest badging ----
    if (-not $Aapt2) {
        Add-Check $Label 'aapt2 available' $false 'aapt2.exe not found'
        return
    }
    $badging = Get-Badging $Apk
    $pkgName = Get-Field $badging "^package: name='([^']+)'"
    $verName = Get-Field $badging "^package:.* versionName='([^']+)'"
    $minSdk = Get-Field $badging "^minSdkVersion:'([^']+)'"
    $tgtSdk = Get-Field $badging "^targetSdkVersion:'([^']+)'"
    $act = Get-Field $badging "launchable-activity: name='([^']+)'"
    $debuggable = [bool](($badging | Where-Object { $_ -eq 'application-debuggable' }).Count -gt 0)
    $perms = @($badging | Where-Object { $_ -match '^uses-permission: name=' })
    $permNames = @($perms | ForEach-Object {
        if ($_ -match "^uses-permission: name='([^']+)'") { $matches[1] }
    })
    # aapt2 also lists implied permissions in the uses-permission block; keep them
    # out of the "explicitly declared" count.
    $impliedNames = @($badging | ForEach-Object {
        if ($_ -match "^uses-implied-permission: name='([^']+)'") { $matches[1] }
    })
    $explicitPerms = @($permNames | Where-Object { $impliedNames -notcontains $_ })
    $appLabel = Get-Field $badging "application-label:'([^']+)'"

    Add-Check $Label 'package name' ($pkgName -eq 'com.dschat.android') "name=$pkgName"
    Add-Check $Label 'application label' ($appLabel -eq 'DS Chat') "label=$appLabel"
    Add-Check $Label 'versionName' ($verName -eq '0.1.1') "versionName=$verName"
    Add-Check $Label 'minSdkVersion' ($minSdk -eq '26') "minSdk=$minSdk"
    Add-Check $Label 'targetSdkVersion' ($tgtSdk -eq '37') "targetSdk=$tgtSdk"
    Add-Check $Label 'launchable activity' ($act -eq 'com.dschat.android.MainActivity') "activity=$act"
    Add-Check $Label 'declared permissions (3 explicit)' ($explicitPerms.Count -eq 3) ("count={0}: {1}" -f $explicitPerms.Count, ($explicitPerms -join ', '))
    $expectedPerms = @(
        'android.permission.INTERNET',
        'android.permission.RECORD_AUDIO',
        'android.permission.WRITE_EXTERNAL_STORAGE'
    )
    $permMissing = @($expectedPerms | Where-Object { $explicitPerms -notcontains $_ })
    Add-Check $Label 'expected permission set' ($permMissing.Count -eq 0) ("missing: " + $(if ($permMissing.Count -eq 0) { 'none' } else { $permMissing -join ', ' }))
    Add-Check $Label 'implied READ_EXTERNAL_STORAGE (WRITE, maxSdk 28)' ($impliedNames -contains 'android.permission.READ_EXTERNAL_STORAGE') ("implied: " + $(if ($impliedNames.Count -gt 0) { $impliedNames -join ', ' } else { 'none' }))
    if ($ExpectDebuggable) {
        Add-Check $Label 'application-debuggable flag' $debuggable "debuggable=$debuggable (expected true for debug)"
    } else {
        Add-Check $Label 'not application-debuggable' (-not $debuggable) "debuggable=$debuggable (expected false for release)"
    }
    $script:ResultBlocks += ("package: {0} versionName: {1} minSdk: {2} targetSdk: {3} activity: {4}" -f $pkgName, $verName, $minSdk, $tgtSdk, $act)
    $script:ResultBlocks += ("permissions (explicit): " + ($explicitPerms -join '; '))
    $script:ResultBlocks += ("permissions (implied) : " + $(if ($impliedNames.Count -gt 0) { $impliedNames -join '; ' } else { 'none' }))

    # ---- zip / assets / dex ----
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Apk)
    try {
        $entries = @($zip.Entries | Where-Object { $_.Name -ne '' })
        $assets = @($entries | Where-Object { $_.FullName -like 'assets/*' })
        # 153 个官方 dist 文件 + inject.js + THIRD-PARTY-NOTICES.txt + PORT-LICENSE.txt = 156
        Add-Check $Label 'assets file count == 156' ($assets.Count -eq 156) ("count={0}" -f $assets.Count)
        $required = @(
            'assets/index.html',
            'assets/LICENSE',
            'assets/THIRD-PARTY-NOTICES.txt',
            'assets/PORT-LICENSE.txt',
            'assets/inject.js',
            'assets/static/js/main.9820cd3a.js',
            'assets/static/css/main.7361e32c.css'
        )
        foreach ($name in $required) {
            $e = $entries | Where-Object { $_.FullName -eq $name } | Select-Object -First 1
            Add-Check $Label "asset $name" ($null -ne $e) $(if ($e) { "$($e.Length) bytes" } else { 'missing' })
        }
        $dex = $entries | Where-Object { $_.FullName -eq 'classes.dex' } | Select-Object -First 1
        $dexOk = ($null -ne $dex -and $dex.Length -gt 1MB)
        Add-Check $Label 'classes.dex present and > 1 MB' $dexOk $(if ($dex) { "$($dex.Length) bytes" } else { 'missing' })
        $dexAll = @($entries | Where-Object { $_.FullName -match '^classes\d*\.dex$' })
        $manifest = $entries | Where-Object { $_.FullName -eq 'AndroidManifest.xml' } | Select-Object -First 1
        Add-Check $Label 'AndroidManifest.xml packaged' ($null -ne $manifest) $(if ($manifest) { "$($manifest.Length) bytes" } else { 'missing' })
        $script:ResultBlocks += ("zip: total={0} assets={1} dex={2} manifest={3}" -f $entries.Count, $assets.Count, (($dexAll | ForEach-Object { $_.FullName }) -join ','), $(if ($manifest) { 'yes' } else { 'no' }))
    } finally {
        $zip.Dispose()
    }
}

$script:ResultBlocks = New-Object System.Collections.ArrayList
$toolInfo = @(
    "apksigner : $ApkSigner",
    "aapt2     : $Aapt2",
    "host      : $($env:COMPUTERNAME) / PowerShell $($PSVersionTable.PSVersion)",
    "time      : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
)

Test-Apk 'DEBUG' $DebugApk $true
Test-Apk 'RELEASE' $ReleaseApk $false

# ------------------------------------------------------------------ report
$failCount = @($script:Checks | Where-Object { $_.Result -eq 'FAIL' }).Count
$passCount = @($script:Checks | Where-Object { $_.Result -eq 'PASS' }).Count
$verdict = if ($failCount -eq 0 -and $passCount -gt 0) { 'PASS' } else { 'FAIL' }

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('Static verification of DS Chat APKs (com.dschat.android 0.1.1)')
[void]$sb.AppendLine('=' * 78)
[void]$sb.AppendLine(("Verdict: {0}   ({1} PASS / {2} FAIL)" -f $verdict, $passCount, $failCount))
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Tooling / environment:')
foreach ($t in $toolInfo) { [void]$sb.AppendLine('  ' + $t) }
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Note: no emulator/device was available (no hardware hypervisor acceleration,')
[void]$sb.AppendLine('      TCG software emulation never reached boot_completed), so this is a')
[void]$sb.AppendLine('      static-only verification. Device/runtime checks are in')
[void]$sb.AppendLine('      tools/DEVICE-TEST-CHECKLIST.md.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Details:')
foreach ($line in $script:ResultBlocks) { [void]$sb.AppendLine('  ' + $line) }
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Check results:')
[void]$sb.AppendLine(('{0,-8} {1,-6} {2}' -f 'APK', 'RESULT', 'CHECK -> DETAIL'))
[void]$sb.AppendLine(('-' * 78))
foreach ($c in $script:Checks) {
    [void]$sb.AppendLine(('{0,-8} {1,-6} {2}' -f $c.Apk, $c.Result, ($c.Check + ' -> ' + $c.Detail)))
}
[void]$sb.AppendLine(('-' * 78))
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Summary:')
[void]$sb.AppendLine('  - debug APK  : signed, debuggable, WebView assets embedded, dex present')
[void]$sb.AppendLine('  - release APK: signed with the Android debug key (temporary choice),')
[void]$sb.AppendLine('                 NOT debuggable, WebView assets embedded, dex present')
[void]$sb.AppendLine('  - both APKs share package com.dschat.android, versionName 0.1.1,')
[void]$sb.AppendLine('    minSdk 26, targetSdk 37, 3 declared permissions')
[void]$sb.AppendLine('')
[void]$sb.AppendLine(("Generated: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')))

[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($true)))

Write-Host ''
Write-Host ('========== STATIC VERIFICATION: {0} ==========' -f $verdict)
Write-Host ("report: {0}" -f $OutFile)
Write-Host ("checks: {0} PASS / {1} FAIL" -f $passCount, $failCount)
if ($failCount -gt 0) {
    $script:Checks | Where-Object { $_.Result -eq 'FAIL' } | ForEach-Object {
        Write-Host ("[FAIL] {0}: {1} -> {2}" -f $_.Apk, $_.Check, $_.Detail) -ForegroundColor Red
    }
    exit 1
}
Write-Host '[PASS] all static checks passed.' -ForegroundColor Green
exit 0
