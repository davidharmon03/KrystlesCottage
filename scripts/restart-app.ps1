# Restarts the live app (to pick up server code changes) — no administrator
# window needed. Signals run-server.ps1, then waits until the site answers.
# Usage: pwsh -File scripts\restart-app.ps1

$root = Split-Path -Parent $PSScriptRoot
$log  = Join-Path $root 'logs\server.log'
$flag = Join-Path $root 'logs\restart-app'
$mark = (Get-Item $log).Length

New-Item -ItemType File -Force -Path $flag | Out-Null
Write-Output 'Restart requested; waiting for the app to come back...'

$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 2
  $new = Get-Content $log -Raw -ErrorAction SilentlyContinue
  if ($new -and $new.Length -gt $mark -and $new.Substring($mark) -match 'Server running on') {
    try {
      $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 5
      if ($r.StatusCode -eq 200) { Write-Output 'App restarted and answering.'; exit 0 }
    } catch {}
  }
}
Write-Output 'The app did not come back within 60 seconds — check logs\server.log.'
exit 1
