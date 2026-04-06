$content = Get-Content 'index.html' -Raw
$content = $content -replace '<script src="https://cdn.tailwindcss.com[^"]*"></script>', ''
$content = $content -replace '<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="tailwind-output.css">' + "`n" + '<link rel="stylesheet" href="style.css">'
Set-Content 'index.html' -Value $content -NoNewline
Write-Host "Done index.html"

$content = Get-Content 'studio.html' -Raw
$content = $content -replace '<script src="https://cdn.tailwindcss.com[^"]*"></script>', ''
$content = $content -replace '<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="tailwind-output.css">' + "`n" + '<link rel="stylesheet" href="style.css">'
Set-Content 'studio.html' -Value $content -NoNewline
Write-Host "Done studio.html"

$content = Get-Content 'sign-in.html' -Raw
$content = $content -replace '<script src="https://cdn.tailwindcss.com[^"]*"></script>', ''
$content = $content -replace '<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="tailwind-output.css">' + "`n" + '<link rel="stylesheet" href="style.css">'
Set-Content 'sign-in.html' -Value $content -NoNewline
Write-Host "Done sign-in.html"

$content = Get-Content 'sign-up.html' -Raw
$content = $content -replace '<script src="https://cdn.tailwindcss.com[^"]*"></script>', ''
$content = $content -replace '<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="tailwind-output.css">' + "`n" + '<link rel="stylesheet" href="style.css">'
Set-Content 'sign-up.html' -Value $content -NoNewline
Write-Host "Done sign-up.html"
