@echo off
TITLE Rakshak AI Ecosystem - Startup Manager

echo =======================================================
echo 🔥 RAKSHAK AI: DUAL-SYSTEM ECOSYSTEM STARTUP 🔥
echo =======================================================
echo.
echo [0/4] Cleaning up zombie processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo.

:: 1. Start the Backend (Rakshak AI Brain)
echo [1/3] Starting Rakshak AI Backend (Port 8000)...
start "Rakshak Backend" cmd /k "cd backend && python server.py"
timeout /t 5

:: 2. Start the Chats Portal (Simulator)
echo [2/3] Starting Chats Portal - Simulator (Port 5173)...
start "Chats Portal" cmd /k "cd simulator-app && npm run dev"
timeout /t 5

:: 3. Start the Cyber Cell Portal
echo [3/3] Starting Cyber Cell Portal (Port 5174)...
start "Cyber Cell Portal" cmd /k "cd cybercell-portal && npm run dev"
timeout /t 5

:: 4. Start the Unified Demo Portal (Sandbox)
echo [4/5] Starting Unified Demo Hub (Port 3000)...
start "Demo Portal" cmd /k "cd demo-portal && npm run dev"
timeout /t 5

:: 5. Start the Standalone Rakshak AI App
echo [5/5] Starting Standalone Rakshak AI (Port 5175)...
start "Standalone App" cmd /k "cd frontend && npm run dev"
timeout /t 5

echo.
echo =======================================================
echo ✅ ECOSYSTEM READY
echo =======================================================
echo.
echo 📱 Open your browser at:
echo 🚀 DEMO HUB: http://localhost:3000?key=rakshak_demo_k3y_2024
echo 🌐 STANDALONE: http://localhost:5175
echo.
echo Use the Simulator (5173) and watch sync on Standalone (5175) and Cybercell (5174)!
echo =======================================================
pause
