$path = 'C:\Users\egas1\Downloads\catalog.docx'
$zipPath = 'C:\Users\egas1\Downloads\catalog.zip'
$temp = 'C:\Users\egas1\Downloads\catalog_temp'
$outputPath = 'C:\Users\egas1\Downloads\Stitch_\scratch\catalog_text.txt'

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
Copy-Item $path $zipPath -Force
Expand-Archive -Path $zipPath -DestinationPath $temp -Force
[xml]$xml = Get-Content "$temp\word\document.xml"
$text = $xml.DocumentElement.Body.InnerText
$text | Out-File -FilePath $outputPath -Encoding UTF8

Remove-Item $temp -Recurse -Force
Remove-Item $zipPath -Force
