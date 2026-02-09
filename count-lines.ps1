$excluded = 'node_modules', 'archive'

# Get all TS/TSX files recursively, excluding the excluded folders
$files = Get-ChildItem -Recurse -Include *.ts, *.tsx -File | Where-Object {
    $excludeMatch = $false
    foreach ($folder in $excluded) {
        if ($_.FullName -match $folder) { $excludeMatch = $true }
    }
    -not $excludeMatch
}

# Count lines
$lineCount = ($files | Get-Content | Measure-Object -Line).Lines

Write-Output $lineCount
