$dest = "C:\Users\waleed\Documents\test\test\.obsidian\plugins\daggerforge"

# Create folder if it doesn't exist
New-Item -ItemType Directory -Path $dest -Force

# Copy files
Copy-Item "main.js", "manifest.json", "styles.css" $dest -Force

Write-Host "Deployed to $dest"
