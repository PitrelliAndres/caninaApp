@echo off
echo ======================================
echo  ParkDog - Build and Deploy Script
echo ======================================

if "%1"=="" (
    echo Usage: build-deploy.bat [build^|deploy^|full^|stop^|logs^|clean]
    echo.
    echo Commands:
    echo   build  - Build all Docker images
    echo   deploy - Start services with Docker Compose
    echo   full   - Build and deploy everything
    echo   stop   - Stop all services
    echo   logs   - Show container logs
    echo   clean  - Remove all containers and images
    exit /b 1
)

set COMMAND=%1

if "%COMMAND%"=="build" goto BUILD
if "%COMMAND%"=="deploy" goto DEPLOY
if "%COMMAND%"=="full" goto FULL
if "%COMMAND%"=="stop" goto STOP
if "%COMMAND%"=="logs" goto LOGS
if "%COMMAND%"=="clean" goto CLEAN

echo Invalid command: %COMMAND%
exit /b 1

:BUILD
echo Building Docker images...
docker-compose build --no-cache
echo Build completed!
goto END

:DEPLOY
echo Starting services...
docker-compose up -d
echo Waiting for services to start...
timeout /t 10 /nobreak > nul
echo Services started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Redis:    localhost:6379
goto END

:FULL
echo Building and deploying...
docker-compose build --no-cache
docker-compose up -d
echo Waiting for services to start...
timeout /t 15 /nobreak > nul
echo.
echo ======================================
echo  Services Ready!
echo ======================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Database: localhost:5432
echo Redis:    localhost:6379
echo.
echo Run 'build-deploy.bat logs' to see logs
goto END

:STOP
echo Stopping services...
docker-compose down
echo Services stopped!
goto END

:LOGS
echo Showing logs (Ctrl+C to exit)...
docker-compose logs -f
goto END

:CLEAN
echo WARNING: This will remove all containers and images!
set /p CONFIRM="Are you sure? (y/N): "
if not "%CONFIRM%"=="y" if not "%CONFIRM%"=="Y" (
    echo Cancelled.
    goto END
)
echo Cleaning up...
docker-compose down -v --remove-orphans
docker system prune -af --volumes
echo Cleanup completed!
goto END

:END