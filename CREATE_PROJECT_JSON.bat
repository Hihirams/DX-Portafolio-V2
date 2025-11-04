@echo off
REM ============================================
REM Script para generar project.json en proyectos existentes
REM ============================================

echo ============================================
echo   GENERADOR DE project.json
echo ============================================
echo.

REM Solicitar ID de usuario
set /p USER_ID="ID del usuario (ej: hiram.gonzalez): "

if not exist "users\%USER_ID%\projects" (
    echo ERROR: No existe la carpeta users\%USER_ID%\projects
    pause
    exit /b 1
)

echo.
echo Proyectos encontrados en users\%USER_ID%\projects:
echo.
dir /b "users\%USER_ID%\projects"
echo.

set /p PROJECT_ID="ID del proyecto a configurar (ej: proj001): "

if not exist "users\%USER_ID%\projects\%PROJECT_ID%" (
    echo ERROR: No existe la carpeta users\%USER_ID%\projects\%PROJECT_ID%
    pause
    exit /b 1
)

echo.
echo Configurando proyecto %PROJECT_ID%...
echo.

REM Solicitar datos del proyecto
set /p TITLE="Titulo del proyecto: "
set /p STATUS="Estado (in-progress/discovery/hold/completed): "
set /p PROGRESS="Progreso (0-100): "
set /p PHASE="Fase actual: "

REM Generar project.json
(
echo {
echo   "id": "%PROJECT_ID%",
echo   "ownerId": "%USER_ID%",
echo   "title": "%TITLE%",
echo   "icon": "📁",
echo   "status": "%STATUS%",
echo   "priority": "medium",
echo   "progress": %PROGRESS%,
echo   "targetDate": "",
echo   "currentPhase": "%PHASE%",
echo   "achievements": {},
echo   "blockers": {
echo     "type": "info",
echo     "message": "Sin bloqueos"
echo   },
echo   "nextSteps": {},
echo   "ganttImage": "",
echo   "videos": [],
echo   "images": [],
echo   "createdAt": "",
echo   "updatedAt": ""
echo }
) > "users\%USER_ID%\projects\%PROJECT_ID%\project.json"

echo.
echo ============================================
echo   project.json creado exitosamente!
echo ============================================
echo.
echo Ubicacion: users\%USER_ID%\projects\%PROJECT_ID%\project.json
echo.
echo IMPORTANTE: Edita el archivo para agregar:
echo   - achievements (logros)
echo   - nextSteps (proximos pasos)
echo   - Rutas de imagenes/videos
echo   - Fechas
echo.
pause
