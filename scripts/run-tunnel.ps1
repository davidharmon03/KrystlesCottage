# Keeps the Cloudflare Tunnel (krystlescottage.com -> this PC) running. Started at
# boot by the "KrystlesCottage-Tunnel" scheduled task (see install-autostart.ps1).
# If it ever stops, it is started again after 10 seconds.

$ErrorActionPreference = 'Continue'
$root        = Split-Path -Parent $PSScriptRoot
$logDir      = Join-Path $root 'logs'
$log         = Join-Path $logDir 'tunnel.log'
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$config      = 'C:\Users\David\.cloudflared\krystlescottage.yml'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

while ($true) {
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 10MB) {
    Move-Item -Force $log "$log.old"
  }
  Add-Content $log "[$(Get-Date -Format s)] starting tunnel"
  & $cloudflared tunnel --no-autoupdate --config $config run *>> $log
  Add-Content $log "[$(Get-Date -Format s)] tunnel stopped (exit $LASTEXITCODE); restarting in 10s"
  Start-Sleep -Seconds 10
}
