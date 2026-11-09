# Keeps the Krystle's Cottage app running. Started at boot by the
# "KrystlesCottage-App" scheduled task (see install-autostart.ps1).
# If the app ever stops, it is started again after 5 seconds.

$ErrorActionPreference = 'Continue'
$root   = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'server'
$logDir = Join-Path $root 'logs'
$log    = Join-Path $logDir 'server.log'
$node   = 'C:\Program Files\nodejs\node.exe'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $server   # server/.env is read from the working folder

while ($true) {
  # Keep the log from growing forever: start a fresh one past 10 MB.
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 10MB) {
    Move-Item -Force $log "$log.old"
  }
  Add-Content $log "[$(Get-Date -Format s)] starting app"
  & $node index.js *>> $log
  Add-Content $log "[$(Get-Date -Format s)] app stopped (exit $LASTEXITCODE); restarting in 5s"
  Start-Sleep -Seconds 5
}
