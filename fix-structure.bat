@echo off
echo ========================================
echo  CORRECTOR DE ESTRUCTURA - Portfolio DX
echo ========================================
echo.

cd /d "%~dp0"

echo 1. Verificando carpeta users...
if not exist "users" (
    echo    - Creando carpeta users...
    mkdir users
) else (
    echo    OK Carpeta users existe
)

echo.
echo 2. Verificando carpeta user1...
if not exist "users\user1" (
    echo    - Creando carpeta users\user1...
    mkdir users\user1
) else (
    echo    OK Carpeta user1 existe
)

echo.
echo 3. Verificando carpeta projects...

REM Verificar si projects existe y si es archivo o carpeta
if exist "users\user1\projects" (
    dir "users\user1\projects" 2>nul | find "<DIR>" >nul
    if errorlevel 1 (
        echo    PROBLEMA! projects es un archivo, no carpeta
        echo    - Respaldando archivo a projects-backup.json...
        move "users\user1\projects" "users\user1\projects-backup.json"
        echo    - Creando carpeta projects correcta...
        mkdir "users\user1\projects"
    ) else (
        echo    OK projects es una carpeta
    )
) else (
    echo    - Creando carpeta projects...
    mkdir "users\user1\projects"
)

echo.
echo 4. Verificando carpetas de usuario user2...
if not exist "users\user2" (
    echo    - Creando carpeta users\user2...
    mkdir users\user2
)
if not exist "users\user2\projects" (
    echo    - Creando carpeta users\user2\projects...
    mkdir users\user2\projects
)

echo.
echo ========================================
echo  ESTRUCTURA ACTUAL:
echo ========================================
echo.
echo Contenido de users\user1\:
dir users\user1
echo.

echo ========================================
echo  RESULTADO:
echo ========================================
if exist "users\user1\projects\" (
    echo    OK Estructura corregida correctamente!
    echo.
    echo    Ahora puedes:
    echo    1. npm run build
    echo    2. npm start
    echo    3. Guardar proyectos sin errores
) else (
    echo    ERROR! No se pudo crear la estructura
    echo    Contacta soporte
)

echo.
pause
