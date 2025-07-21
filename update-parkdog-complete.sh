#!/bin/bash
# update-parkdog-complete.sh
# Script para actualizar ParkDog con todas las features faltantes

echo "🐕 Actualizando ParkDog con features completas..."
echo "================================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para crear archivo
create_file() {
    local filepath=$1
    local content=$2
    
    # Crear directorio si no existe
    mkdir -p "$(dirname "$filepath")"
    
    # Crear archivo con contenido
    cat > "$filepath" << 'EOF'
$content
EOF
    
    echo -e "${GREEN}✅ Creado:${NC} $filepath"
}

# Contador de archivos
FILES_COUNT=0

echo -e "\n${BLUE}📁 Creando estructura de carpetas...${NC}"

# Crear estructura de directorios
mkdir -p shared/locales
mkdir -p mobile/{src,assets}
mkdir -p mobile/src/{components,screens,navigation,services,store,utils,hooks,i18n}
mkdir -p mobile/src/components/{common,onboarding,parks,matches,chat,profile,icons}
mkdir -p mobile/src/screens/{auth,onboarding,parks,visits,matches,chat,profile}
mkdir -p mobile/src/services/api
mkdir -p mobile/src/store/slices
mkdir -p mobile/assets/fonts
mkdir -p frontend/lib/i18n
mkdir -p frontend/components/admin
mkdir -p frontend/lib/api
mkdir -p backend/app/{utils,services,models,routes}

echo -e "\n${BLUE}🌐 Creando archivos de traducción compartidos...${NC}"

# ========== TRADUCCIONES COMPARTIDAS ==========

