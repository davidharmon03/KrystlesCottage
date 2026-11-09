# Keeps the Krystle's Cottage app running. Started at boot by the
# "KrystlesCottage-App" scheduled task (see install-autostart.ps1).
#
# - If the app stops, it is started again after 5 seconds.
# - To restart it (e.g. after a server code change) without an administrator
#   window, create the file logs\restart-app — scripts\restart-app.ps1 does
#   this and waits until the site answers again.

$ErrorActionPreference = 'Continue'
$root    = Split-Path -Parent $PSScriptRoot
$server  = Join-Path $root 'server'
$logDir  = Join-Path $root 'logs'
$log     = Join-Path $logDir 'server.log'
$flag    = Join-Path $logDir 'restart-app'
$node    = 'C:\Program Files\nodejs\node.exe'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

while ($true) {
  # Keep the log from growing forever: start a fresh one past 10 MB.
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 10MB) {
    Move-Item -Force $log "$log.old"
  }
  Remove-Item $flag -ErrorAction SilentlyContinue
  Add-Content $log "[$(Get-Date -Format s)] starting app"

  # cmd appends the app's output to the log; server/.env is read from $server.
  $p = Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" `
    -ArgumentList '/c', "`"`"$node`" index.js >> `"$log`" 2>&1`"" `
    -WorkingDirectory $server -WindowStyle Hidden -PassThru

  while (-not $p.HasExited) {
    if (Test-Path $flag) {
      & "$env:SystemRoot\System32\taskkill.exe" /PID $p.Id /T /F | Out-Null
      $p.WaitForExit()
      Add-Content $log "[$(Get-Date -Format s)] restart requested"
      break
    }
    Start-Sleep -Seconds 2
  }
  $p.WaitForExit()
  Add-Content $log "[$(Get-Date -Format s)] app stopped (exit $($p.ExitCode)); restarting in 3s"
  Start-Sleep -Seconds 3
}
