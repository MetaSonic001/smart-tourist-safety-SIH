@echo off
echo ===============================================
echo   SIH Blockchain - Fabric Environment Setup
echo ===============================================
echo.
echo This script will download Hyperledger Fabric
echo samples and binaries required for the project.
echo.

REM Check if already downloaded
if exist "fabric-samples" (
    echo [INFO] Fabric samples already exist.
    echo [INFO] If you need to reinstall, delete the 'fabric-samples' folder first.
    pause
    exit /b 0
)

echo [INFO] Downloading Hyperledger Fabric v2.5.4...
echo [INFO] This will take 5-15 minutes depending on your internet speed...
echo.

REM Create temporary directory for download
if not exist "temp" mkdir temp
cd temp

REM Download the installation script
echo [INFO] Downloading Fabric installer...
curl -sSL https://bit.ly/2ysbOFE > install-fabric.sh

if %errorlevel% neq 0 (
    echo [ERROR] Failed to download Fabric installer.
    echo [ERROR] Please check your internet connection.
    echo.
    echo Manual download instructions:
    echo 1. Go to: https://github.com/hyperledger/fabric-samples
    echo 2. Download and extract to parent directory
    echo 3. Download binaries from: https://github.com/hyperledger/fabric/releases
    pause
    exit /b 1
)

REM Execute the installer
echo [INFO] Installing Fabric samples and binaries...
bash install-fabric.sh 2.5.4 1.5.7

if %errorlevel% neq 0 (
    echo [ERROR] Installation failed.
    echo [INFO] Trying alternative method...
    
    REM Alternative: Direct download
    echo [INFO] Downloading fabric-samples manually...
    curl -L https://github.com/hyperledger/fabric-samples/archive/v2.5.4.zip -o fabric-samples.zip
    
    if exist fabric-samples.zip (
        echo [INFO] Extracting fabric-samples...
        tar -xf fabric-samples.zip
        move fabric-samples-2.5.4 ..\fabric-samples
        
        echo [INFO] Downloading binaries...
        curl -L https://github.com/hyperledger/fabric/releases/download/v2.5.4/hyperledger-fabric-windows-amd64-2.5.4.tar.gz -o fabric-binaries.tar.gz
        tar -xf fabric-binaries.tar.gz -C ..\fabric-samples\
        
        echo [SUCCESS] Manual installation completed!
    ) else (
        echo [ERROR] All installation methods failed.
        echo Please download manually from GitHub.
        pause
        exit /b 1
    )
) else (
    REM Move fabric-samples to parent directory
    if exist "fabric-samples" (
        move fabric-samples ..\ 
        echo [SUCCESS] Fabric samples installed successfully!
    )
)

REM Cleanup
cd ..
rmdir /s /q temp

echo.
echo [INFO] Installation Summary:
echo ✓ Fabric samples downloaded
echo ✓ Fabric binaries installed  
echo ✓ Docker Compose files ready
echo.

REM Add to PATH
echo [INFO] Adding Fabric binaries to PATH...
set FABRIC_BIN_PATH=%cd%\fabric-samples\bin
setx PATH "%PATH%;%FABRIC_BIN_PATH%" /M

echo [INFO] PATH updated. You may need to restart Command Prompt.
echo.

REM Verify installation
echo [INFO] Verifying installation...
if exist "fabric-samples\bin\peer.exe" (
    echo ✓ Peer binary found
) else (
    echo ✗ Peer binary missing
)

if exist "fabric-samples\test-network" (
    echo ✓ Test network found
) else (
    echo ✗ Test network missing  
)

echo.
echo ===============================================
echo            Installation Complete!
echo ===============================================
echo.
echo Next Steps:
echo 1. Restart Command Prompt (to refresh PATH)
echo 2. Run: start-network.bat
echo 3. Run: deploy-chaincode.bat  
echo 4. Run: test-chaincode-functions.bat
echo.
echo Directory Structure Created:
echo fabric-samples\
echo ├── test-network\     (Blockchain network)
echo ├── bin\              (Fabric CLI tools)  
echo └── chaincode\        (Example chaincodes)
echo.

pause