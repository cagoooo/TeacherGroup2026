param(
  [string]$Notes = "網站內容更新"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$encoding = New-Object System.Text.UTF8Encoding($false)
$versionPath = Join-Path $root "version.json"
$today = Get-Date -Format "yyyy.MM.dd"
$sequence = 1

if (Test-Path -LiteralPath $versionPath) {
  $versionText = [System.IO.File]::ReadAllText($versionPath, [System.Text.Encoding]::UTF8)
  $oldVersion = ($versionText | ConvertFrom-Json).version
  if ($oldVersion -match "^$([regex]::Escape($today))-(\d+)$") {
    $sequence = [int]$Matches[1] + 1
  }
}

$version = "$today-$sequence"
$versionData = [ordered]@{
  version = $version
  notes = $Notes
}
$versionJson = ($versionData | ConvertTo-Json) -replace "`r`n", "`n"
$versionJson = $versionJson -replace '(?m)^ {4}', '  '
$versionJson = $versionJson -replace '(?m)^(\s*"[^"]+":)\s+', '$1 '
[System.IO.File]::WriteAllText($versionPath, ($versionJson.TrimEnd() + "`n"), $encoding)

$swPath = Join-Path $root "sw.js"
$sw = [System.IO.File]::ReadAllText($swPath, [System.Text.Encoding]::UTF8)
$sw = [regex]::Replace($sw, "const BUILD_VERSION = '[^']*';", "const BUILD_VERSION = '$version';")
[System.IO.File]::WriteAllText($swPath, $sw, $encoding)

$indexPath = Join-Path $root "index.html"
$index = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
$index = [regex]::Replace($index, 'window\.SITE_VERSION\s*=\s*[^;]+;', "window.SITE_VERSION = '$version';")
foreach ($asset in @("styles\.css", "site-data\.js", "app\.js", "sw-register\.js", "assets/og-image\.png")) {
  $pattern = '(?<=' + $asset + '\?v=)[^"]+'
  $index = [regex]::Replace($index, $pattern, $version)
}
[System.IO.File]::WriteAllText($indexPath, $index, $encoding)

Write-Host "版本已更新為 $version；已同步 version.json、sw.js、index.html。"
Write-Host "接著請執行 git add -A、git commit、git push。"
