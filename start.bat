@echo off
title FreelanceOS Startup
color 0B

echo.
echo  =====================================================
echo   ^⚡ FreelanceOS - Starting Up
echo  =====================================================
echo.

REM Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo  Checking dependencies... OK
echo.

REM Setup backend
echo  Setting up backend...
cd /d "%~dp0backend"

IF NOT EXIST venv (
    echo  Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt -q
echo  Backend ready!
echo.

REM Setup frontend
echo  Setting up frontend...
cd /d "%~dp0frontend"

IF NOT EXIST node_modules (
    echo  Installing npm packages (first run - takes ~1 min)...
    npm install --silent
)
echo  Frontend ready!
echo.

REM Start backend in new window
echo  Starting backend server...
start "FreelanceOS Backend" /d "%~dp0backend" cmd /k "call venv\Scripts\activate.bat && python main.py"

REM Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

REM Start frontend in new window
echo  Starting frontend server...
start "FreelanceOS Frontend" /d "%~dp0frontend" cmd /k "npm run dev"

echo.
echo  =====================================================
echo   ^🚀 FreelanceOS is running!
echo  =====================================================
echo.
echo   App:      http://localhost:5173
echo   API:      http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Demo Login:
echo   Email:    demo@freelanceos.com
echo   Password: demo123
echo.
echo  Two terminal windows have opened (backend + frontend).
echo  Close them to stop the servers.
echo.
pause
