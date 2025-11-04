@echo off
echo ========================================
echo    Portfolio DX - Instalador
echo ========================================
echo.

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo OK - Node.js encontrado
echo.

echo [2/3] Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo [3/3] Compilando ejecutable portable...
call npm run build:portable
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la compilacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo    COMPILACION EXITOSA!
echo ========================================
echo.
echo El ejecutable portable esta en:
echo   dist\PortfolioDX-Portable.exe
echo.
echo Puedes copiar este archivo junto con las carpetas:
echo   - users\
echo   - data\
echo   - assets\
echo.
echo a la carpeta compartida de red.
echo.
pause
