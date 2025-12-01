# Archive legacy .js files that have a .ts/.tsx counterpart
# Usage: run from repo root in PowerShell (Windows)
# This script will:
# - create a branch `chore/archive-legacy` (if it doesn't exist)
# - find all `src/**/*.js` files (excluding `src/_old_js` and existing `archive/legacy`)
# - for each .js that has a same-basename .ts or .tsx in the same folder, it will `git mv` it to `archive/legacy/<same relative path>`
# - write a CSV report to `archive/move-report.csv`
# - commit the changes

param(
    [switch]$WhatIfOnly
)

Write-Host "Starting archive legacy script"
$branch = "chore/archive-legacy"

# Ensure git repo
if (-not (Test-Path ".git")) {
    Write-Error "Not a git repository (no .git folder). Run this from the repo root."
    exit 1
}

# Create branch (if not exists)
$existing = git rev-parse --verify $branch 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating branch $branch"
    git checkout -b $branch
} else {
    Write-Host "Checking out branch $branch"
    git checkout $branch
}

$repoRoot = Get-Location
$jsFiles = Get-ChildItem -Path "src" -Recurse -Include *.js -File | Where-Object { $_.FullName -notmatch "\\src\\_old_js\\" -and $_.FullName -notmatch "archive\\legacy" }

if ($jsFiles.Count -eq 0) {
    Write-Host "No .js files found under src/"
    exit 0
}

$report = @()
foreach ($f in $jsFiles) {
    $dir = $f.DirectoryName
    $base = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    $tsPath = Join-Path $dir ($base + ".ts")
    $tsxPath = Join-Path $dir ($base + ".tsx")

    if (Test-Path $tsPath -or Test-Path $tsxPath) {
        # candidate to archive
        $rel = Resolve-Path -Relative $f.FullName
        $relDir = Split-Path $rel -Parent
        $destDir = Join-Path "archive/legacy" $relDir
        $destPath = Join-Path $destDir $f.Name

        $report += [PSCustomObject]@{
            original = $rel
            destination = (Join-Path $destDir $f.Name)
            reason = "has .ts or .tsx counterpart"
        }

        if ($WhatIfOnly) {
            Write-Host "[whatif] git mv $rel -> $destPath"
        } else {
            if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
            git mv $rel $destPath
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "git mv failed for $rel -> $destPath"
            } else {
                Write-Host "Moved: $rel -> $destPath"
            }
        }
    }
}

# write report
$reportPath = "archive/move-report.csv"
if (-not (Test-Path "archive")) { New-Item -ItemType Directory -Path "archive" -Force | Out-Null }
$report | Export-Csv -Path $reportPath -NoTypeInformation -Force

if (-not $WhatIfOnly) {
    git add -A archive
    git commit -m "chore: archive legacy .js files that have .ts/.tsx counterparts" || Write-Host "Nothing to commit or commit failed"
    Write-Host "Committed changes on branch $branch. Report: $reportPath"
} else {
    Write-Host "WhatIfOnly: no git mv executed. Report saved to $reportPath"
}

Write-Host "Done. Review archive/move-report.csv and run script without -WhatIfOnly to perform changes."
