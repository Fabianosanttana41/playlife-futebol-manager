@echo off
title Playlife - Start
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==== CONFIG ====
set PROJECT=C:\Users\fabia\PycharmProjects\futebol
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend

set BACKEND_PORT=8001
set FRONTEND_PORT=8080

echo ==========================================
echo   PLAYLIFE - Iniciando Ambiente Completo
echo ==========================================
echo.

REM ==== MATAR PROCESSOS NAS PORTAS ====
for %%P in (%BACKEND_PORT% %FRONTEND_PORT%) do (
  echo [*] Verificando porta %%P...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    echo [!] Porta %%P em uso. Matando PID %%a...
    taskkill /PID %%a /F >nul 2>&1
  )
)

echo.
echo [OK] Portas liberadas.
echo.

REM ==== SUBIR BACKEND ====
echo [*] Subindo BACKEND (FastAPI)...
cd /d "%BACKEND%"
start "Playlife Backend" cmd /k "py server.py"

timeout /t 2 /nobreak >nul

REM ==== SUBIR FRONTEND ====
echo [*] Subindo FRONTEND (http.server)...
cd /d "%FRONTEND%"
start "Playlife Frontend" cmd /k "py -m http.server %FRONTEND_PORT%"

timeout /t 1 /nobreak >nul

REM ==== ABRIR JOGO ====
echo.
echo [OK] Abrindo jogo no navegador...
start "" "http://127.0.0.1:%FRONTEND_PORT%/index.html"

echo.
echo ==========================================
echo   Tudo iniciado com sucesso.
echo ==========================================
