$vault = $env:OBSIDIAN_VAULT

if (-not $vault) {
    $envFile = Join-Path $PSScriptRoot "../.env.local"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^OBSIDIAN_VAULT=(.+)$") { $vault = $matches[1].Trim() }
        }
    }
}

if (-not $vault) {
    Write-Error "OBSIDIAN_VAULT is not set. Copy .env.local.example to .env.local and set your vault path."
    exit 1
}

$dest = "$vault"
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Copy-Item "main.js", "manifest.json", "styles.css" $dest -Force
Write-Host "Deployed to $dest"
