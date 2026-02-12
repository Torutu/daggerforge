$excluded = 'node_modules', 'archive'

# Get all TS/TSX files recursively, excluding the excluded folders
$files = Get-ChildItem -Recurse -Include *.ts, *.tsx -File |
Where-Object { $_.FullName -notmatch ($excluded -join '|') }

# Count lines
$lineCount = ($files | Get-Content | Measure-Object -Line).Lines

Write-Output $lineCount
