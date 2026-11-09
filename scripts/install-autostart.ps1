# Registers two scheduled tasks so the site comes back on its own after every
# restart, with nobody signed in:
#   KrystlesCottage-App     runs scripts\run-server.ps1  (the app on 127.0.0.1:3001)
#   KrystlesCottage-Tunnel  runs scripts\run-tunnel.ps1  (Cloudflare Tunnel)
# Both run at startup as SYSTEM. Needs an administrator window (Windows asks once).
# Safe to run again: it replaces the tasks. To remove them:
#   Unregister-ScheduledTask KrystlesCottage-App, KrystlesCottage-Tunnel -Confirm:$false

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
# PowerShell 7, so the logs are plain UTF-8 (Windows PowerShell 5 writes UTF-16).
$ps   = 'C:\Program Files\PowerShell\7\pwsh.exe'

$tasks = @{
  'KrystlesCottage-App'    = Join-Path $here 'run-server.ps1'
  'KrystlesCottage-Tunnel' = Join-Path $here 'run-tunnel.ps1'
}

$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$trigger   = New-ScheduledTaskTrigger -AtStartup
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -StartWhenAvailable -MultipleInstances IgnoreNew

foreach ($name in $tasks.Keys) {
  $action = New-ScheduledTaskAction -Execute $ps `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$($tasks[$name])`""
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Description "Krystle's Cottage website (C:\Projects\KrystlesCottage)" -Force | Out-Null
  Start-ScheduledTask -TaskName $name
  Write-Output "registered and started $name"
}
