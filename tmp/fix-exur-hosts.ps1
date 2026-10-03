$ErrorActionPreference = "Stop"
$outDir = "C:\Users\RescueAdmin\Projects\iris-chat-ai\tmp"
$resultPath = Join-Path $outDir "hosts-exur-result.txt"
$previewPath = Join-Path $outDir "hosts-exur-preview.txt"

try {
  $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
  $item = Get-Item $hostsPath -Force
  if ($item.IsReadOnly) { $item.IsReadOnly = $false }

  $bytes = [System.IO.File]::ReadAllBytes($hostsPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $bytes = $bytes[3..($bytes.Length - 1)]
  }
  $text = [System.Text.Encoding]::ASCII.GetString($bytes)
  $text = ($text -replace "`r`n", "`n" -replace "`r", "`n")

  # Drop any prior exur/iris local mappings so we can reinsert cleanly at the top
  $filtered = New-Object System.Collections.Generic.List[string]
  foreach ($line in ($text -split "`n")) {
    if ($line -match 'local\.exur\.ai' -or $line -match 'local\.irislab\.info') {
      continue
    }
    $filtered.Add($line)
  }

  $insert = @(
    "127.0.0.1 local.exur.ai"
    "127.0.0.1 local.irislab.info"
  )

  # Insert after the standard localhost comment block if present; else at top
  $out = New-Object System.Collections.Generic.List[string]
  $inserted = $false
  for ($i = 0; $i -lt $filtered.Count; $i++) {
    $out.Add($filtered[$i])
    if (-not $inserted -and $filtered[$i] -match '^\s*#\s*::1\s+localhost') {
      $out.Add("")
      foreach ($e in $insert) { $out.Add($e) }
      $out.Add("")
      $inserted = $true
    }
  }
  if (-not $inserted) {
    $tmp = New-Object System.Collections.Generic.List[string]
    foreach ($e in $insert) { $tmp.Add($e) }
    $tmp.Add("")
    foreach ($l in $out) { $tmp.Add($l) }
    $out = $tmp
  }

  $final = ($out -join "`r`n") + "`r`n"
  $ascii = New-Object System.Text.ASCIIEncoding
  [System.IO.File]::WriteAllBytes($hostsPath, $ascii.GetBytes($final))

  Restart-Service Dnscache -Force -ErrorAction SilentlyContinue
  ipconfig /flushdns | Out-Null
  Start-Sleep -Seconds 1

  $preview = @(
    "=== head ==="
  ) + ($out | Select-Object -First 35) + @(
    "=== ping local.exur.ai ==="
    (ping -n 1 local.exur.ai | Out-String)
    "=== ping local.irislab.info ==="
    (ping -n 1 local.irislab.info | Out-String)
  )
  [System.IO.File]::WriteAllLines($previewPath, $preview)
  [System.IO.File]::WriteAllText($resultPath, "MOVED_TO_TOP")
}
catch {
  [System.IO.File]::WriteAllText($resultPath, "ERROR: $($_.Exception.Message)")
  exit 1
}