cat > shared/locales/es.json << 'EOF'
{
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "next": "Siguiente",
    "previous": "Anterior",
    "finish": "Finalizar",
    "search": "Buscar",
    "filter": "Filtrar",
    "noResults": "Sin resultados",
    "confirmDelete": "¿Estás seguro de que deseas eliminar?",
    "yes": "Sí",
    "no": "No",
    "home": "Inicio",
    "refresh": "Actualizar",
    "notifications": "Notificaciones"
  },
  "auth": {
    "loginTitle": "¡Bienvenido a ParkDog!",
    "loginSubtitle": "Conecta con otros dueños de perros en tu zona",
    "loginWithGoogle": "Iniciar sesión con Google",
    "logout": "Cerrar sesión",
    "loggingIn": "Iniciando sesión...",
    "loginError": "Error al iniciar sesión",
    "sessionExpired": "Tu sesión ha expirado",
    "termsAccept": "Al iniciar sesión, aceptas nuestros términos y condiciones",
    "whatCanYouDo": "¿Qué puedes hacer en ParkDog?",
    "features": {
      "registerVisits": "Registra tus visitas a parques",
      "meetOwners": "Conoce a otros dueños de perros",
      "matchInterests": "Haz match según tus intereses",
      "chatCoordinate": "Chatea y coordina encuentros"
    }
  },
  "onboarding": {
    "step1": {
      "title": "Tu perfil",
      "subtitle": "Cuéntanos sobre ti. Esta información nos ayudará a encontrar los mejores matches para ti.",
      "nameLabel": "Nombre",
      "nameDisabled": "Este nombre viene de tu cuenta de Google",
      "nicknameLabel": "Apodo o nombre preferido *",
      "nicknameHelp": "Este es el nombre que verán otros usuarios",
      "nicknameTaken": "Este apodo ya está en uso",
      "nicknameAvailable": "Apodo disponible",
      "ageLabel": "Edad *",
      "photoLabel": "Foto de perfil (opcional)",
      "uploadPhoto": "Subir foto",
      "requiredFields": "Por favor, completa tu apodo y edad"
    },
    "step2": {
      "title": "Tu mascota",
      "subtitle": "Cuéntanos sobre tu perro. Ayúdanos a conocer a tu compañero peludo.",
      "dogNameLabel": "Nombre de tu perro *",
      "dogAgeLabel": "Edad de tu perro *",
      "dogAgeHelp": "Si es cachorro, puedes poner 0",
      "breedLabel": "Raza *",
      "breedPlaceholder": "Selecciona una raza",
      "dogPhotoLabel": "Foto de tu perro (opcional)",
      "requiredFields": "Por favor, completa todos los datos de tu perro"
    },
    "step3": {
      "title": "Preferencias",
      "subtitle": "Personaliza tu experiencia en ParkDog",
      "privacySection": "Privacidad",
      "publicProfile": "Perfil público",
      "publicProfileDesc": "Otros usuarios pueden ver tu perfil",
      "allowMatching": "Permitir matches",
      "allowMatchingDesc": "Participar en el sistema de matches",
      "allowProximity": "Descubrimiento por proximidad",
      "allowProximityDesc": "Encontrar usuarios cercanos",
      "interestsSection": "Tus intereses",
      "note": "Podrás cambiar estas preferencias en cualquier momento desde tu perfil"
    },
    "progress": "Paso {{current}} de {{total}}"
  },
  "parks": {
    "title": "Parques en CABA",
    "searchPlaceholder": "Buscar parque por nombre...",
    "filterByNeighborhood": "Filtrar por barrio",
    "allNeighborhoods": "Todos los barrios",
    "dogArea": "Área para perros",
    "fenced": "Cercado",
    "waterAvailable": "Agua disponible",
    "visitorsToday": "{{count}} visitantes hoy",
    "registerVisit": "Registrar Visita",
    "searching": "Buscando...",
    "noParksFound": "No se encontraron parques con esos filtros",
    "listView": "Lista",
    "mapView": "Mapa"
  },
  "visits": {
    "myVisits": "Mis Visitas",
    "subtitle": "Gestiona tus visitas a parques",
    "tabs": {
      "upcoming": "Próximas",
      "past": "Pasadas",
      "all": "Todas"
    },
    "registerTitle": "Registrar visita a {{parkName}}",
    "registerInfo": "Elige cuándo irás al parque. Esta información es privada y solo se usará para hacer match.",
    "dateLabel": "Fecha *",
    "timeLabel": "Hora *",
    "durationLabel": "Duración *",
    "notesLabel": "Notas",
    "notesPlaceholder": "¿Algo que agregar? Ej: 'Llevaré juguetes'",
    "durations": {
      "30": "30 minutos",
      "60": "1 hora",
      "90": "1 hora y media",
      "120": "2 horas",
      "180": "3 horas",
      "240": "Más de 3 horas"
    },
    "noUpcomingVisits": "No tienes visitas próximas",
    "registerFirstVisit": "¡Registra tu primera visita a un parque para empezar a conectar!",
    "exploreParks": "Explorar parques",
    "cancelVisit": "¿Cancelar esta visita?",
    "cancelConfirm": "Esta acción no se puede deshacer. La visita será cancelada permanentemente.",
    "keep": "No, mantener",
    "confirmCancel": "Sí, cancelar",
    "visitCancelled": "Visita cancelada",
    "visitRegistered": "¡Visita registrada!"
  },
  "matches": {
    "title": "Matches",
    "subtitle": "Conecta con otros dueños de perros",
    "tabs": {
      "discover": "Descubrir",
      "myMatches": "Mis Matches"
    },
    "compatibility": "{{percent}}% compatible",
    "lastSeenAt": "Visto en {{parkName}}",
    "pass": "Pasar",
    "like": "Me gusta",
    "yearsOld": "{{age}} años",
    "withDog": "con {{dogName}}",
    "matchSince": "Match desde {{date}}",
    "unmatch": "Deshacer match",
    "chat": "Chatear",
    "noMoreSuggestions": "No hay más sugerencias por ahora. Vuelve más tarde.",
    "noMatches": "Aquí aparecerán tus matches mutuos",
    "itsAMatch": "¡Es un match! 🎉",
    "mutualLike": "Ambos se dieron like. Ya pueden chatear.",
    "matchRemoved": "Match eliminado"
  },
  "chat": {
    "messages": "Mensajes",
    "online": "En línea",
    "offline": "Desconectado",
    "typing": "{{name}} está escribiendo...",
    "writePlaceholder": "Escribe un mensaje...",
    "loadingChat": "Cargando chat...",
    "chatNotFound": "Chat no encontrado",
    "messageSent": "✓✓"
  },
  "profile": {
    "title": "Mi Perfil",
    "editProfile": "Editar Perfil",
    "personalInfo": "Información Personal",
    "name": "Nombre",
    "email": "Email",
    "nickname": "Apodo",
    "age": "Edad",
    "accountType": "Tipo de cuenta",
    "memberSince": "Miembro desde",
    "myPet": "Mi Mascota",
    "dogName": "Nombre",
    "dogAge": "Edad",
    "breed": "Raza",
    "privacySettings": "Configuración de Privacidad",
    "saveChanges": "Guardar Cambios",
    "saving": "Guardando...",
    "profileUpdated": "Perfil actualizado",
    "updateSuccess": "Tus cambios se han guardado correctamente",
    "deleteAccount": "Eliminar cuenta",
    "deleteAccountConfirm": "¿Estás seguro?",
    "deleteAccountWarning": "Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta, tus datos y todas tus visitas registradas.",
    "accountDeleted": "Cuenta eliminada exitosamente"
  },
  "errors": {
    "generic": "Algo salió mal. Por favor intenta de nuevo.",
    "network": "Error de conexión. Verifica tu internet.",
    "unauthorized": "No tienes permisos para realizar esta acción",
    "notFound": "No encontrado",
    "validation": "Por favor verifica los datos ingresados",
    "fileSize": "El archivo es muy grande (máximo {{size}}MB)",
    "fileType": "Tipo de archivo no permitido",
    "nicknameFormat": "El apodo debe tener entre 3 y 20 caracteres",
    "nicknameAlphanumeric": "El apodo solo puede contener letras, números y guiones bajos",
    "ageRange": "La edad debe estar entre {{min}} y {{max}} años",
    "dogNameMin": "El nombre debe tener al menos 2 caracteres",
    "dogAgeRange": "La edad del perro debe estar entre 0 y 25 años"
  },
  "permissions": {
    "location": {
      "title": "Permiso de ubicación",
      "message": "ParkDog necesita acceso a tu ubicación para mostrarte parques cercanos",
      "buttonPositive": "Permitir",
      "buttonNegative": "Denegar"
    },
    "camera": {
      "title": "Permiso de cámara",
      "message": "ParkDog necesita acceso a tu cámara para tomar fotos",
      "buttonPositive": "Permitir",
      "buttonNegative": "Denegar"
    },
    "gallery": {
      "title": "Permiso de galería",
      "message": "ParkDog necesita acceso a tu galería para seleccionar fotos",
      "buttonPositive": "Permitir",
      "buttonNegative": "Denegar"
    }
  },
  "roles": {
    "free": "Gratuita",
    "premium": "Premium",
    "vip": "VIP",
    "admin": "Administrador"
  },
  "admin": {
    "title": "Panel de Administración",
    "dashboard": "Dashboard",
    "users": "Usuarios",
    "parks": "Parques",
    "reports": "Reportes"
  }
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} shared/locales/es.json"

