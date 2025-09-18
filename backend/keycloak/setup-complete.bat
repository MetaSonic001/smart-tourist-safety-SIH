# setup-complete.bat - Master Setup Script
# ============================================================================
@echo off
setlocal EnableDelayedExpansion

echo.
echo ========================================================
echo    Smart Tourist Safety - Complete Keycloak Setup
echo ========================================================
echo.
echo This script will:
echo 1. Stop any existing Keycloak containers
echo 2. Start fresh Keycloak with PostgreSQL
echo 3. Configure realm, roles, clients, and users
echo 4. Generate client secrets for your services
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Setup cancelled.
    exit /b 0
)

echo.
echo [STEP 1] Cleaning up existing containers...
docker-compose -f docker-compose-keycloak.yml down -v 2>nul
docker container stop keycloak-sih postgres-keycloak 2>nul
docker container rm keycloak-sih postgres-keycloak 2>nul
docker volume rm keycloak_postgres_data keycloak_data 2>nul

echo [STEP 2] Starting Keycloak infrastructure...
docker-compose -f docker-compose-keycloak.yml up -d

echo [STEP 3] Waiting for services to be ready...
echo This may take 2-3 minutes on first startup...

REM Wait for Keycloak health check
:wait_loop
timeout /t 10 >nul
docker exec keycloak-sih curl -f http://localhost:8080/health/ready >nul 2>&1
if errorlevel 1 (
    echo Still waiting for Keycloak...
    goto wait_loop
)

echo [SUCCESS] Keycloak is ready!

echo [STEP 4] Running configuration script...
python setup-keycloak-detailed.py

if errorlevel 1 (
    echo [ERROR] Configuration script failed. 
    echo Please check Python installation and try again.
    echo You can run the configuration manually:
    echo   python setup-keycloak-detailed.py
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    🎉 SETUP COMPLETED SUCCESSFULLY!
echo ========================================================
echo.
echo 📍 Access Information:
echo   Keycloak Admin: http://localhost:8080/admin/
echo   Username: admin
echo   Password: admin123
echo.
echo   SIH Realm: http://localhost:8080/realms/sih
echo   Token Endpoint: http://localhost:8080/realms/sih/protocol/openid-connect/token
echo.
echo 🔐 Client secrets saved to: keycloak-client-secrets.env
echo    Share this file with your team (keep it secure!)
echo.
echo 👥 Test Users (password: Password123!):
echo   test-admin, test-police, test-tourism
echo   test-operator, test-hotel, test-tourist
echo.
echo 📝 Next Steps:
echo   1. Copy keycloak-client-secrets.env to your microservices
echo   2. Update your .env files with the client secrets
echo   3. Set USE_KEYCLOAK=true in your services
echo   4. Test authentication with your applications
echo.
pause
