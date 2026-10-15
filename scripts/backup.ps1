#Requires -Version 5.1
# Nightly Postgres backup for MediLifetime. Run manually or via Task Scheduler.
# Keeps last 14 dumps in .\backups\ (git-ignored). Test restores monthly.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
if ((Get-Command pg_dump -ErrorAction SilentlyContinue) -eq $null -and (Test-Path (Join-Path $pgBin 'pg_dump.exe'))) {
  $env:Path = "$pgBin;$env:Path"
}
if ((Get-Command pg_dump -ErrorAction SilentlyContinue) -eq $null) { throw 'pg_dump not found. Install PostgreSQL client tools.' }

$envFile = Join-Path $root '.env.local'
$url = if (Test-Path $envFile) { (Select-String -Path $envFile -Pattern '^DATABASE_URL="(.*)"').Matches.Groups[1].Value } else { $env:DATABASE_URL }
if (-not $url) { throw 'DATABASE_URL not found in .env.local or environment.' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$out = Join-Path $backupDir "medilifetime-$stamp.dump"
pg_dump $url -Fc -f $out
Write-Output "Backup written: $out"
Get-ChildItem $backupDir -Filter 'medilifetime-*.dump' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item -Force
Write-Output 'Retention: kept newest 14, older removed.'
Write-Output 'Restore test: pg_restore -d <new_db> <file>  (do this monthly on a scratch database)'