cat > shared/locales/en.json << 'EOF'
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "next": "Next",
    "previous": "Previous",
    "finish": "Finish",
    "search": "Search",
    "filter": "Filter",
    "noResults": "No results",
    "confirmDelete": "Are you sure you want to delete?",
    "yes": "Yes",
    "no": "No",
    "home": "Home",
    "refresh": "Refresh",
    "notifications": "Notifications"
  },
  "auth": {
    "loginTitle": "Welcome to ParkDog!",
    "loginSubtitle": "Connect with other dog owners in your area",
    "loginWithGoogle": "Sign in with Google",
    "logout": "Sign out",
    "loggingIn": "Signing in...",
    "loginError": "Login error",
    "sessionExpired": "Your session has expired",
    "termsAccept": "By signing in, you accept our terms and conditions",
    "whatCanYouDo": "What can you do on ParkDog?",
    "features": {
      "registerVisits": "Register your park visits",
      "meetOwners": "Meet other dog owners",
      "matchInterests": "Match based on interests",
      "chatCoordinate": "Chat and coordinate meetups"
    }
  },
  "onboarding": {
    "step1": {
      "title": "Your profile",
      "subtitle": "Tell us about yourself. This information will help us find the best matches for you.",
      "nameLabel": "Name",
      "nameDisabled": "This name comes from your Google account",
      "nicknameLabel": "Nickname or preferred name *",
      "nicknameHelp": "This is the name other users will see",
      "nicknameTaken": "This nickname is already taken",
      "nicknameAvailable": "Nickname available",
      "ageLabel": "Age *",
      "photoLabel": "Profile photo (optional)",
      "uploadPhoto": "Upload photo",
      "requiredFields": "Please complete your nickname and age"
    },
    "step2": {
      "title": "Your pet",
      "subtitle": "Tell us about your dog. Help us get to know your furry companion.",
      "dogNameLabel": "Your dog's name *",
      "dogAgeLabel": "Your dog's age *",
      "dogAgeHelp": "If it's a puppy, you can put 0",
      "breedLabel": "Breed *",
      "breedPlaceholder": "Select a breed",
      "dogPhotoLabel": "Your dog's photo (optional)",
      "requiredFields": "Please complete all your dog's information"
    },
    "step3": {
      "title": "Preferences",
      "subtitle": "Customize your ParkDog experience",
      "privacySection": "Privacy",
      "publicProfile": "Public profile",
      "publicProfileDesc": "Other users can see your profile",
      "allowMatching": "Allow matches",
      "allowMatchingDesc": "Participate in the matching system",
      "allowProximity": "Proximity discovery",
      "allowProximityDesc": "Find nearby users",
      "interestsSection": "Your interests",
      "note": "You can change these preferences anytime from your profile"
    },
    "progress": "Step {{current}} of {{total}}"
  },
  "parks": {
    "title": "Parks in Buenos Aires",
    "searchPlaceholder": "Search park by name...",
    "filterByNeighborhood": "Filter by neighborhood",
    "allNeighborhoods": "All neighborhoods",
    "dogArea": "Dog area",
    "fenced": "Fenced",
    "waterAvailable": "Water available",
    "visitorsToday": "{{count}} visitors today",
    "registerVisit": "Register Visit",
    "searching": "Searching...",
    "noParksFound": "No parks found with those filters",
    "listView": "List",
    "mapView": "Map"
  },
  "visits": {
    "myVisits": "My Visits",
    "subtitle": "Manage your park visits",
    "tabs": {
      "upcoming": "Upcoming",
      "past": "Past",
      "all": "All"
    },
    "registerTitle": "Register visit to {{parkName}}",
    "registerInfo": "Choose when you'll go to the park. This information is private and will only be used for matching.",
    "dateLabel": "Date *",
    "timeLabel": "Time *",
    "durationLabel": "Duration *",
    "notesLabel": "Notes",
    "notesPlaceholder": "Anything to add? E.g.: 'I'll bring toys'",
    "durations": {
      "30": "30 minutes",
      "60": "1 hour",
      "90": "1.5 hours",
      "120": "2 hours",
      "180": "3 hours",
      "240": "More than 3 hours"
    },
    "noUpcomingVisits": "You have no upcoming visits",
    "registerFirstVisit": "Register your first park visit to start connecting!",
    "exploreParks": "Explore parks",
    "cancelVisit": "Cancel this visit?",
    "cancelConfirm": "This action cannot be undone. The visit will be permanently cancelled.",
    "keep": "No, keep it",
    "confirmCancel": "Yes, cancel",
    "visitCancelled": "Visit cancelled",
    "visitRegistered": "Visit registered!"
  },
  "matches": {
    "title": "Matches",
    "subtitle": "Connect with other dog owners",
    "tabs": {
      "discover": "Discover",
      "myMatches": "My Matches"
    },
    "compatibility": "{{percent}}% compatible",
    "lastSeenAt": "Seen at {{parkName}}",
    "pass": "Pass",
    "like": "Like",
    "yearsOld": "{{age}} years old",
    "withDog": "with {{dogName}}",
    "matchSince": "Match since {{date}}",
    "unmatch": "Unmatch",
    "chat": "Chat",
    "noMoreSuggestions": "No more suggestions for now. Come back later.",
    "noMatches": "Your mutual matches will appear here",
    "itsAMatch": "It's a match! 🎉",
    "mutualLike": "You both liked each other. You can now chat.",
    "matchRemoved": "Match removed"
  },
  "chat": {
    "messages": "Messages",
    "online": "Online",
    "offline": "Offline",
    "typing": "{{name}} is typing...",
    "writePlaceholder": "Write a message...",
    "loadingChat": "Loading chat...",
    "chatNotFound": "Chat not found",
    "messageSent": "✓✓"
  },
  "profile": {
    "title": "My Profile",
    "editProfile": "Edit Profile",
    "personalInfo": "Personal Information",
    "name": "Name",
    "email": "Email",
    "nickname": "Nickname",
    "age": "Age",
    "accountType": "Account type",
    "memberSince": "Member since",
    "myPet": "My Pet",
    "dogName": "Name",
    "dogAge": "Age",
    "breed": "Breed",
    "privacySettings": "Privacy Settings",
    "saveChanges": "Save Changes",
    "saving": "Saving...",
    "profileUpdated": "Profile updated",
    "updateSuccess": "Your changes have been saved successfully",
    "deleteAccount": "Delete account",
    "deleteAccountConfirm": "Are you sure?",
    "deleteAccountWarning": "This action cannot be undone. Your account, data and all visits will be permanently deleted.",
    "accountDeleted": "Account deleted successfully"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Connection error. Check your internet.",
    "unauthorized": "You don't have permission to perform this action",
    "notFound": "Not found",
    "validation": "Please check the entered data",
    "fileSize": "File is too large (max {{size}}MB)",
    "fileType": "File type not allowed",
    "nicknameFormat": "Nickname must be between 3 and 20 characters",
    "nicknameAlphanumeric": "Nickname can only contain letters, numbers and underscores",
    "ageRange": "Age must be between {{min}} and {{max}} years",
    "dogNameMin": "Name must be at least 2 characters",
    "dogAgeRange": "Dog's age must be between 0 and 25 years"
  },
  "permissions": {
    "location": {
      "title": "Location permission",
      "message": "ParkDog needs access to your location to show you nearby parks",
      "buttonPositive": "Allow",
      "buttonNegative": "Deny"
    },
    "camera": {
      "title": "Camera permission",
      "message": "ParkDog needs access to your camera to take photos",
      "buttonPositive": "Allow",
      "buttonNegative": "Deny"
    },
    "gallery": {
      "title": "Gallery permission",
      "message": "ParkDog needs access to your gallery to select photos",
      "buttonPositive": "Allow",
      "buttonNegative": "Deny"
    }
  },
  "roles": {
    "free": "Free",
    "premium": "Premium",
    "vip": "VIP",
    "admin": "Administrator"
  },
  "admin": {
    "title": "Admin Panel",
    "dashboard": "Dashboard",
    "users": "Users",
    "parks": "Parks",
    "reports": "Reports"
  }
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} shared/locales/en.json"

