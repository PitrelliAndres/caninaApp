#!/bin/bash

echo "======================================"
echo " ParkDog Mobile - Build Script"
echo "======================================"

if [ $# -eq 0 ]; then
    echo "Usage: $0 [dev|android|ios|build|prebuild|install|clean]"
    echo ""
    echo "Commands:"
    echo "  dev       - Start Expo dev server"
    echo "  android   - Run on Android device/emulator"
    echo "  ios       - Run on iOS device/simulator"
    echo "  build     - Create production build (EAS)"
    echo "  prebuild  - Generate native code"
    echo "  install   - Install dependencies"
    echo "  clean     - Clean node_modules and reinstall"
    exit 1
fi

COMMAND=$1
cd mobile

case $COMMAND in
    "dev")
        echo "Starting Expo dev server..."
        npm start
        ;;
    
    "android")
        echo "Building and running on Android..."
        npx expo run:android
        ;;
    
    "ios")
        echo "Building and running on iOS..."
        npx expo run:ios
        ;;
    
    "build")
        echo "Creating production build..."
        echo "Make sure you're logged into EAS: eas whoami"
        echo ""
        read -p "Build type (android/ios/all): " BUILD_TYPE
        case $BUILD_TYPE in
            "android")
                eas build --platform android
                ;;
            "ios")
                eas build --platform ios
                ;;
            "all"|"")
                eas build --platform all
                ;;
            *)
                echo "Invalid build type. Using 'all'"
                eas build --platform all
                ;;
        esac
        ;;
    
    "prebuild")
        echo "Generating native code..."
        npx expo prebuild --clean
        ;;
    
    "install")
        echo "Installing dependencies..."
        npm install
        echo "Installing EAS CLI..."
        npm install -g @expo/cli eas-cli
        ;;
    
    "clean")
        echo "Cleaning and reinstalling..."
        rm -rf node_modules package-lock.json
        npm install
        echo "Clean completed!"
        ;;
    
    *)
        echo "Invalid command: $COMMAND"
        exit 1
        ;;
esac

cd ..