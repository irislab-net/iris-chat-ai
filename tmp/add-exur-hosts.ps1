$ErrorActionPreference = "Stop"
$outDir = "C:\Users\RescueAdmin\Projects\iris-chat-ai\tmp"
$resultPath = Join-Path $outDir "hosts-exur-result.txt"
$linesPath = Join-Path $outDir "hosts-exur-lines.txt"
$diagPath = Join-Path $outDir "hosts-exur-diag.txt"

try {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

  $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
  $item = Get-Item $hostsPath -Force
  $acl = Get-Acl $hostsPath

  $diag = @(
    "IsAdmin=$isAdmin"
    "User=$($identity.Name)"
    "Attributes=$($item.Attributes)"
    "IsReadOnly=$($item.IsReadOnly)"
    "Owner=$($acl.Owner)"
    "Access:"
  ) + ($acl.Access | ForEach-Object { "  $($_.IdentityReference) | $($_.FileSystemRights) | $($_.AccessControlType)" })
  [System.IO.File]::WriteAllLines($diagPath, $diag)

  if (-not $isAdmin) {
    [System.IO.File]::WriteAllText($resultPath, "ERROR: Not elevated (IsAdmin=False). Approve the UAC prompt.")
    exit 1
  }

  if ($item.IsReadOnly) {
    $item.IsReadOnly = $false
  }

  $entry = "127.0.0.1 local.exur.ai local.irislab.info"
  $raw = [System.IO.File]::ReadAllText($hostsPath)
  if ($raw -match 'local\.exur\.ai') {
    [System.IO.File]::WriteAllText($resultPath, "ALREADY_PRESENT")
  } else {
    $normalized = $raw.TrimEnd("`r", "`n") + "`r`n" + $entry + "`r`n"
    [System.IO.File]::WriteAllText($hostsPath, $normalized)
    [System.IO.File]::WriteAllText($resultPath, "ADDED")
  }

  $lines = @(
    Select-String -Path $hostsPath -Pattern "exur|iris" |
      ForEach-Object { $_.Line }
  )
  [System.IO.File]::WriteAllLines($linesPath, $lines)
}
catch {
  [System.IO.File]::WriteAllText($resultPath, "ERROR: $($_.Exception.Message)")
  exit 1
}
