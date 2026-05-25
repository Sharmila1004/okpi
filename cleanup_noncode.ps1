Param(
    [switch]$WhatIf
)
$repo = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $repo "backup_noncode_$ts"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$nonCode = '.md','.pdf','.png','.jpg','.jpeg','.gif','.svg','.ico','.docx','.xlsx','.pptx','.csv','.log'

Get-ChildItem -Path $repo -Recurse -File -Force | Where-Object {
    ($_.Length -eq 0) -or ($nonCode -contains $_.Extension.ToLower())
} | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object {
    $relative = $_.FullName.Substring($repo.Length).TrimStart('\')
    $dest = Join-Path $backup $relative
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    if ($WhatIf) { Write-Output "Would move: $($_.FullName) -> $dest" } else { Move-Item -Path $_.FullName -Destination $dest -Force; Write-Output "Moved: $($_.FullName) -> $dest" }
}

Write-Output "Backup created at: $backup"