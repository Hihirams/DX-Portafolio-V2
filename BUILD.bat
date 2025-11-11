:: ========================================
::   Portfolio DX - Instalador (versión corregida)
:: ========================================

@echo off
echo.
echo [1/3] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado. Instala Node 20 o superior.
    pause
    exit /b
)
echo OK - Node.js encontrado
echo.

echo [2/3] Instalando dependencias...
call npm install
echo.

echo [3/3] Compilando ejecutable portable...
if not exist ".cache" mkdir ".cache"

set "ELECTRON_BUILDER_CACHE=%CD%\.cache"
call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo la compilacion
    pause
    exit /b
)
echo.
echo ✅ Compilacion finalizada correctamente
pause
