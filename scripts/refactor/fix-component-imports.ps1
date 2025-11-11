# Fix Component Imports - Remove Prefix Numbers
# Aktualisiert alle Imports nach der Ordner-Umbenennung (01-layout -> layout, etc.)

$replacements = @{
    '@/components/01-layout' = '@/components/layout'
    '@/components/02-nft' = '@/components/nft'
    '@/components/03-marketplace' = '@/components/marketplace'
    '@/components/05-ui' = '@/components/ui'
    '@/components/06-admin' = '@/components/admin'
    '@/components/08-auth' = '@/components/auth'
    "'./01-layout" = "'./layout"
    "'./02-nft" = "'./nft"
    "'./03-marketplace" = "'./marketplace"
    "'./05-ui" = "'./ui"
    "'./06-admin" = "'./admin"
    "'./08-auth" = "'./auth"
    '"./01-layout' = '"./layout'
    '"./02-nft' = '"./nft'
    '"./03-marketplace' = '"./marketplace'
    '"./05-ui' = '"./ui'
    '"./06-admin' = '"./admin'
    '"./08-auth' = '"./auth'
    "'../01-layout" = "'../layout"
    "'../02-nft" = "'../nft"
    "'../03-marketplace" = "'../marketplace"
    "'../05-ui" = "'../ui"
    "'../06-admin" = "'../admin"
    "'../08-auth" = "'../auth"
    '"../01-layout' = '"../layout'
    '"../02-nft' = '"../nft'
    '"../03-marketplace' = '"../marketplace'
    '"../05-ui' = '"../ui'
    '"../06-admin' = '"../admin'
    '"../08-auth' = '"../auth'
}

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"

# Dateien die aktualisiert werden sollen
$patterns = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.md")

Write-Host "Starte Import-Fix..." -ForegroundColor Cyan
$totalFiles = 0
$modifiedFiles = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $rootPath\src -Filter $pattern -Recurse -File
    
    foreach ($file in $files) {
        $totalFiles++
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace [regex]::Escape($old), $new
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "OK $($file.Name)" -ForegroundColor Green
            $modifiedFiles++
        }
    }
}

# Auch root-level Dateien aktualisieren (README, docs, etc.)
$rootFiles = Get-ChildItem -Path $rootPath -Filter "*.md" -File
foreach ($file in $rootFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        $content = $content -replace [regex]::Escape($old), $new
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "OK $($file.Name)" -ForegroundColor Green
        $modifiedFiles++
    }
}

# Docs aktualisieren
$docsFiles = Get-ChildItem -Path $rootPath\docs -Filter "*.md" -File -ErrorAction SilentlyContinue
foreach ($file in $docsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        $content = $content -replace [regex]::Escape($old), $new
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "OK docs/$($file.Name)" -ForegroundColor Green
        $modifiedFiles++
    }
}

Write-Host ""
Write-Host "=== Fertig! ===" -ForegroundColor Green
Write-Host "Geprufte Dateien: $totalFiles" -ForegroundColor Cyan
Write-Host "Aktualisierte Dateien: $modifiedFiles" -ForegroundColor Yellow
