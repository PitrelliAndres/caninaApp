@echo off
echo =====================================
echo ParkDog - Inicio Rapido Windows
echo =====================================

:: Crear archivo .env si no existe
if not exist .env (
    echo GOOGLE_CLIENT_ID=temp-client-id > .env
    echo GOOGLE_CLIENT_SECRET=temp-secret >> .env
    echo Archivo .env creado
)

:: Preguntar metodo de inicio
echo.
echo Como quieres iniciar la aplicacion?
echo 1. Con Docker
echo 2. Sin Docker (manual)
echo.
set /p opcion="Selecciona opcion (1 o 2): "

if "%opcion%"=="1" goto docker
if "%opcion%"=="2" goto manual
goto fin

:docker
echo.
echo Iniciando con Docker...
docker-compose down
docker-compose build --no-cache
docker-compose up
goto fin

:manual
echo.
echo Iniciando sin Docker...

:: Backend
echo.
echo Iniciando Backend...
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python run.py"

:: Esperar un poco
timeout /t 5 /nobreak > nul

:: Frontend
echo.
echo Iniciando Frontend...
cd frontend
if exist node_modules (
    echo node_modules encontrado
) else (
    echo Instalando dependencias...
    call npm install --legacy-peer-deps
)
start cmd /k "npm run dev"
cd ..

echo.
echo =====================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo =====================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul

:fin