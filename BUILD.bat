:: ========================================
::   Portfolio DX - Instalador (con PNPM)
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

echo [2/3] Verificando PNPM...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PNPM no está instalado. Ejecuta:
    echo    npm install -g pnpm
    pause
    exit /b
)
echo OK - PNPM encontrado
echo.

echo [3/3] Compilando ejecutable portable...
if not exist ".cache" mkdir ".cache"

set "ELECTRON_BUILDER_CACHE=%CD%\.cache"

:: 🔁 Antes era "npx electron-builder", ahora es:
call pnpm exec electron-builder --win portable --x64

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la compilación
    pause
    exit /b
)

echo.
echo ✅ Compilación finalizada correctamente
pause
