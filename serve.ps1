$ErrorActionPreference = 'Stop'
$port = 8001
$root = $PSScriptRoot
$allowedFiles = @('index.html', 'styles.css', 'script.js')
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)

try {
  $listener.Start()
  Write-Host "Alfaecom disponible en http://localhost:$port/ (Ctrl+C para detener)"

  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while (($header = $reader.ReadLine()) -ne $null -and $header.Length -gt 0) { }

      $requestedPath = '/'
      if ($requestLine -match '^\S+\s+(\S+)\s+HTTP/') { $requestedPath = $Matches[1] }
      $relativePath = [Uri]::UnescapeDataString(($requestedPath.Split('?')[0]).TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }

      if ($relativePath -notin $allowedFiles) {
        $status = '404 Not Found'
        $contentType = 'text/plain; charset=utf-8'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      } else {
        $filePath = Join-Path $root $relativePath
        $body = [System.IO.File]::ReadAllBytes($filePath)
        $status = '200 OK'
        $contentType = switch ([System.IO.Path]::GetExtension($filePath)) {
          '.css' { 'text/css; charset=utf-8' }
          '.js' { 'text/javascript; charset=utf-8' }
          default { 'text/html; charset=utf-8' }
        }
      }

      $headerText = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } catch {
      Write-Warning $_.Exception.Message
    } finally {
      if ($client) { $client.Dispose() }
    }
  }
} finally {
  $listener.Stop()
}
