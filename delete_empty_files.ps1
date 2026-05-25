Param(
    [switch]$Force
)
$repo = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Write-Output "Scanning for zero-byte files in: $repo (excluding node_modules)"
$empties = Get-ChildItem -Path $repo -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -eq 0 -and ($_.FullName -notmatch '\\node_modules\\') }
if (-not $empties) { Write-Output "No zero-byte files found."; exit 0 }
Write-Output "Found $($empties.Count) zero-byte files:"; $empties | ForEach-Object { Write-Output " - $($_.FullName)" }

if ($Force) {
    Write-Output "Deleting files..."
    $empties | ForEach-Object {
        try {
            Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop
            Write-Output "Deleted: $($_.FullName)"
        } catch {
            Write-Output "Failed to delete: $($_.FullName) - $($_.Exception.Message)"
        }
    }
    Write-Output "Deletion complete."
} else {
    Write-Output "Run the script with -Force to delete these files. Example: .\delete_empty_files.ps1 -Force"
}