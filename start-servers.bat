@echo off
echo Starting Business Incubator Platform...
echo.

REM Start Backend Server
echo [1/2] Starting Backend Server on port 5000...
start "Backend Server" powershell -NoExit -Command "cd '%~dp0backend'; npm run dev"
timeout /t 5 /nobreak >nul

REM Start Frontend Server (Vite + React)
echo [2/2] Starting Frontend Server on port 5173...
start "Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend_vite'; npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to open frontend in browser...
pause >nul
start http://localhost:5173
