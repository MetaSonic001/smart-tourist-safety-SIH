# setup-keycloak-config.bat - Keycloak Configuration Script  
# ============================================================================
@echo off
setlocal EnableDelayedExpansion

echo.
echo =====================================================
echo    Smart Tourist Safety - Keycloak Configuration
echo =====================================================
echo.

REM Check if Keycloak is running
powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:8080' -TimeoutSec 5 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Keycloak is not accessible at http://localhost:8080
    echo Please ensure Keycloak is running first by executing: setup-keycloak.bat
    pause
    exit /b 1
)

echo [INFO] Keycloak is accessible. Starting configuration...

REM Download kcadm tool if not exists
if not exist "kcadm.bat" (
    echo [INFO] Downloading Keycloak Admin CLI...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/keycloak/keycloak/releases/download/22.0.5/keycloak-22.0.5.zip' -OutFile 'keycloak.zip'"
    powershell -Command "Expand-Archive -Path 'keycloak.zip' -DestinationPath '.'"
    copy "keycloak-22.0.5\bin\kcadm.bat" "."
    copy "keycloak-22.0.5\bin\kcadm.sh" "."
    rmdir /s /q "keycloak-22.0.5"
    del "keycloak.zip"
)

REM Set Keycloak admin credentials
set KC_SERVER=http://localhost:8080
set KC_REALM=master
set KC_USERNAME=admin
set KC_PASSWORD=admin123

echo [INFO] Authenticating with Keycloak...
call kcadm.bat config credentials --server %KC_SERVER% --realm %KC_REALM% --user %KC_USERNAME% --password %KC_PASSWORD%

if errorlevel 1 (
    echo ERROR: Failed to authenticate with Keycloak
    echo Please check if Keycloak is fully started and credentials are correct
    pause
    exit /b 1
)

echo [SUCCESS] Authenticated with Keycloak

REM Create the SIH realm
echo [INFO] Creating SIH realm...
call kcadm.bat create realms -s realm=sih -s enabled=true -s "displayName=Smart Tourist Safety" -s sslRequired=none -s registrationAllowed=false

REM Configure realm settings
echo [INFO] Configuring realm security settings...
call kcadm.bat update realms/sih -s "passwordPolicy=length(10) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1)"
call kcadm.bat update realms/sih -s bruteForceProtected=true
call kcadm.bat update realms/sih -s maxFailureWaitSeconds=900
call kcadm.bat update realms/sih -s adminEventsEnabled=true
call kcadm.bat update realms/sih -s eventsEnabled=true

echo [SUCCESS] SIH realm created and configured

REM Switch to SIH realm for remaining operations  
call kcadm.bat config credentials --server %KC_SERVER% --realm sih --user %KC_USERNAME% --password %KC_PASSWORD%

REM Run Python script for detailed configuration
echo [INFO] Running detailed configuration script...
python setup-keycloak-detailed.py

if errorlevel 1 (
    echo [WARNING] Python configuration script failed. Check Python installation.
    echo [INFO] Manual configuration may be required.
)

echo.
echo [SUCCESS] Keycloak setup completed!
echo.
echo Access Details:
echo - Keycloak Admin Console: http://localhost:8080
echo - Admin Username: admin
echo - Admin Password: admin123  
echo - SIH Realm: http://localhost:8080/realms/sih
echo.
echo Test Users Created:
echo - test-admin / Password123!
echo - test-police / Password123!  
echo - test-tourist / Password123!
echo.
pause
