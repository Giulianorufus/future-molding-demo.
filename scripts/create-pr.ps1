$ErrorActionPreference = "Stop"

$branch = (git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($branch)) { throw "Branch corrente non trovato" }

$title = "Step 6: recipe export samples + smoke pdf"
$body = @"
- Smoke PDF via tsx (`npm run smoke:pdf`)
- Sample exports (json/csv/pdf) via `npm run samples:recipe`
- README usage
- Fix download.ts (TS/CI)
"@

gh pr create --base maestro --head $branch --title $title --body $body