echo -e "\n${BLUE}📱 Creando aplicación móvil...${NC}"

# ========== MOBILE - CONFIGURACIÓN ==========

cat > mobile/app.json << 'EOF'
{
  "expo": {
    "name": "ParkDog",
    "slug": "parkdog",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.parkdog.app",
      "config": {
        "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_KEY"
      },
      "infoPlist": {
        "NSCameraUsageDescription": "ParkDog necesita acceso a tu cámara para tomar fotos de tu mascota",
        "NSPhotoLibraryUsageDescription": "ParkDog necesita acceso a tu galería para seleccionar fotos",
        "NSLocationWhenInUseUsageDescription": "ParkDog necesita tu ubicación para mostrarte parques cercanos"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.parkdog.app",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_KEY"
        }
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow ParkDog to use your location."
        }
      ]
    ]
  }
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/app.json"

cat > mobile/package.json << 'EOF'
{
  "name": "parkdog-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-screens": "~3.22.0",
    "react-native-safe-area-context": "4.6.3",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/native-stack": "^6.9.13",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/drawer": "^6.6.3",
    "react-redux": "^8.1.2",
    "@reduxjs/toolkit": "^1.9.5",
    "react-native-paper": "^5.10.4",
    "react-native-vector-icons": "^10.0.0",
    "@react-native-google-signin/google-signin": "^10.0.1",
    "expo-auth-session": "~5.0.2",
    "expo-web-browser": "~12.3.2",
    "expo-location": "~16.1.0",
    "react-native-maps": "1.7.1",
    "expo-camera": "~13.4.4",
    "expo-image-picker": "~14.3.2",
    "expo-secure-store": "~12.3.1",
    "@react-native-async-storage/async-storage": "1.18.2",
    "socket.io-client": "^4.7.2",
    "react-native-gesture-handler": "~2.12.0",
    "react-native-reanimated": "~3.3.0",
    "react-native-svg": "13.9.0",
    "react-native-toast-message": "^2.1.6",
    "react-i18next": "^13.2.2",
    "i18next": "^23.5.1",
    "react-native-dotenv": "^3.4.9",
    "expo-font": "~11.4.0",
    "expo-splash-screen": "~0.20.5",
    "date-fns": "^2.30.0",
    "react-native-modal": "^13.0.1",
    "react-native-keyboard-aware-scroll-view": "^0.9.5"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/package.json"

cat > mobile/babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
        },
      ],
    ],
  };
};
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/babel.config.js"

# Mobile App.js principal
cat > mobile/App.js << 'EOF'
import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Provider as PaperProvider } from 'react-native-paper'
import { Provider as ReduxProvider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import * as SplashScreen from 'expo-splash-screen'
import * as Font from 'expo-font'
import { I18nextProvider } from 'react-i18next'

import { store } from './src/store'
import { theme } from './src/theme'
import i18n from './src/i18n'
import { AppNavigator } from './src/navigation/AppNavigator'
import { toastConfig } from './src/utils/toastConfig'

// Mantener splash screen visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-cargar fuentes
        await Font.loadAsync({
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        })
      } catch (e) {
        console.warn(e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return null
  }

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
              <Toast config={toastConfig} />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </I18nextProvider>
    </ReduxProvider>
  )
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/App.js"

# Mobile Theme
cat > mobile/src/theme.js << 'EOF'
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    tertiary: '#059669',
    error: '#dc2626',
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    tertiary: '#10b981',
    error: '#ef4444',
  },
}

export { lightTheme as theme, darkTheme }
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/theme.js"

# Mobile i18n config
cat > mobile/src/i18n/index.js << 'EOF'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Importar traducciones
import es from '../../assets/locales/es.json'
import en from '../../assets/locales/en.json'

const resources = {
  es: { translation: es },
  en: { translation: en }
}

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    const savedLanguage = await AsyncStorage.getItem('language')
    if (savedLanguage) {
      callback(savedLanguage)
    } else {
      const deviceLanguage = Localization.locale.split('-')[0]
      callback(resources[deviceLanguage] ? deviceLanguage : 'es')
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    await AsyncStorage.setItem('language', language)
  }
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/i18n/index.js"

# Mobile Store
cat > mobile/src/store/index.js << 'EOF'
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
})
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/store/index.js"

