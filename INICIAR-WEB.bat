@echo off
chcp 65001 >nul
REM ═══════════════════════════════════════════════════════════════
REM  Servidor Web - Portafolio DX (Red Corporativa)
REM  Ejecuta esto para compartir el portafolio en tu red
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           Iniciando Servidor Web de Red                         ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Python esta instalado
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Python no está instalado o no está en el PATH
    echo.
    echo Por favor instala Python desde: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Mostrar version de Python
echo ✅ Python encontrado:
python --version

echo.
echo 📁 Directorio: %~dp0
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Iniciar servidor Python
python "%~dp0web-server.py"

pause
