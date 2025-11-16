@echo off
REM Servidor de desarrollo para Portafolio DX
REM Este script levanta un servidor local con hot-reload de datos

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🚀 Iniciando Servidor de Desarrollo                 ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Mostrar versión de Node
node --version

echo.
echo 📁 Directorio: %cd%
echo.
echo Iniciando servidor en http://localhost:3000
echo.
echo Para detener el servidor: Presiona Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Iniciar servidor
node dev-server.js

pause