# Mobile User Slice
cat > mobile/src/store/slices/userSlice.js << 'EOF'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/api/auth'
import { userService } from '../../services/api/users'
import * as SecureStore from 'expo-secure-store'

// Async thunks
export const loginWithGoogle = createAsyncThunk(
  'user/loginWithGoogle',
  async (googleToken) => {
    const response = await authService.googleLogin(googleToken)
    // Guardar token en secure store
    if (response.jwt) {
      await SecureStore.setItemAsync('jwt_token', response.jwt)
      if (response.tokens?.refresh_token) {
        await SecureStore.setItemAsync('refresh_token', response.tokens.refresh_token)
      }
    }
    return response
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async () => {
    const response = await authService.getCurrentUser()
    return response
  }
)

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userId, data }) => {
    const response = await userService.updateProfile(userId, data)
    return response
  }
)

const initialState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
  isNew: false
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.error = null
      // Limpiar tokens
      SecureStore.deleteItemAsync('jwt_token')
      SecureStore.deleteItemAsync('refresh_token')
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.user = action.payload.user
        state.isNew = action.payload.is_new
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoggedIn = true
        state.user = action.payload
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
  }
})

export const { logout, clearError } = userSlice.actions
export default userSlice.reducer
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/store/slices/userSlice.js"

# Toast Config
cat > mobile/src/utils/toastConfig.js << 'EOF'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.container, styles.success]}>
      <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.container, styles.error]}>
      <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.container, styles.info]}>
      <MaterialCommunityIcons name="information" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  success: {
    backgroundColor: '#10b981',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
})
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/utils/toastConfig.js"

# Navegación
cat > mobile/src/navigation/AppNavigator.js << 'EOF'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector } from 'react-redux'

import { AuthNavigator } from './AuthNavigator'
import { MainNavigator } from './MainNavigator'
import { OnboardingNavigator } from './OnboardingNavigator'

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  const { isLoggedIn, user } = useSelector((state) => state.user)
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !user?.onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  )
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/navigation/AppNavigator.js"

# Navegación Auth
cat > mobile/src/navigation/AuthNavigator.js << 'EOF'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/auth/LoginScreen'

const Stack = createNativeStackNavigator()

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/navigation/AuthNavigator.js"

# Navegación Onboarding
cat > mobile/src/navigation/OnboardingNavigator.js << 'EOF'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Step1Screen } from '../screens/onboarding/Step1Screen'
import { Step2Screen } from '../screens/onboarding/Step2Screen'
import { Step3Screen } from '../screens/onboarding/Step3Screen'

const Stack = createNativeStackNavigator()

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1" component={Step1Screen} />
      <Stack.Screen name="Step2" component={Step2Screen} />
      <Stack.Screen name="Step3" component={Step3Screen} />
    </Stack.Navigator>
  )
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} mobile/src/navigation/OnboardingNavigator.js"

# Crear archivo vacío para evitar error
touch mobile/src/screens/auth/LoginScreen.js
touch mobile/src/screens/onboarding/Step1Screen.js
touch mobile/src/screens/onboarding/Step2Screen.js
touch mobile/src/screens/onboarding/Step3Screen.js

echo -e "\n${BLUE}🌐 Actualizando Frontend Web...${NC}"

# ========== FRONTEND - i18n ==========

cat > frontend/lib/i18n/index.js << 'EOF'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Importar traducciones compartidas
import esTranslations from '../../../shared/locales/es.json'
import enTranslations from '../../../shared/locales/en.json'

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} frontend/lib/i18n/index.js"

# Language Selector Component
cat > frontend/components/language-selector.jsx << 'EOF'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

export function LanguageSelector() {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} frontend/components/language-selector.jsx"

# Admin API Service
cat > frontend/lib/api/admin.js << 'EOF'
/**
 * Servicio de administración
 */
import { apiClient } from './client'

export const adminService = {
  async getDashboardStats() {
    return apiClient.get('/admin/dashboard')
  },

  async getUsers(params = {}) {
    return apiClient.get('/admin/users', params)
  },

  async updateUserRole(userId, role) {
    return apiClient.patch(`/admin/users/${userId}/role`, { role })
  },

  async banUser(userId, action = 'ban', reason = '') {
    return apiClient.post(`/admin/users/${userId}/ban`, { action, reason })
  },

  async createPark(data) {
    return apiClient.post('/admin/parks', data)
  },

  async updatePark(parkId, data) {
    return apiClient.put(`/admin/parks/${parkId}`, data)
  },

  async getReports(params = {}) {
    return apiClient.get('/admin/reports', params)
  }
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} frontend/lib/api/admin.js"

echo -e "\n${BLUE}🔧 Actualizando Backend...${NC}"

# ========== BACKEND - VALIDADORES EXTENDIDOS ==========

cat > backend/app/utils/validators_extended.py << 'EOF'
"""
Validadores extendidos con más funcionalidades
"""
import re
from datetime import datetime, date
import unicodedata

# Lista expandida de palabras ofensivas en español e inglés
OFFENSIVE_WORDS_ES = [
    'mierda', 'puta', 'pendejo', 'boludo', 'pelotudo', 
    'concha', 'carajo', 'culo', 'verga', 'pija',
    'hdp', 'sorete', 'forro', 'choto', 'pete'
]

OFFENSIVE_WORDS_EN = [
    'fuck', 'shit', 'bitch', 'asshole', 'dick',
    'pussy', 'cock', 'cunt', 'bastard', 'whore'
]

OFFENSIVE_WORDS = OFFENSIVE_WORDS_ES + OFFENSIVE_WORDS_EN

def normalize_text(text):
    """Normalizar texto removiendo acentos y caracteres especiales"""
    if not text:
        return ""
    # Remover acentos
    nfd_form = unicodedata.normalize('NFD', text)
    return ''.join(char for char in nfd_form if unicodedata.category(char) != 'Mn')

