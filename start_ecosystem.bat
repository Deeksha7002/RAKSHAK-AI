@echo off
title Rakshak AI Ecosystem Launcher
color 0A
echo.
echo  ============================================
echo   RAKSHAK AI CYBER JUSTICE ECOSYSTEM
echo   Launching all 4 processes...
echo  ============================================
echo.

:: -- 1. Backend: Rakshak AI Core (Port 8000)
echo [1/4] Starting Rakshak AI Backend...
start "Rakshak AI Backend [Port 8000]" cmd /k "cd /d "%~dp0backend" && set ALLOW_INSECURE_KEY=1 && python server.py"
timeout /t 3 /nobreak > nul

:: -- 2. Rakshak AI Admin Dashboard (Port 5173)
echo [2/4] Starting Admin Dashboard...
start "Rakshak AI Dashboard [Port 5173]" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 2 /nobreak > nul

:: -- 3. Scammer Simulator (Port 5174)
echo [3/4] Starting Scammer Simulator...
start "Scammer Simulator [Port 5174]" cmd /k "cd /d "%~dp0simulator-app" && npm run dev"
timeout /t 2 /nobreak > nul

:: -- 4. Cybercell Enforcement Portal (Port 5175)
echo [4/4] Starting Cybercell Portal...
start "Cybercell Portal [Port 5175]" cmd /k "cd /d "%~dp0cybercell-portal" && npm run dev"

echo.
echo  All processes launched! Opening browser tabs in 8 seconds...
timeout /t 8 /nobreak > nul

start http://localhost:5173
timeout /t 1 /nobreak > nul
start http://localhost:5174
timeout /t 1 /nobreak > nul
start http://localhost:5175

echo.
echo  ECOSYSTEM STATUS:
echo   Rakshak AI Core    -> http://localhost:8000
echo   Admin Dashboard    -> http://localhost:5173
echo   Scammer Simulator  -> http://localhost:5174
echo   Cybercell Portal   -> http://localhost:5175
echo.
echo  Press any key to close this launcher window...
pause > nul
