# $Project = "C:\projects\CodeAlpha_RealTimeChat"
# $Cloudflared = "$HOME\Downloads\cloudflared.exe"
# $SignalFile = "$Project\signaling_url.txt"

# Write-Host "========================================"
# Write-Host " RealTimeChat Development Startup"
# Write-Host "========================================"

# # Start Django
# Write-Host "`n[1/4] Starting Django..."

# Start-Process powershell `
#     -ArgumentList "-NoExit", "-Command", `
#     "cd '$Project'; .\venv\Scripts\Activate.ps1; python manage.py runserver 0.0.0.0:8000"

# Start-Sleep -Seconds 3


# # Start Node.js signaling server
# Write-Host "[2/4] Starting Socket.io signaling server..."

# Start-Process powershell `
#     -ArgumentList "-NoExit", "-Command", `
#     "cd '$Project\signaling'; node server.js"

# Start-Sleep -Seconds 3


# # Start Socket.io Cloudflare tunnel
# Write-Host "[3/4] Starting Socket.io Cloudflare tunnel..."

# $SocketLog = "$Project\socket_tunnel.log"

# if (Test-Path $SocketLog) {
#     Remove-Item $SocketLog -Force
# }

# Start-Process powershell `
#     -ArgumentList "-Command", `
#     "cd '$HOME\Downloads'; .\cloudflared.exe tunnel --url http://127.0.0.1:3000 2>&1 | Tee-Object -FilePath '$SocketLog'"


# Write-Host "Waiting for Socket.io tunnel URL..."

# $SocketURL = $null

# for ($i = 1; $i -le 30; $i++) {

#     Start-Sleep -Seconds 1

#     if (Test-Path $SocketLog) {

#         $Match = Select-String `
#             -Path $SocketLog `
#             -Pattern "https://[a-zA-Z0-9-]+\.trycloudflare\.com" `
#             | Select-Object -First 1

#         if ($Match) {
#             $SocketURL = $Match.Matches.Value
#             break
#         }
#     }
# }

# if ($SocketURL) {

#     Write-Host ""
#     Write-Host "Socket.io URL detected:"
#     Write-Host $SocketURL

#     Set-Content `
#         -Path $SignalFile `
#         -Value $SocketURL

# } else {

#     Write-Host ""
#     Write-Host "WARNING: Could not automatically detect Socket.io URL."
#     Write-Host "Using localhost fallback."

#     Set-Content `
#         -Path $SignalFile `
#         -Value "http://localhost:3000"
# }


# # Start Django Cloudflare tunnel
# Write-Host "`n[4/4] Starting Django Cloudflare tunnel..."

# Start-Process powershell `
#     -ArgumentList "-NoExit", "-Command", `
#     "cd '$HOME\Downloads'; .\cloudflared.exe tunnel --url http://127.0.0.1:8000"


# Write-Host ""
# Write-Host "========================================"
# Write-Host " RealTimeChat startup complete"
# Write-Host "========================================"
# Write-Host ""

# Write-Host "Socket.io:"
# Write-Host $SocketURL

# Write-Host ""
# Write-Host "Django URL will appear in the Cloudflare window."
# Write-Host ""
# Write-Host "Keep all opened PowerShell windows running."