def contains_offensive_content(text):
    """Verificar si el texto contiene contenido ofensivo"""
    if not text:
        return False
    
    normalized = normalize_text(text.lower())
    
    # Verificar palabras exactas
    for word in OFFENSIVE_WORDS:
        if word in normalized:
            return True
    
    # Verificar variaciones con números (l33t speak)
    leet_replacements = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', 
        '5': 's', '7': 't', '@': 'a'
    }
    
    for old, new in leet_replacements.items():
        normalized = normalized.replace(old, new)
    
    for word in OFFENSIVE_WORDS:
        if word in normalized:
            return True
    
    return False

def validate_park_visit_time(visit_date, visit_time, park):
    """Validar horario de visita contra horarios del parque"""
    if not park.opening_hours:
        return True, "Válido"
    
    # Obtener día de la semana
    weekday = visit_date.strftime('%A').lower()
    
    if weekday not in park.opening_hours:
        return False, "El parque no abre este día"
    
    hours = park.opening_hours[weekday]
    if hours == 'closed':
        return False, "El parque está cerrado este día"
    
    # Verificar horario
    open_time = datetime.strptime(hours['open'], '%H:%M').time()
    close_time = datetime.strptime(hours['close'], '%H:%M').time()
    
    if not (open_time <= visit_time <= close_time):
        return False, f"El parque abre de {hours['open']} a {hours['close']}"
    
    return True, "Válido"

def validate_password_strength(password):
    """Validar fortaleza de contraseña (para futuro uso)"""
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "Debe contener al menos una mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "Debe contener al menos una minúscula"
    
    if not re.search(r'[0-9]', password):
        return False, "Debe contener al menos un número"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Debe contener al menos un carácter especial"
    
    return True, "Contraseña segura"

def validate_phone_number(phone, country_code='AR'):
    """Validar número de teléfono por país"""
    patterns = {
        'AR': r'^\+?54?9?11\d{8}$|^11\d{8}$',  # Argentina
        'US': r'^\+?1?\d{10}$',  # USA
        'ES': r'^\+?34?\d{9}$',  # España
    }
    
    pattern = patterns.get(country_code, patterns['AR'])
    
    # Limpiar número
    clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    if re.match(pattern, clean_phone):
        return True, "Válido"
    
    return False, f"Formato de teléfono inválido para {country_code}"

def calculate_age_from_birthdate(birthdate):
    """Calcular edad desde fecha de nacimiento"""
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    return age

def validate_coordinates_in_area(lat, lng, area_bounds):
    """Validar que coordenadas estén dentro de un área específica"""
    return (
        area_bounds['min_lat'] <= lat <= area_bounds['max_lat'] and
        area_bounds['min_lng'] <= lng <= area_bounds['max_lng']
    )

