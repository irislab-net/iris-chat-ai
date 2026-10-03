$ErrorActionPreference = "Continue"
$out = "C:\Users\RescueAdmin\Projects\iris-chat-ai\tmp\hosts-exur-diag2.txt"
$lines = New-Object System.Collections.Generic.List[string]

function Add-Ping([string]$hostName) {
  $lines.Add("=== ping $hostName ===")
  $lines.Add((ping -n 1 $hostName | Out-String))
}

# Control: a hostname that should be forced to 0.0.0.0 via existing hosts entries
Add-Ping "hss.hsselite.com"
Add-Ping "anchorfree.com"
Add-Ping "local.exur.ai"
Add-Ping "local.irislab.info"

# Add a unique test hostname near the top and see if it resolves via hosts
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$item = Get-Item $hostsPath -Force
if ($item.IsReadOnly) { $item.IsReadOnly = $false }
$raw = [System.IO.File]::ReadAllText($hostsPath)
if ($raw -notmatch 'exur-hosts-test\.local') {
  $raw = $raw -replace '(#\t::1\s+localhost\r?\n)', "`$1`r`n127.0.0.1 exur-hosts-test.local`r`n"
  $item.IsReadOnly = $false
  $ascii = New-Object System.Text.ASCIIEncoding
  $normalized = ($raw -replace "`r`n", "`n" -replace "`r", "`n") -replace "`n", "`r`n"
  if ($normalized -notmatch 'exur-hosts-test\.local') {
    $normalized = "127.0.0.1 exur-hosts-test.local`r`n" + $normalized
  }
  [System.IO.File]::WriteAllBytes($hostsPath, $ascii.GetBytes($normalized))
}
ipconfig /flushdns | Out-Null
Add-Ping "exur-hosts-test.local"

$lines.Add("=== Get-DnsClientServerAddress ===")
$lines.Add((Get-DnsClientServerAddress -AddressFamily IPv4 | Format-Table -AutoSize | Out-String))

$lines.Add("=== netsh winhttp proxy ===")
$lines.Add((netsh winhttp show proxy | Out-String))

$lines.Add("=== adapters ===")
$lines.Add((Get-NetAdapter | Where-Object Status -eq 'Up' | Format-Table Name, InterfaceDescription, MacAddress -AutoSize | Out-String))

[System.IO.File]::WriteAllLines($out, $lines)
