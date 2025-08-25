@echo off
echo ======================================
echo  ParkDog Mobile - Build Script
echo ======================================

if "%1"=="" (
    echo Usage: mobile-build.bat [dev^|android^|ios^|build^|prebuild^|install^|clean]
    echo.
    echo Commands:
    echo   dev       - Start Expo dev server
    echo   android   - Run on Android device/emulator
    echo   ios       - Run on iOS device/simulator
    echo   build     - Create production build (EAS)
    echo   prebuild  - Generate native code
    echo   install   - Install dependencies
    echo   clean     - Clean node_modules and reinstall
    exit /b 1
)

set COMMAND=%1
cd mobile

if "%COMMAND%"=="dev" goto DEV
if "%COMMAND%"=="android" goto ANDROID
if "%COMMAND%"=="ios" goto IOS
if "%COMMAND%"=="build" goto BUILD
if "%COMMAND%"=="prebuild" goto PREBUILD
if "%COMMAND%"=="install" goto INSTALL
if "%COMMAND%"=="clean" goto CLEAN

echo Invalid command: %COMMAND%
exit /b 1

:DEV
echo Starting Expo dev server...
pnpm start
goto END

:ANDROID
echo Building and running on Android...
pnpm run android
goto END

:IOS
echo Building and running on iOS...
pnpm run ios
goto END

:BUILD
echo Creating production build...
echo Make sure you're logged into EAS: eas whoami
echo.
set /p BUILD_TYPE="Build type (android/ios/all): "
if "%BUILD_TYPE%"=="android" (
    eas build --platform android
) else if "%BUILD_TYPE%"=="ios" (
    eas build --platform ios
) else if "%BUILD_TYPE%"=="all" (
    eas build --platform all
) else (
    echo Invalid build type. Using 'all'
    eas build --platform all
)
goto END

:PREBUILD
echo Generating native code...
pnpm run prebuild --clean
goto END

:INSTALL
echo Installing dependencies...
pnpm install
echo Installing EAS CLI...
pnpm add -g @expo/cli eas-cli
goto END

:CLEAN
echo Cleaning and reinstalling...
if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)
pnpm install
echo Clean completed!
goto END

:END
cd ..