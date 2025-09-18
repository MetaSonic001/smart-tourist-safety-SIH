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

REM Wait for Keycloak with timeout and better health check
set /a counter=0
set /a max_attempts=60

:wait_loop
set /a counter+=1
echo Checking Keycloak readiness... (attempt %counter%/%max_attempts%)

REM Try multiple health check methods
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/realms/master' -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Keycloak is ready!
    goto configure
)

REM Alternative check - try admin console
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/admin/' -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Keycloak is ready!
    goto configure
)

REM Check if we've exceeded max attempts
if %counter% geq %max_attempts% (
    echo [WARNING] Keycloak health check timed out after %max_attempts% attempts.
    echo However, attempting to run configuration anyway...
    echo You can check Keycloak manually at: http://localhost:8080/admin/
    goto configure
)

timeout /t 10 >nul
goto wait_loop

:configure
echo [STEP 4] Running configuration script...

REM Check if Python is available
python --version >nul 2>&1
if not errorlevel 1 (
    python setup-keycloak-detailed.py
    goto check_result
)

python3 --version >nul 2>&1
if not errorlevel 1 (
    python3 setup-keycloak-detailed.py
    goto check_result
)

echo [ERROR] Python not found. Please install Python 3.7+ and run:
echo   python setup-keycloak-detailed.py
echo.
echo Or configure Keycloak manually at: http://localhost:8080/admin/
echo Admin credentials: admin / admin123
pause
exit /b 1

:check_result
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
echo 📋 Daily Usage:
echo   daily-usage.bat - Start/stop/manage Keycloak
echo.
pause