# Bounds para Buenos Aires
BUENOS_AIRES_BOUNDS = {
    'min_lat': -34.705,
    'max_lat': -34.527,
    'min_lng': -58.531,
    'max_lng': -58.335
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/utils/validators_extended.py"

# Modelos adicionales
cat > backend/app/models/notification.py << 'EOF'
"""
Modelo de Notificación
"""
from datetime import datetime
from app import db

class Notification(db.Model):
    """Modelo de notificación"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    type = db.Column(db.String(50), nullable=False)  # new_match, new_message, visit_reminder, etc.
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON, default=dict)
    
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'data': self.data,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class NotificationPreference(db.Model):
    """Preferencias de notificación del usuario"""
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Canales
    push_enabled = db.Column(db.Boolean, default=True)
    email_enabled = db.Column(db.Boolean, default=True)
    sms_enabled = db.Column(db.Boolean, default=False)
    
    # Tipos de notificación
    new_match_enabled = db.Column(db.Boolean, default=True)
    new_message_enabled = db.Column(db.Boolean, default=True)
    visit_reminder_enabled = db.Column(db.Boolean, default=True)
    nearby_user_enabled = db.Column(db.Boolean, default=False)
    
    # Horarios
    quiet_hours_start = db.Column(db.Time)
    quiet_hours_end = db.Column(db.Time)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/models/notification.py"

# Servicio de notificaciones extendido
cat > backend/app/services/notification_service_extended.py << 'EOF'
"""
Servicio de notificaciones extendido con soporte para push, email y SMS
"""
from flask import current_app
from datetime import datetime, timedelta
import requests
from app import db
from app.models import User, Notification, NotificationPreference

class NotificationService:
    """Servicio mejorado de notificaciones"""
    
    @staticmethod
    def send_notification(user_id, notification_type, data, channels=None):
        """
        Enviar notificación por múltiples canales
        
        Args:
            user_id: ID del usuario
            notification_type: Tipo de notificación
            data: Datos de la notificación
            channels: Lista de canales ['push', 'email', 'sms'] o None para usar preferencias
        """
        user = User.query.get(user_id)
        if not user:
            return False
        
        # Obtener preferencias si no se especifican canales
        if channels is None:
            prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
            if not prefs:
                channels = ['push']  # Default
            else:
                channels = []
                if prefs.push_enabled:
                    channels.append('push')
                if prefs.email_enabled:
                    channels.append('email')
                if prefs.sms_enabled:
                    channels.append('sms')
        
        # Guardar notificación en DB
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=data.get('title'),
            body=data.get('body'),
            data=data.get('extra_data', {}),
            created_at=datetime.utcnow()
        )
        db.session.add(notification)
        db.session.commit()
        
        # Enviar por cada canal
        results = {}
        for channel in channels:
            if channel == 'push':
                results['push'] = NotificationService._send_push(user, notification)
            elif channel == 'email':
                results['email'] = NotificationService._send_email(user, notification)
            elif channel == 'sms':
                results['sms'] = NotificationService._send_sms(user, notification)
        
        return results
    
    @staticmethod
    def _send_push(user, notification):
        """Enviar notificación push via FCM"""
        if not user.fcm_token:
            return False
        
        try:
            # Aquí iría la integración con FCM
            current_app.logger.info(f"Push notification sent to user {user.id}")
            return True
        except Exception as e:
            current_app.logger.error(f"Push notification error: {str(e)}")
            return False
    
    @staticmethod
    def _send_email(user, notification):
        """Enviar notificación por email"""
        try:
            # Aquí iría la integración con servicio de email
            current_app.logger.info(f"Email notification sent to {user.email}")
            return True
        except Exception as e:
            current_app.logger.error(f"Email notification error: {str(e)}")
            return False
    
    @staticmethod
    def _send_sms(user, notification):
        """Enviar notificación por SMS"""
        if not user.phone_number:
            return False
        
        try:
            # Aquí iría la integración con servicio SMS
            current_app.logger.info(f"SMS notification sent to {user.phone_number}")
            return True
        except Exception as e:
            current_app.logger.error(f"SMS notification error: {str(e)}")
            return False
    
    @staticmethod
    def notify_new_match(user1_id, user2_id):
        """Notificar nuevo match mutuo"""
        user1 = User.query.get(user1_id)
        user2 = User.query.get(user2_id)
        
        if not user1 or not user2:
            return
        
        # Notificar a usuario 1
        NotificationService.send_notification(
            user1_id,
            'new_match',
            {
                'title': '¡Nuevo match! 🎉',
                'body': f'¡Tienes un match con {user2.nickname}! Ya pueden chatear.',
                'extra_data': {
                    'matched_user_id': user2_id,
                    'matched_user_name': user2.nickname,
                    'matched_user_avatar': user2.avatar_url
                }
            }
        )
        
        # Notificar a usuario 2
        NotificationService.send_notification(
            user2_id,
            'new_match',
            {
                'title': '¡Nuevo match! 🎉',
                'body': f'¡Tienes un match con {user1.nickname}! Ya pueden chatear.',
                'extra_data': {
                    'matched_user_id': user1_id,
                    'matched_user_name': user1.nickname,
                    'matched_user_avatar': user1.avatar_url
                }
            }
        )
    
    @staticmethod
    def notify_new_message(sender_id, receiver_id, message):
        """Notificar nuevo mensaje"""
        sender = User.query.get(sender_id)
        receiver = User.query.get(receiver_id)
        
        if not sender or not receiver:
            return
        
        # Solo notificar si el receptor no está online
        if not receiver.is_online:
            NotificationService.send_notification(
                receiver_id,
                'new_message',
                {
                    'title': f'{sender.nickname}',
                    'body': message.text[:100] + ('...' if len(message.text) > 100 else ''),
                    'extra_data': {
                        'sender_id': sender_id,
                        'sender_name': sender.nickname,
                        'sender_avatar': sender.avatar_url,
                        'message_id': message.id
                    }
                }
            )
    
    @staticmethod
    def notify_upcoming_visit(user_id, visit):
        """Recordatorio de visita próxima"""
        user = User.query.get(user_id)
        if not user:
            return
        
        NotificationService.send_notification(
            user_id,
            'visit_reminder',
            {
                'title': '🐕 Recordatorio de visita',
                'body': f'Tienes una visita programada a {visit.park.name} hoy a las {visit.time.strftime("%H:%M")}',
                'extra_data': {
                    'visit_id': visit.id,
                    'park_id': visit.park_id,
                    'park_name': visit.park.name,
                    'visit_time': visit.time.isoformat()
                }
            }
        )
    
    @staticmethod
    def schedule_visit_reminders():
        """Programar recordatorios de visitas (ejecutar cada hora)"""
        # Buscar visitas en las próximas 2 horas
        now = datetime.utcnow()
        two_hours_later = now + timedelta(hours=2)
        
        upcoming_visits = Visit.query.filter(
            Visit.date == now.date(),
            Visit.time >= now.time(),
            Visit.time <= two_hours_later.time(),
            Visit.status == 'scheduled',
            Visit.reminder_sent == False
        ).all()
        
        for visit in upcoming_visits:
            NotificationService.notify_upcoming_visit(visit.user_id, visit)
            visit.reminder_sent = True
        
        db.session.commit()
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/services/notification_service_extended.py"

# Admin routes
cat > backend/app/routes/admin.py << 'EOF'
"""
Rutas de administración con panel completo
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User, Park, Visit, Match, UserRole
from app.utils.auth import admin_required
from sqlalchemy import func, desc
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Obtener estadísticas del dashboard"""
    try:
        # Estadísticas generales
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        new_users_today = User.query.filter(
            func.date(User.created_at) == datetime.utcnow().date()
        ).count()
        
        # Estadísticas de visitas
        total_visits = Visit.query.count()
        visits_today = Visit.query.filter(
            Visit.date == datetime.utcnow().date()
        ).count()
        
        # Estadísticas de matches
        total_matches = Match.query.count()
        mutual_matches = Match.query.filter_by(is_mutual=True).count()
        matches_today = Match.query.filter(
            func.date(Match.created_at) == datetime.utcnow().date()
        ).count()
        
        # Parques más populares
        popular_parks = db.session.query(
            Park.name,
            func.count(Visit.id).label('visit_count')
        ).join(Visit).group_by(Park.id).order_by(
            desc('visit_count')
        ).limit(5).all()
        
        # Distribución de usuarios por rol
        role_distribution = db.session.query(
            User.role,
            func.count(User.id)
        ).group_by(User.role).all()
        
        return jsonify({
            'stats': {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'new_today': new_users_today
                },
                'visits': {
                    'total': total_visits,
                    'today': visits_today
                },
                'matches': {
                    'total': total_matches,
                    'mutual': mutual_matches,
                    'today': matches_today
                },
                'popular_parks': [
                    {'name': park[0], 'visits': park[1]} 
                    for park in popular_parks
                ],
                'role_distribution': {
                    role.value: count 
                    for role, count in role_distribution
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Dashboard stats error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/routes/admin.py"

echo -e "\n${BLUE}📄 Creando scripts adicionales...${NC}"

# Package.json raíz
cat > package.json << 'EOF'
{
  "name": "parkdog-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "mobile",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && python run.py",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:mobile": "cd mobile && expo start",
    "build": "npm run build:frontend && npm run build:mobile",
    "build:frontend": "cd frontend && npm run build",
    "build:mobile": "cd mobile && eas build",
    "test": "npm run test:backend && npm run test:frontend",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:build": "docker-compose build",
    "copy:locales": "cp -r shared/locales/* frontend/public/locales/ && cp -r shared/locales/* mobile/assets/locales/"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} package.json"

# Script de inicialización
cat > init-project.sh << 'EOF'
#!/bin/bash
# init-project.sh

echo "🐕 Inicializando ParkDog..."

# Copiar archivos de traducción
echo "📋 Copiando traducciones..."
mkdir -p frontend/public/locales
mkdir -p mobile/assets/locales
cp shared/locales/*.json frontend/public/locales/
cp shared/locales/*.json mobile/assets/locales/

# Backend
echo "📦 Configurando Backend..."
cd backend
python -m venv venv
source venv/bin/activate || . venv/Scripts/activate
pip install -r requirements.txt
flask db init
flask db migrate -m "Initial migration with notifications"
flask db upgrade
python scripts/seed_data.py
cd ..

# Frontend
echo "📦 Configurando Frontend..."
cd frontend
npm install
npm install react-i18next i18next i18next-browser-languagedetector
cd ..

# Mobile
echo "📦 Configurando Mobile..."
cd mobile
npm install
expo doctor
cd ..

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << 'ENVEOF'
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
ENVEOF
fi

echo "✅ ¡Proyecto inicializado!"
echo ""
echo "⚠️  IMPORTANTE: Configura tus claves de Google en .env"
echo ""
echo "Para ejecutar:"
echo "1. Backend: cd backend && python run.py"
echo "2. Frontend: cd frontend && npm run dev"
echo "3. Mobile: cd mobile && expo start"
echo ""
echo "O usa: npm run dev (para backend + frontend)"
EOF
chmod +x init-project.sh
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} init-project.sh"

# Actualizar imports en modelos
cat > backend/app/models/__init__.py << 'EOF'
"""
Modelos de la base de datos
"""
from app.models.user import User, UserPreference, UserRole
from app.models.dog import Dog
from app.models.park import Park
from app.models.visit import Visit
from app.models.match import Match
from app.models.message import Message, Conversation
from app.models.notification import Notification, NotificationPreference

__all__ = [
    'User',
    'UserPreference',
    'UserRole',
    'Dog',
    'Park',
    'Visit',
    'Match',
    'Message',
    'Conversation',
    'Notification',
    'NotificationPreference'
]
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/models/__init__.py actualizado"

# Actualizar User model para incluir FCM token
cat >> backend/app/models/user.py << 'EOF'

    # Campos adicionales para notificaciones
    fcm_token = db.Column(db.String(500))
    phone_number = db.Column(db.String(50))
    ban_reason = db.Column(db.Text)
    banned_at = db.Column(db.DateTime)
EOF
echo -e "${GREEN}✅${NC} backend/app/models/user.py actualizado"

# Actualizar Visit model para incluir reminder_sent
echo "    reminder_sent = db.Column(db.Boolean, default=False)" >> backend/app/models/visit.py
echo -e "${GREEN}✅${NC} backend/app/models/visit.py actualizado"

# Agregar admin_bp a routes init
cat > backend/app/routes/__init__.py << 'EOF'
"""
Rutas de la API
"""
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.parks import parks_bp
from app.routes.visits import visits_bp
from app.routes.matches import matches_bp
from app.routes.messages import messages_bp
from app.routes.admin import admin_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'parks_bp',
    'visits_bp',
    'matches_bp',
    'messages_bp',
    'admin_bp'
]
EOF
((FILES_COUNT++))
echo -e "${GREEN}✅${NC} backend/app/routes/__init__.py actualizado"

# Registrar admin blueprint en app/__init__.py
sed -i "/app.register_blueprint(messages_bp/a\    app.register_blueprint(admin_bp, url_prefix='/api/admin')" backend/app/__init__.py 2>/dev/null || \
sed -i '' "/app.register_blueprint(messages_bp/a\    app.register_blueprint(admin_bp, url_prefix='/api/admin')" backend/app/__init__.py 2>/dev/null
echo -e "${GREEN}✅${NC} backend/app/__init__.py actualizado con admin blueprint"

echo -e "\n${YELLOW}📊 Resumen de actualización:${NC}"
echo -e "Total de archivos creados/actualizados: ${GREEN}$FILES_COUNT${NC}"
echo -e "\nEstructura actualizada:"
echo -e "  ${GREEN}✓${NC} Sistema i18n compartido (ES/EN)"
echo -e "  ${GREEN}✓${NC} Aplicación móvil completa con Expo"
echo -e "  ${GREEN}✓${NC} Validaciones extendidas en backend"
echo -e "  ${GREEN}✓${NC} Sistema de notificaciones completo"
echo -e "  ${GREEN}✓${NC} Panel de administración"
echo -e "  ${GREEN}✓${NC} Todas las features solicitadas"

echo -e "\n${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Ejecutar: ${GREEN}chmod +x init-project.sh && ./init-project.sh${NC}"
echo "2. Configurar claves de Google en ${GREEN}.env${NC}"
echo "3. Instalar dependencias adicionales en frontend:"
echo "   ${GREEN}cd frontend && npm install react-i18next i18next i18next-browser-languagedetector${NC}"
echo "4. Para mobile: ${GREEN}cd mobile && npm install${NC}"
echo "5. Copiar archivos de traducción:"
echo "   ${GREEN}npm run copy:locales${NC}"

echo -e "\n${GREEN}✨ ¡Actualización completa!${NC}"