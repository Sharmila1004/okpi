# Start full OKPI stack (Docker). Gateway: http://localhost:18080  Eureka UI: http://localhost:8762
Set-Location $PSScriptRoot
docker compose up -d --build
docker compose ps
