# Guía Completa: Arquitectura de la App Mobile (React Native)

**Versión**: React Native 0.82.1
**Plataforma**: Android (Nueva Arquitectura)
**Última actualización**: Noviembre 2025

---

## 📚 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura General del Proyecto](#estructura-general-del-proyecto)
3. [Archivos de Configuración Raíz](#archivos-de-configuración-raíz)
4. [Carpeta Android (Nativa)](#carpeta-android-nativa)
5. [Carpeta src/ (Código React Native)](#carpeta-src-código-react-native)
6. [Navegación](#navegación)
7. [Estado Global (Redux)](#estado-global-redux)
8. [Servicios](#servicios)
9. [Componentes](#componentes)
10. [Hooks Personalizados](#hooks-personalizados)
11. [Internacionalización (i18n)](#internacionalización-i18n)
12. [Assets y Recursos](#assets-y-recursos)
13. [Configuración de Build](#configuración-de-build)
14. [Flujo de Ejecución](#flujo-de-ejecución)
15. [Buenas Prácticas](#buenas-prácticas)

---

## 1. Introducción

### ¿Qué es React Native?

React Native es un framework que te permite crear aplicaciones móviles nativas usando JavaScript y React. A diferencia de aplicaciones web empaquetadas, React Native compila tu código a componentes nativos reales de Android/iOS.

### Nueva Arquitectura

A partir de React Native 0.68+, tenemos una "Nueva Arquitectura" que incluye:

- **Fabric**: Nuevo motor de renderizado (más rápido)
- **TurboModules**: Sistema mejorado para módulos nativos
- **JSI (JavaScript Interface)**: Comunicación directa entre JS y código nativo

### Nuestra Configuración

- **Solo Android**: Proyecto configurado únicamente para Android
- **React Native CLI**: Usamos el CLI oficial (NO Expo)
- **TypeScript**: Soporte para TypeScript
- **Nueva Arquitectura**: Habilitada por defecto

---

## 2. Estructura General del Proyecto

```
mobile/
├── android/                 # Código nativo de Android
├── assets/                  # Recursos estáticos (iconos, fuentes)
├── src/                     # Código fuente de la app
├── node_modules/            # Dependencias de npm
├── .gitignore              # Archivos ignorados por Git
├── app.json                # Metadata de la app
├── babel.config.js         # Configuración de Babel
├── index.js                # Punto de entrada de la app
├── metro.config.js         # Configuración del bundler
├── package.json            # Dependencias y scripts
├── react-native.config.js  # Config de React Native CLI
└── tsconfig.json           # Configuración de TypeScript
```

### ¿Por qué esta estructura?

- **android/**: Contiene el proyecto Android nativo. Aquí está el código Java/Kotlin que arranca tu app
- **src/**: Todo tu código React está aquí (componentes, pantallas, lógica)
- **assets/**: Imágenes, fuentes, iconos que usa tu app
- **node_modules/**: Librerías de terceros (se instalan con `npm install`)

---

## 3. Archivos de Configuración Raíz

### 📄 `package.json`

**Propósito**: Define las dependencias, scripts y metadata del proyecto Node.js.

```json
{
  "name": "ParkDog",
  "version": "0.0.1",
  "scripts": {
    "android": "react-native run-android",  // Compila e instala en Android
    "start": "react-native start",          // Inicia Metro (bundler)
    "lint": "eslint .",                     // Revisa código
    "test": "jest"                          // Corre tests
  },
  "dependencies": {
    "react-native": "0.82.1",              // Framework principal
    "@react-navigation/native": "^7.1.19", // Navegación
    "@reduxjs/toolkit": "^2.10.1",         // Estado global
    // ... más dependencias
  }
}
```

**Conceptos clave**:
- **dependencies**: Librerías que tu app necesita para funcionar
- **devDependencies**: Herramientas solo para desarrollo (linters, formatters)
- **scripts**: Comandos que puedes correr con `npm run <nombre>`

---

### 📄 `index.js`

**Propósito**: Punto de entrada de la aplicación. El primer archivo que se ejecuta.

```javascript
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Registra el componente principal con el nombre de la app
AppRegistry.registerComponent(appName, () => App);
```

**¿Qué hace?**
1. Importa `AppRegistry` (API de React Native para registrar apps)
2. Importa tu componente `App` principal
3. Lee el nombre de la app desde `app.json`
4. Registra `App` como el componente raíz

**Flujo**:
```
Android nativo → index.js → App.tsx → Tu código React
```

---

### 📄 `app.json`

**Propósito**: Configuración básica de la aplicación.

```json
{
  "name": "ParkDog",        // Nombre interno (para AppRegistry)
  "displayName": "ParkDog"  // Nombre que ve el usuario
}
```

**Diferencias**:
- `name`: Usado en el código (debe coincidir con `AppRegistry.registerComponent`)
- `displayName`: Lo que aparece debajo del ícono de la app en el launcher

---

### 📄 `babel.config.js`

**Propósito**: Configura Babel, el compilador que transforma tu código moderno de JS/JSX a código que React Native entiende.

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

**¿Qué es Babel?**
- Convierte JSX (`<View>`) en llamadas a funciones JavaScript
- Transforma ES6+ a JavaScript compatible
- Maneja imports/exports

**Ejemplo de transformación**:
```jsx
// Tu código
<View><Text>Hola</Text></View>

// Babel lo convierte a:
React.createElement(View, null,
  React.createElement(Text, null, "Hola")
)
```

---

### 📄 `metro.config.js`

**Propósito**: Configura Metro, el bundler de JavaScript de React Native (como Webpack pero para móviles).

```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

**¿Qué es Metro?**
- Empaqueta todos tus archivos .js/.jsx en un solo archivo bundle
- Habilita Fast Refresh (recarga automática al guardar)
- Optimiza el código para producción

**Flujo de Metro**:
```
Código fuente (.js, .jsx) → Metro → Bundle JavaScript → App
                              ↓
                         Fast Refresh
```

---

### 📄 `tsconfig.json`

**Propósito**: Configuración de TypeScript (chequeo de tipos).

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "jsx": "react-native"
  }
}
```

**¿Para qué sirve TypeScript?**
- Detecta errores ANTES de ejecutar la app
- Autocompletado en tu editor
- Documentación automática de tipos

---

### 📄 `react-native.config.js`

**Propósito**: Configuración personalizada del CLI de React Native.

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'], // Donde están las fuentes personalizadas
};
```

**Uso común**:
- Especificar donde están las fuentes custom
- Configurar autolinking de dependencias nativas
- Definir rutas personalizadas

---

### 📄 `.gitignore`

**Propósito**: Indica a Git qué archivos NO subir al repositorio.

```gitignore
node_modules/        # Dependencias (se reinstalan con npm install)
.env                 # Secretos y configuración local
android/app/build/   # Archivos compilados temporales
*.log                # Logs
```

**¿Por qué ignorar archivos?**
- `node_modules/`: Muy pesado, cada quien lo instala localmente
- `.env`: Contiene secretos (API keys)
- `build/`: Archivos temporales de compilación
- `.log`: Archivos de depuración

---

## 4. Carpeta Android (Nativa)

### Estructura

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/parkdog/app/
│   │   │   │   ├── MainActivity.kt         # Activity principal
│   │   │   │   ├── MainApplication.kt      # Clase Application
│   │   │   │   └── BuildConfigModule.kt    # Módulo nativo para .env
│   │   │   ├── res/                        # Recursos Android
│   │   │   │   ├── mipmap-*/               # Íconos de la app
│   │   │   │   └── values/
│   │   │   │       ├── strings.xml         # Textos del sistema
│   │   │   │       └── styles.xml          # Estilos Android
│   │   │   └── AndroidManifest.xml         # Manifiesto (permisos, config)
│   │   └── debug/
│   │       └── AndroidManifest.xml         # Config para debug
│   ├── build.gradle                        # Build del módulo app
│   ├── google-services.json                # Config de Firebase/Google
│   └── debug.keystore                      # Certificado debug
├── build.gradle                            # Build del proyecto
├── settings.gradle                         # Módulos del proyecto
├── gradle.properties                       # Propiedades de Gradle
└── gradlew.bat                             # Script de Gradle (Windows)
```

---

### 📄 `android/app/src/main/java/com/parkdog/app/MainActivity.kt`

**Propósito**: Activity principal de Android, el punto de entrada nativo.

```kotlin
package com.parkdog.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  // Nombre del componente React registrado en index.js
  override fun getMainComponentName(): String = "ParkDog"

  // Configuración para Nueva Arquitectura
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

**¿Qué es una Activity?**
- En Android, una Activity es una "pantalla" de la app
- `MainActivity` es la primera pantalla que se muestra
- Aquí es donde React Native se "monta" en Android

**Conceptos clave**:
- `getMainComponentName()`: Debe coincidir con el nombre en `AppRegistry.registerComponent()`
- `fabricEnabled`: Activa la Nueva Arquitectura (Fabric)

---

### 📄 `android/app/src/main/java/com/parkdog/app/MainApplication.kt`

**Propósito**: Clase principal de la aplicación Android, se ejecuta al iniciar la app.

```kotlin
package com.parkdog.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  // Host de React Native
  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Aquí se agregan módulos nativos custom
              add(BuildConfigModule(reactContext))
            }

        override fun getJSMainModuleName(): String = "index"

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load() // Carga Nueva Arquitectura
    }
  }
}
```

**¿Qué hace?**
1. Configura el entorno de React Native
2. Registra todos los paquetes/módulos nativos
3. Define qué motor JS usar (Hermes)
4. Inicializa la Nueva Arquitectura si está habilitada

**Hermes**:
- Motor JavaScript optimizado para React Native
- Más rápido que JavaScriptCore
- Menor uso de memoria

---

### 📄 `android/app/src/main/AndroidManifest.xml`

**Propósito**: Manifiesto de la aplicación Android. Define permisos, actividades y configuración.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permisos que la app necesita -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <!-- Activity principal -->
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

**Conceptos clave**:

- **`<uses-permission>`**: Permisos que la app solicita al usuario
  - `INTERNET`: Acceso a internet
  - `ACCESS_FINE_LOCATION`: GPS
  - `CAMERA`: Cámara

- **`<application>`**: Configuración de la app
  - `android:name`: Clase Application (MainApplication)
  - `android:label`: Nombre visible de la app
  - `android:icon`: Ícono de la app
  - `android:usesCleartextTraffic`: Permitir HTTP (solo para desarrollo)

- **`<activity>`**: Definición de Activities
  - `android:exported="true"`: Permite que la app sea lanzada desde el launcher
  - `<intent-filter>`: Define que esta es la Activity de inicio

---

### 📄 `android/app/build.gradle`

**Propósito**: Configuración de compilación del módulo de la app.

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

// Leer variables de entorno desde .env
def dotenv = [:]
def envFile = file("../../.env")
if (envFile.exists()) {
    envFile.eachLine { line ->
        def (key, value) = line.tokenize('=')
        if (key && value) {
            dotenv[key.trim()] = value.trim()
        }
    }
}

react {
    // Configuración de React Native
    autolinkLibrariesWithApp()
}

android {
    namespace "com.parkdog.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.parkdog.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"

        // Inyectar variables .env en BuildConfig
        buildConfigField "String", "API_URL", "\"${dotenv['API_URL']}\""
        buildConfigField "String", "GOOGLE_WEB_CLIENT_ID", "\"${dotenv['GOOGLE_WEB_CLIENT_ID']}\""
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")

    // Google Services
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}

// Plugin de Google Services (Firebase)
apply plugin: 'com.google.gms.google-services'
```

**Conceptos clave**:

- **`namespace`**: Identificador único de tu app en Android
- **`applicationId`**: ID único en Play Store (com.parkdog.app)
- **`minSdkVersion`**: Android mínimo soportado (24 = Android 7.0)
- **`targetSdkVersion`**: Android para el que está optimizada
- **`versionCode`**: Número de versión interno (se incrementa en cada release)
- **`versionName`**: Versión visible para usuarios ("1.0", "2.3", etc)

- **`buildConfigField`**: Crea constantes accesibles desde Kotlin/Java
  ```kotlin
  val apiUrl = BuildConfig.API_URL // Definido en build.gradle
  ```

- **Build Types**:
  - **debug**: Para desarrollo, sin optimizaciones
  - **release**: Para producción, código minificado y ofuscado

---

### 📄 `android/build.gradle`

**Propósito**: Configuración de build del proyecto completo (no solo app).

```gradle
buildscript {
    ext {
        kotlinVersion = '1.9.22'
        buildToolsVersion = "34.0.0"
        minSdkVersion = 24
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath('com.android.tools.build:gradle:8.1.0')
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
        classpath("com.google.gms:google-services:4.4.2")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

**¿Qué define?**
- Versiones de herramientas de build
- Repositorios de dependencias (Google Maven, Maven Central)
- Plugins globales del proyecto

---

### 📄 `android/settings.gradle`

**Propósito**: Define qué módulos incluir en el proyecto.

```gradle
rootProject.name = 'ParkDog'

// Incluir módulo de la app
include ':app'

// Gradle plugin de React Native
includeBuild(new File(["node", "--print", "require.resolve('@react-native/gradle-plugin/package.json')"].execute().text.trim()).getParentFile())

// Auto-linking de dependencias nativas
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute().text.trim()).getParent() + "/scripts/settings.gradle"
```

**Auto-linking**:
- React Native vincula automáticamente librerías nativas
- No necesitas agregar manualmente cada librería en Gradle

---

### 📄 `android/gradle.properties`

**Propósito**: Propiedades de configuración de Gradle.

```properties
# Memoria para Gradle
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g

# Habilitar Hermes (motor JS)
hermesEnabled=true

# Nueva Arquitectura
newArchEnabled=true

# Package name
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
```

**Configuraciones importantes**:
- `hermesEnabled`: Usa Hermes en lugar de JSC
- `newArchEnabled`: Activa Fabric y TurboModules
- Configuración de firma (para releases)

---

### 📄 `android/app/google-services.json`

**Propósito**: Configuración de Firebase y Google Services.

```json
{
  "project_info": {
    "project_number": "301209986798",
    "project_id": "parkdog-app"
  },
  "client": [{
    "client_info": {
      "android_client_info": {
        "package_name": "com.parkdog.app"
      }
    },
    "oauth_client": [{
      "client_id": "TU_WEB_CLIENT_ID.apps.googleusercontent.com",
      "client_type": 3
    }]
  }]
}
```

**¿Para qué sirve?**
- Google Sign-In
- Firebase Analytics
- Push Notifications
- Otros servicios de Google

**IMPORTANTE**: Este archivo contiene configuración sensible. No committearlo a repositorios públicos.

---

## 5. Carpeta src/ (Código React Native)

### Estructura Completa

```
src/
├── components/           # Componentes reutilizables
│   ├── common/          # Componentes genéricos (Button, Input, etc)
│   ├── icons/           # Iconos custom
│   ├── onboarding/      # Componentes específicos de onboarding
│   └── parks/           # Componentes de parques
├── config/              # Configuración de la app
│   └── Config.js        # Variables de entorno accesibles desde JS
├── hooks/               # Custom hooks de React
│   ├── useAuth.js       # Hook de autenticación
│   ├── useLocation.js   # Hook de geolocalización
│   └── useParks.js      # Hook de parques
├── i18n/                # Internacionalización
│   ├── index.js         # Configuración de i18next
│   └── locales/         # Traducciones
│       ├── en.json      # Inglés
│       └── es.json      # Español
├── lib/                 # Librerías y utilidades
│   ├── api/             # Cliente API y endpoints
│   └── queryClient.js   # Configuración React Query
├── navigation/          # Navegación de la app
│   ├── AppNavigator.js  # Navegador raíz
│   ├── AuthNavigator.js # Stack de autenticación
│   └── MainNavigator.js # Tab navigation principal
├── screens/             # Pantallas de la app
│   ├── auth/            # Pantallas de login/registro
│   ├── parks/           # Pantallas de parques
│   ├── profile/         # Pantallas de perfil
│   └── onboarding/      # Pantallas de onboarding
├── services/            # Servicios (API, Socket, etc)
│   ├── OptimizedMobileSocketClient.js
│   └── api/
├── store/               # Estado global (Redux)
│   ├── index.js         # Configuración del store
│   └── slices/          # Redux slices
│       ├── userSlice.js
│       └── chatSlice.js
├── theme.js             # Tema y estilos globales
└── utils/               # Utilidades
    ├── logger.js
    └── toastConfig.js
```

---

### 📁 `src/config/Config.js`

**Propósito**: Exponer variables de entorno (desde `.env` o `BuildConfig`) a JavaScript.

```javascript
import { NativeModules, Platform } from 'react-native'

const { BuildConfig } = NativeModules

const Config = {
  API_URL: BuildConfig?.API_URL || 'http://10.0.2.2:5000/api',
  WS_URL: BuildConfig?.WS_URL || 'http://10.0.2.2:5000',
  GOOGLE_WEB_CLIENT_ID: BuildConfig?.GOOGLE_WEB_CLIENT_ID || '',
}

export default Config
```

**¿Cómo funciona?**
1. `BuildConfigModule` (Kotlin) lee `.env` y crea constantes
2. Se expone a JavaScript como `NativeModules.BuildConfig`
3. `Config.js` lo encapsula en un objeto fácil de usar

**Uso**:
```javascript
import Config from './config/Config'
const apiUrl = Config.API_URL
```

---

### 📁 `src/navigation/`

**Propósito**: Gestionar la navegación entre pantallas.

**Librería**: `@react-navigation/native`

#### Estructura de navegación

```
AppNavigator (Root)
├── AuthNavigator (Stack)
│   └── LoginScreen
└── MainNavigator (Authenticated)
    ├── HomeNavigator (Tab)
    │   ├── ParksScreen
    │   └── MapScreen
    ├── ProfileNavigator (Tab)
    │   ├── ProfileScreen
    │   └── SettingsScreen
    └── ChatsNavigator (Tab)
        └── ChatsListScreen
```

#### `AppNavigator.js` (Navegador raíz)

```javascript
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'

export default function AppNavigator() {
  const user = useSelector((state) => state.user.currentUser)

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
```

**Lógica**:
- Si hay usuario autenticado → Muestra `MainNavigator`
- Si no hay usuario → Muestra `AuthNavigator` (login)

#### `AuthNavigator.js` (Stack de autenticación)

```javascript
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/auth/LoginScreen'
import OnboardingNavigator from './OnboardingNavigator'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
    </Stack.Navigator>
  )
}
```

**Stack Navigator**: Pila de pantallas (como un historial del navegador)

#### `MainNavigator.js` (Tab navigation)

```javascript
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeNavigator from './HomeNavigator'
import ProfileNavigator from './ProfileNavigator'
import ChatsNavigator from './ChatsNavigator'

const Tab = createBottomTabNavigator()

export default function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Chats" component={ChatsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  )
}
```

**Tab Navigator**: Barra de pestañas inferior (como Instagram, WhatsApp)

---

### 📁 `src/store/` (Redux)

**Propósito**: Estado global de la aplicación.

**Librería**: `@reduxjs/toolkit`

#### ¿Qué es Redux?

Redux es un contenedor de estado predecible. Imagina una "base de datos" en memoria compartida por toda la app.

**Conceptos**:
- **Store**: Contenedor del estado global
- **Slice**: Porción del estado (usuarios, chats, etc)
- **Action**: Evento que modifica el estado
- **Reducer**: Función que aplica la acción al estado

#### `store/index.js`

```javascript
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
  },
})
```

#### `store/slices/userSlice.js`

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginAPI } from '../../services/api/auth'

// Acción asíncrona
export const loginWithGoogle = createAsyncThunk(
  'user/loginWithGoogle',
  async (googleToken) => {
    const response = await loginAPI(googleToken)
    return response.data
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.currentUser = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload.user
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  },
})

export const { logout } = userSlice.actions
export default userSlice.reducer
```

**Uso en componentes**:
```javascript
import { useSelector, useDispatch } from 'react-redux'
import { loginWithGoogle } from './store/slices/userSlice'

function LoginScreen() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.currentUser)

  const handleLogin = async (token) => {
    await dispatch(loginWithGoogle(token))
  }
}
```

---

### 📁 `src/services/`

**Propósito**: Lógica de comunicación con APIs, WebSockets, etc.

#### `services/api/auth.js`

```javascript
import axios from 'axios'
import Config from '../../config/Config'

const api = axios.create({
  baseURL: Config.API_URL,
})

export const loginAPI = async (googleToken) => {
  return await api.post('/auth/google', { token: googleToken })
}

export const refreshTokenAPI = async (refreshToken) => {
  return await api.post('/auth/refresh', { refreshToken })
}
```

**Patrón de servicios**:
- Encapsula llamadas API
- Maneja errores de forma centralizada
- Facilita testing (puedes mockear servicios)

---

### 📁 `src/hooks/`

**Propósito**: Custom hooks reutilizables.

#### `hooks/useAuth.js`

```javascript
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/userSlice'

export const useAuth = () => {
  const user = useSelector((state) => state.user.currentUser)
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
  }

  return {
    user,
    isAuthenticated: !!user,
    logout: handleLogout,
  }
}
```

**Uso**:
```javascript
function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <View>
      {isAuthenticated && <Text>Hola {user.name}</Text>}
      <Button onPress={logout}>Cerrar sesión</Button>
    </View>
  )
}
```

---

### 📁 `src/i18n/` (Internacionalización)

**Propósito**: Soporte multi-idioma.

**Librería**: `i18next`, `react-i18next`

#### `i18n/index.js`

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: 'es', // Idioma por defecto
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

#### `i18n/locales/es.json`

```json
{
  "auth": {
    "loginTitle": "Bienvenido a ParkDog",
    "loginButton": "Iniciar sesión con Google"
  },
  "parks": {
    "title": "Parques cercanos",
    "noParks": "No hay parques disponibles"
  }
}
```

#### `i18n/locales/en.json`

```json
{
  "auth": {
    "loginTitle": "Welcome to ParkDog",
    "loginButton": "Sign in with Google"
  },
  "parks": {
    "title": "Nearby parks",
    "noParks": "No parks available"
  }
}
```

**Uso en componentes**:
```javascript
import { useTranslation } from 'react-i18next'

function LoginScreen() {
  const { t, i18n } = useTranslation()

  return (
    <View>
      <Text>{t('auth.loginTitle')}</Text>
      <Button onPress={() => i18n.changeLanguage('en')}>
        English
      </Button>
    </View>
  )
}
```

---

### 📁 `src/components/`

**Propósito**: Componentes reutilizables de UI.

#### `components/common/Button.js`

```javascript
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export const Button = ({ title, onPress, variant = 'primary' }) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#6C757D',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

**Ventajas de componentes reutilizables**:
- Consistencia de UI
- Fácil mantenimiento
- Menos código duplicado

---

### 📁 `src/screens/`

**Propósito**: Pantallas completas de la app.

#### `screens/auth/LoginScreen.js`

```javascript
import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useDispatch } from 'react-redux'
import { loginWithGoogle } from '../../store/slices/userSlice'
import { Button } from '../../components/common/Button'
import Config from '../../config/Config'

GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
})

export function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const googleToken = userInfo.data.idToken

      await dispatch(loginWithGoogle(googleToken)).unwrap()
      navigation.replace('Main')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a ParkDog</Text>
      <Button
        title="Iniciar con Google"
        onPress={handleGoogleLogin}
        loading={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
})
```

---

### 📄 `src/theme.js`

**Propósito**: Tema y estilos globales (colores, tipografías).

```javascript
export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#6C757D',
    success: '#28A745',
    danger: '#DC3545',
    background: '#FFFFFF',
    text: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
  },
}
```

**Uso**:
```javascript
import { theme } from './theme'

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.primary,
  },
})
```

---

## 6. Navegación

### Tipos de navegadores

#### 1. Stack Navigator

**Concepto**: Pila de pantallas (como el historial del navegador).

```javascript
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}
```

**Navegación**:
```javascript
// Ir a otra pantalla
navigation.navigate('Signup')

// Volver atrás
navigation.goBack()

// Reemplazar pantalla actual
navigation.replace('Main')

// Pasar parámetros
navigation.navigate('Profile', { userId: 123 })
```

**Recibir parámetros**:
```javascript
function ProfileScreen({ route }) {
  const { userId } = route.params
  // ...
}
```

---

#### 2. Tab Navigator

**Concepto**: Barra de pestañas (como Instagram, Facebook).

```javascript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
```

---

## 7. Estado Global (Redux)

### Conceptos fundamentales

#### Store (Almacén)

El store es un objeto JavaScript que contiene todo el estado de tu app:

```javascript
{
  user: {
    currentUser: { id: 1, name: 'Juan' },
    loading: false,
  },
  chat: {
    messages: [],
    unreadCount: 3,
  }
}
```

#### Slice (Porción)

Un slice es una parte del estado con sus reducers:

```javascript
const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload
    },
  },
})
```

#### Dispatch (Despachar)

Enviar una acción para modificar el estado:

```javascript
dispatch(setUser({ id: 1, name: 'Juan' }))
```

#### Selector (Selector)

Leer valores del estado:

```javascript
const user = useSelector((state) => state.user.currentUser)
```

---

### Flujo completo de Redux

```
Componente → dispatch(action) → Reducer → Store actualizado → Componente re-renderiza
```

**Ejemplo completo**:

```javascript
// 1. Definir slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1
    },
  },
})

// 2. Usar en componente
function Counter() {
  const count = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <View>
      <Text>{count}</Text>
      <Button onPress={() => dispatch(increment())}>+1</Button>
    </View>
  )
}
```

---

## 8. Servicios

### Cliente API con Axios

```javascript
import axios from 'axios'
import Config from '../config/Config'

// Crear instancia de axios
const api = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = getToken() // Desde AsyncStorage o Redux
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, renovar o logout
      logout()
    }
    return Promise.reject(error)
  }
)

export default api
```

---

### WebSockets (Socket.IO)

```javascript
import io from 'socket.io-client'
import Config from '../config/Config'

class SocketClient {
  constructor() {
    this.socket = null
  }

  connect(token) {
    this.socket = io(Config.WS_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Socket conectado')
    })

    this.socket.on('new_message', (message) => {
      // Despachar a Redux
      store.dispatch(addMessage(message))
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  emit(event, data) {
    this.socket.emit(event, data)
  }
}

export default new SocketClient()
```

---

## 9. Componentes

### Componentes principales de React Native

#### View

Equivalente a `<div>` en web. Contenedor genérico.

```javascript
<View style={{ padding: 20, backgroundColor: 'white' }}>
  {/* Contenido */}
</View>
```

#### Text

Para mostrar texto (NO puedes poner texto suelto sin `<Text>`).

```javascript
<Text style={{ fontSize: 16, color: 'black' }}>
  Hola mundo
</Text>
```

#### TouchableOpacity

Botón táctil con feedback visual.

```javascript
<TouchableOpacity onPress={() => console.log('Presionado')}>
  <Text>Tócame</Text>
</TouchableOpacity>
```

#### ScrollView

Contenedor scrollable.

```javascript
<ScrollView>
  <Text>Contenido largo...</Text>
</ScrollView>
```

#### FlatList

Lista optimizada para grandes cantidades de datos.

```javascript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>
```

#### Image

Mostrar imágenes.

```javascript
// Imagen local
<Image source={require('./assets/logo.png')} />

// Imagen de red
<Image source={{ uri: 'https://example.com/image.jpg' }} />
```

#### TextInput

Campo de entrada de texto.

```javascript
<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Escribe algo..."
  secureTextEntry={true} // Para contraseñas
/>
```

---

### Estilos en React Native

React Native usa StyleSheet (NO CSS tradicional).

```javascript
import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
})

// Uso
<View style={styles.container}>
  <Text style={styles.title}>Título</Text>
</View>
```

**Diferencias con CSS**:
- `backgroundColor` en lugar de `background-color`
- `flexDirection: 'row'` por defecto es `column`
- No hay selectores, solo estilos inline o StyleSheet

---

### Flexbox

**Por defecto**, React Native usa Flexbox:

```javascript
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <View style={{ flex: 1, backgroundColor: 'red' }} />
  <View style={{ flex: 2, backgroundColor: 'blue' }} />
</View>
```

**Propiedades clave**:
- `flexDirection`: `row` | `column`
- `justifyContent`: `center` | `space-between` | `flex-start` | `flex-end`
- `alignItems`: `center` | `flex-start` | `flex-end` | `stretch`
- `flex`: Proporción de espacio que ocupa

---

## 10. Hooks Personalizados

### ¿Por qué usar hooks?

Los hooks permiten **reutilizar lógica** entre componentes.

### Ejemplo: `useLocation`

```javascript
import { useState, useEffect } from 'react'
import Geolocation from '@react-native-community/geolocation'

export const useLocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }, [])

  return { location, loading, error }
}
```

**Uso**:
```javascript
function MapScreen() {
  const { location, loading, error } = useLocation()

  if (loading) return <Text>Obteniendo ubicación...</Text>
  if (error) return <Text>Error: {error}</Text>

  return <Text>Lat: {location.latitude}, Lng: {location.longitude}</Text>
}
```

---

## 11. Internacionalización (i18n)

### Configuración

#### 1. Instalar dependencias

```bash
npm install i18next react-i18next react-native-localize
```

#### 2. Configurar i18next

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import en from './locales/en.json'
import es from './locales/es.json'

const languageDetector = {
  type: 'languageDetector',
  detect: () => {
    const locales = RNLocalize.getLocales()
    return locales[0].languageCode
  },
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, es },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
```

#### 3. Usar en componentes

```javascript
import { useTranslation } from 'react-i18next'

function WelcomeScreen() {
  const { t, i18n } = useTranslation()

  return (
    <View>
      <Text>{t('welcome.title')}</Text>
      <Button onPress={() => i18n.changeLanguage('es')}>Español</Button>
      <Button onPress={() => i18n.changeLanguage('en')}>English</Button>
    </View>
  )
}
```

---

## 12. Assets y Recursos

### Estructura

```
assets/
├── fonts/
│   ├── Roboto-Regular.ttf
│   └── Roboto-Bold.ttf
├── images/
│   ├── logo.png
│   └── splash.png
└── icons/
    ├── home.svg
    └── profile.svg
```

### Usar imágenes

```javascript
// Imagen local
import logo from './assets/images/logo.png'
<Image source={logo} style={{ width: 100, height: 100 }} />

// O con require
<Image source={require('./assets/images/logo.png')} />
```

### Usar fuentes custom

#### 1. Configurar en `react-native.config.js`

```javascript
module.exports = {
  assets: ['./assets/fonts/'],
}
```

#### 2. Vincular fuentes

```bash
npx react-native-asset
```

#### 3. Usar en estilos

```javascript
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Roboto-Bold',
  },
})
```

---

## 13. Configuración de Build

### Build de Desarrollo

```bash
# Iniciar Metro (bundler)
npm start

# En otra terminal, instalar en Android
npm run android
```

**¿Qué pasa?**
1. Metro empaqueta tu código JavaScript
2. Gradle compila el código Android nativo
3. APK se instala en el dispositivo/emulador
4. Metro sirve el bundle en modo desarrollo (con Fast Refresh)

---

### Build de Producción

#### 1. Generar APK de Release

```bash
cd android
./gradlew assembleRelease
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

#### 2. Firmar el APK

Para publicar en Play Store, debes firmar con una keystore de release:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 3. Configurar firma en `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'password'
            keyAlias 'my-key-alias'
            keyPassword 'password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 14. Flujo de Ejecución

### Inicio de la App (Desarrollo)

```
1. Usuario abre la app
   ↓
2. Android carga MainActivity.kt
   ↓
3. MainActivity inicializa React Native
   ↓
4. Se carga index.js (punto de entrada JS)
   ↓
5. index.js registra componente "ParkDog" (App.tsx)
   ↓
6. App.tsx renderiza AppNavigator
   ↓
7. AppNavigator decide qué mostrar (Auth o Main)
   ↓
8. Se renderiza la pantalla inicial (LoginScreen o HomeScreen)
```

---

### Fast Refresh (Desarrollo)

```
1. Guardas cambios en un archivo .js
   ↓
2. Metro detecta el cambio
   ↓
3. Metro recompila solo ese módulo
   ↓
4. Envía actualización al dispositivo vía WebSocket
   ↓
5. React Native aplica el cambio SIN recargar toda la app
   ↓
6. Ves el cambio instantáneamente (preservando estado)
```

---

### Navegación entre pantallas

```
1. Usuario toca botón "Ir a Perfil"
   ↓
2. Se ejecuta navigation.navigate('Profile', { userId: 123 })
   ↓
3. React Navigation agrega ProfileScreen a la pila
   ↓
4. Se ejecuta animación de transición
   ↓
5. ProfileScreen se renderiza con params
   ↓
6. Usuario ve la nueva pantalla
```

---

### Llamada API con Redux

```
1. Componente despacha action: dispatch(fetchUserProfile(userId))
   ↓
2. Redux Thunk intercepta la action asíncrona
   ↓
3. Se ejecuta la función async (llamada a API)
   ↓
4. API responde con datos
   ↓
5. Se despacha action de éxito con los datos
   ↓
6. Reducer actualiza el store
   ↓
7. Componente recibe nuevo estado vía useSelector
   ↓
8. Componente re-renderiza con datos actualizados
```

---

## 15. Buenas Prácticas

### Organización de archivos

```
✅ Bueno:
src/
├── components/
│   └── common/        # Componentes genéricos reutilizables
│       ├── Button.js
│       └── Input.js
├── screens/
│   └── auth/          # Pantallas agrupadas por feature
│       └── LoginScreen.js

❌ Malo:
src/
├── Button.js          # Archivos sueltos sin organizar
├── Input.js
└── LoginScreen.js
```

---

### Nomenclatura

```javascript
// ✅ Componentes: PascalCase
const LoginScreen = () => {}

// ✅ Funciones/variables: camelCase
const handleLogin = () => {}
const isLoading = false

// ✅ Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// ✅ Archivos de componentes: PascalCase
LoginScreen.js

// ✅ Otros archivos: camelCase
userSlice.js
```

---

### Performance

#### 1. Usar FlatList en lugar de ScrollView para listas largas

```javascript
// ❌ Malo (renderiza todos los items)
<ScrollView>
  {items.map(item => <ItemComponent key={item.id} item={item} />)}
</ScrollView>

// ✅ Bueno (renderiza solo items visibles)
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
/>
```

#### 2. Usar React.memo para componentes pesados

```javascript
const HeavyComponent = React.memo(({ data }) => {
  // Componente solo re-renderiza si `data` cambia
  return <View>{/* ... */}</View>
})
```

#### 3. Evitar funciones inline en renderizado

```javascript
// ❌ Malo (crea nueva función en cada render)
<Button onPress={() => console.log('Click')} />

// ✅ Bueno
const handlePress = useCallback(() => {
  console.log('Click')
}, [])

<Button onPress={handlePress} />
```

---

### Manejo de errores

```javascript
// ✅ Siempre usar try/catch en async
const loadData = async () => {
  try {
    const data = await fetchAPI()
    setData(data)
  } catch (error) {
    console.error('Error loading data:', error)
    showErrorToast(error.message)
  }
}

// ✅ Mostrar estados de error en UI
{error && <Text style={styles.error}>{error}</Text>}
```

---

### Accesibilidad

```javascript
// ✅ Agregar labels para lectores de pantalla
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Botón de cerrar sesión"
  accessibilityHint="Toca dos veces para cerrar sesión"
>
  <Text>Logout</Text>
</TouchableOpacity>
```

---

### TypeScript (Opcional pero recomendado)

```typescript
// Definir tipos para props
interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary' }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  )
}
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [React Native](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Redux Toolkit](https://redux-toolkit.js.org)

### Comunidad

- [React Native Community](https://github.com/react-native-community)
- [Awesome React Native](https://github.com/jondot/awesome-react-native)

---

## 🎯 Resumen

### Lo que aprendiste

1. **Estructura del proyecto**: Carpetas Android, src/, configuración
2. **Configuración**: package.json, babel, metro, gradle
3. **Código nativo**: MainActivity, MainApplication, AndroidManifest
4. **React Native**: Componentes, navegación, estado, estilos
5. **Arquitectura**: Redux, servicios API, hooks, i18n
6. **Build**: Desarrollo y producción

### Próximos pasos

1. Experimenta modificando componentes existentes
2. Crea nuevas pantallas siguiendo la estructura
3. Practica navegación entre pantallas
4. Implementa llamadas API con Redux
5. Personaliza el tema y estilos

---

**¡Felicidades!** Ahora tienes una comprensión completa de la arquitectura de React Native con Nueva Arquitectura para Android.
