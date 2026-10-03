$ErrorActionPreference = "Stop"
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$out = "C:\Users\RescueAdmin\Projects\iris-chat-ai\tmp\hosts-exur-result.txt"
$item = Get-Item $hostsPath -Force
if ($item.IsReadOnly) { $item.IsReadOnly = $false }

$bytes = [System.IO.File]::ReadAllBytes($hostsPath)
$text = [System.Text.Encoding]::ASCII.GetString($bytes)
$text = ($text -replace "`r`n", "`n" -replace "`r", "`n")
$kept = foreach ($line in ($text -split "`n")) {
  if ($line -match 'exur-hosts-test\.local') { continue }
  $line
}
# Ensure exur mappings exist once near top
$without = foreach ($line in $kept) {
  if ($line -match 'local\.exur\.ai' -or $line -match 'local\.irislab\.info') { continue }
  $line
}
$outLines = New-Object System.Collections.Generic.List[string]
$inserted = $false
foreach ($line in $without) {
  $outLines.Add($line)
  if (-not $inserted -and $line -match '^\s*#\s*::1\s+localhost') {
    $outLines.Add("")
    $outLines.Add("127.0.0.1 local.exur.ai")
    $outLines.Add("127.0.0.1 local.irislab.info")
    $outLines.Add("")
    $inserted = $true
  }
}
if (-not $inserted) {
  $tmp = New-Object System.Collections.Generic.List[string]
  $tmp.Add("127.0.0.1 local.exur.ai")
  $tmp.Add("127.0.0.1 local.irislab.info")
  $tmp.Add("")
  foreach ($l in $outLines) { $tmp.Add($l) }
  $outLines = $tmp
}
$final = ($outLines -join "`r`n") + "`r`n"
$ascii = New-Object System.Text.ASCIIEncoding
[System.IO.File]::WriteAllBytes($hostsPath, $ascii.GetBytes($final))
ipconfig /flushdns | Out-Null
$match = Select-String -Path $hostsPath -Pattern "local\.exur\.ai|local\.irislab\.info" | ForEach-Object { $_.Line }
[System.IO.File]::WriteAllLines($out, @("CLEANED") + $match)
