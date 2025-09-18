# setup-keycloak.bat - Windows Batch Script for Keycloak Setup
# ============================================================================
@echo off
setlocal EnableDelayedExpansion

echo.
echo =====================================================
echo    Smart Tourist Safety - Keycloak Setup
echo =====================================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo [INFO] Docker is running...

REM Stop and remove existing Keycloak containers
echo [INFO] Stopping existing Keycloak containers...
docker stop keycloak-sih postgres-keycloak 2>nul
docker rm keycloak-sih postgres-keycloak 2>nul
docker volume rm keycloak_postgres_data 2>nul

echo [INFO] Starting PostgreSQL for Keycloak...
docker run -d ^
  --name postgres-keycloak ^
  --network keycloak-network 2>nul || docker network create keycloak-network ^
  -e POSTGRES_DB=keycloak ^
  -e POSTGRES_USER=keycloak ^
  -e POSTGRES_PASSWORD=keycloak123 ^
  -v keycloak_postgres_data:/var/lib/postgresql/data ^
  -p 5433:5432 ^
  postgres:15-alpine

echo [INFO] Waiting for PostgreSQL to be ready...
timeout /t 15

echo [INFO] Starting Keycloak...
docker run -d ^
  --name keycloak-sih ^
  --network keycloak-network ^
  -e KEYCLOAK_ADMIN=admin ^
  -e KEYCLOAK_ADMIN_PASSWORD=admin123 ^
  -e KC_DB=postgres ^
  -e KC_DB_URL=jdbc:postgresql://postgres-keycloak:5432/keycloak ^
  -e KC_DB_USERNAME=keycloak ^
  -e KC_DB_PASSWORD=keycloak123 ^
  -e KC_HOSTNAME_STRICT=false ^
  -e KC_HTTP_ENABLED=true ^
  -p 8080:8080 ^
  quay.io/keycloak/keycloak:latest start-dev

echo [INFO] Waiting for Keycloak to start (this may take 2-3 minutes)...
timeout /t 120

REM Test if Keycloak is accessible
powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:8080' -TimeoutSec 10 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Keycloak might still be starting. Please wait a few more minutes.
    echo [INFO] You can check status with: docker logs keycloak-sih
    echo [INFO] Keycloak will be available at: http://localhost:8080
    echo [INFO] Admin credentials: admin / admin123
) else (
    echo [SUCCESS] Keycloak is running at: http://localhost:8080
    echo [INFO] Admin credentials: admin / admin123
)

echo.
echo [INFO] Now run the configuration script:
echo        setup-keycloak-config.bat
echo.
pause
