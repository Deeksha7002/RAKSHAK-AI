@echo off
TITLE Rakshak AI | SecureChat Simulator

echo =========================================================
echo  RAKSHAK AI — SecureChat WhatsApp-like Threat Simulator
echo =========================================================
echo.

:: Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo [1/2] First-time setup: Installing dependencies...
    npm install
    echo.
) else (
    echo [1/2] Dependencies already installed. Skipping...
)

echo [2/2] Launching SecureChat Simulator on http://localhost:5176
echo.
echo =========================================================
echo  Open: http://localhost:5176 in your browser
echo  Then click the Settings gear and "CONNECT BRIDGE"
echo  to link it with your Rakshak AI backend (port 8000)
echo =========================================================
echo.

npm run dev

pause
