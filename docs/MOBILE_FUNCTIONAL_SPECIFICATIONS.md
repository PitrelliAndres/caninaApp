# ParkDog Mobile - Especificaciones Funcionales Completas

## Índice

1. [Introducción](#1-introducción)
2. [Módulo de Autenticación](#2-módulo-de-autenticación)
3. [Módulo de Onboarding](#3-módulo-de-onboarding)
4. [Módulo de Parques](#4-módulo-de-parques)
5. [Módulo de Matches](#5-módulo-de-matches)
6. [Módulo de Mensajería](#6-módulo-de-mensajería)
7. [Módulo de Perfil](#7-módulo-de-perfil)
8. [Módulo de Visitas](#8-módulo-de-visitas)
9. [Módulo de Administración](#9-módulo-de-administración)
10. [Flujos de Usuario Completos](#10-flujos-de-usuario-completos)
11. [Validaciones Globales](#11-validaciones-globales)
12. [Manejo de Errores](#12-manejo-de-errores)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento describe las especificaciones funcionales completas de la aplicación móvil ParkDog. Está diseñado para:

- **Desarrolladores**: Entender los requisitos exactos de cada funcionalidad
- **Diseñadores**: Conocer los flujos de usuario y comportamientos esperados
- **Testers**: Crear casos de prueba basados en especificaciones detalladas
- **Product Managers**: Documentar y validar las características del producto

### 1.2 Alcance

El documento cubre todas las pantallas y funcionalidades de la aplicación móvil Android, incluyendo:

- Campos de entrada y validaciones
- Lógica de negocio y reglas
- Integración con APIs backend
- Manejo de estados y Redux
- Navegación entre pantallas
- Mensajes de error y feedback al usuario
- Permisos y seguridad

### 1.3 Convenciones

- **Campo requerido**: Se indica con asterisco (*)
- **Validación en tiempo real**: Se ejecuta mientras el usuario escribe
- **Validación on submit**: Se ejecuta al enviar el formulario
- **API**: Endpoints del backend que se consumen

---

## 2. Módulo de Autenticación

### 2.1 LoginScreen (Pantalla de Inicio de Sesión)

**Archivo**: `mobile/src/screens/auth/LoginScreen.js`

#### 2.1.1 Propósito

Permitir a los usuarios autenticarse en la aplicación usando su cuenta de Google.

#### 2.1.2 Componentes Visuales

- **Logo de ParkDog**: Ícono de pata (PawIcon) en círculo con elevación
- **Título**: "Bienvenido a ParkDog" (i18n: `auth.loginTitle`)
- **Subtítulo**: Descripción breve de la app (i18n: `auth.loginSubtitle`)
- **Card de Características**: Lista de beneficios con checkmarks
  - Registrar visitas a parques
  - Conocer otros dueños
  - Match según intereses
  - Chat y coordinación
- **Botón de Google Sign-In**: Botón principal con ícono de Google
- **Selector de idioma**: Componente en esquina superior derecha
- **Términos y condiciones**: Texto pequeño en la parte inferior

#### 2.1.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Descripción |
|-------|------|-----------|------------|-------------|
| N/A | N/A | N/A | N/A | No hay campos de entrada manual |

#### 2.1.4 Flujo de Usuario

1. **Usuario abre la app por primera vez**
   - Se muestra LoginScreen
   - Sistema verifica si hay token de sesión válido
   - Si hay token válido, navega directamente a Main o Onboarding

2. **Usuario presiona "Iniciar sesión con Google"**
   - Sistema muestra loading en el botón
   - Sistema verifica Google Play Services
   - Se abre el selector de cuenta de Google

3. **Usuario selecciona cuenta de Google**
   - Sistema obtiene userInfo del SDK de Google
   - Sistema extrae idToken (maneja v15 y v16+ del SDK)
   - Sistema valida que el token existe

4. **Sistema envía token al backend**
   - Dispatch de `loginWithGoogle(googleToken)` acción Redux
   - Backend valida el token con Google
   - Backend retorna datos del usuario y tokens de sesión

5. **Sistema maneja respuesta**
   - **Si `user.onboarded === true`**: Navega a `Main`
   - **Si `user.onboarded === false`**: Navega a `Onboarding`

#### 2.1.5 Estados de la Pantalla

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Normal** | Vista inicial | Botón habilitado, sin loading |
| **Loading** | Durante autenticación | Botón con spinner, texto "Iniciando sesión...", deshabilitado |
| **Error** | Fallo en autenticación | Toast con mensaje de error, botón habilitado nuevamente |
| **Cancelado** | Usuario cancela Google Sign-In | Toast informativo, botón habilitado |

#### 2.1.6 Validaciones de Negocio

- **Token de Google debe existir**: `userInfo?.data?.idToken || userInfo?.idToken`
- **Google Play Services disponibles**: `await GoogleSignin.hasPlayServices()`
- **Usuario debe tener email verificado**: Validado por backend

#### 2.1.7 Integración con API

**Endpoint**: `POST /api/v1/auth/google`

**Request Body**:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Response Success (200)**:
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "Juan Pérez",
    "onboarded": false,
    "avatar_url": "https://..."
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

**Response Error (401)**:
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token de Google inválido"
  }
}
```

#### 2.1.8 Redux State Management

**Slice**: `userSlice`

**Actions**:
- `loginWithGoogle(googleToken)`: Thunk async que autentica al usuario

**State Changes**:
```javascript
// Estado inicial
{
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

// Durante login
{
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

// Después de login exitoso
{
  user: { id, email, name, onboarded, ... },
  isAuthenticated: true,
  loading: false,
  error: null
}
```

#### 2.1.9 Manejo de Errores

| Error Code | Mensaje al Usuario | Acción |
|------------|-------------------|--------|
| `SIGN_IN_CANCELLED` | "Inicio de sesión cancelado" | Toast info, permitir reintentar |
| `PLAY_SERVICES_NOT_AVAILABLE` | "Google Play Services no disponible" | Toast error, sugerir actualizar |
| `NO_TOKEN` | "No se pudo obtener el token de Google" | Toast error, reintentar |
| `INVALID_TOKEN` | "Token de Google inválido" | Toast error, reintentar |
| `NETWORK_ERROR` | "Error de conexión, verifica tu internet" | Toast error, reintentar |
| Generic | "Error al iniciar sesión" | Toast error con detalles |

#### 2.1.10 Navegación

**Entradas**:
- Desde splash screen (primera carga)
- Desde logout

**Salidas**:
- A `Onboarding` si `user.onboarded === false`
- A `Main` si `user.onboarded === true`

#### 2.1.11 Configuración de Google Sign-In

**Archivo de configuración**: `.env`

```env
GOOGLE_WEB_CLIENT_ID=301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=301209986798-kvbp0f2o23d8kiabe4ejgdhi0n0q883j.apps.googleusercontent.com
```

**Configuración del SDK**:
```javascript
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
  forceCodeForRefreshToken: true,
})
```

---

## 3. Módulo de Onboarding

### 3.1 ONB_NAME - Step1Screen (¿Cuál es tu nombre?)

**Archivo**: `mobile/src/screens/onboarding/Step1Screen.js`

#### 3.1.1 Propósito

Capturar el nombre del usuario que se mostrará en su perfil (no editable después).

#### 3.1.2 Componentes Visuales

- **Header**: Indicador de progreso (1/3)
- **Título**: "Cuéntanos sobre ti"
- **Avatar circular**: Foto de perfil (placeholder si no hay foto)
- **Botón de cámara**: Para cambiar/agregar foto
- **Campo de nickname**: Input de texto
- **Indicador de disponibilidad**: Checkmark verde o X roja
- **Campo de edad**: Input numérico con selector
- **Botón "Siguiente"**: Navega a Step2

#### 3.1.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| **nickname*** | String | Sí | - Min 3 caracteres<br>- Max 20 caracteres<br>- Solo alfanuméricos y guion bajo<br>- Único en la BD | "Nickname debe tener al menos 3 caracteres"<br>"Solo letras, números y guion bajo"<br>"Este nickname ya está en uso" |
| **age*** | Number | Sí | - Min: 10 años<br>- Max: 99 años<br>- Entero positivo | "Debes tener al menos 10 años"<br>"Edad no válida" |
| **avatar** | Image | No | - Formato: JPG, PNG, WEBP<br>- Tamaño máx: 5MB<br>- Dimensiones min: 200x200px | "Imagen muy grande (máx 5MB)"<br>"Formato no soportado" |

#### 3.1.4 Validaciones en Tiempo Real

**Nickname**:
```javascript
// Debounce de 500ms
const checkNicknameAvailability = debounce(async (nickname) => {
  if (nickname.length >= 3) {
    const response = await userAPI.checkNickname(nickname)
    setNicknameAvailable(response.available)
  }
}, 500)
```

**Comportamiento visual**:
- Mientras escribe: Sin indicador
- Después de 500ms sin escribir:
  - Si disponible: Checkmark verde + mensaje "Disponible"
  - Si no disponible: X roja + mensaje "No disponible"
  - Si error: Mensaje de error

#### 3.1.5 Flujo de Usuario

1. **Usuario llega a Step1**
   - Campos vacíos (excepto si hay datos previos guardados)
   - Botón "Siguiente" deshabilitado

2. **Usuario sube foto de perfil (opcional)**
   - Presiona avatar o botón de cámara
   - Se abre modal con opciones:
     - Tomar foto con cámara
     - Seleccionar de galería
     - Cancelar
   - Usuario selecciona imagen
   - Sistema valida tamaño y formato
   - Se muestra preview en el avatar

3. **Usuario ingresa nickname**
   - Escribe en el campo
   - Sistema valida formato en tiempo real
   - Después de 500ms, verifica disponibilidad con API
   - Muestra indicador visual de disponibilidad

4. **Usuario ingresa edad**
   - Selecciona edad con picker o input
   - Sistema valida rango permitido

5. **Usuario presiona "Siguiente"**
   - Sistema valida todos los campos
   - Si hay errores, muestra mensajes debajo de cada campo
   - Si todo es válido:
     - Guarda datos localmente (AsyncStorage)
     - Navega a Step2Screen

#### 3.1.6 Estados de la Pantalla

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Normal** | Campos vacíos | Botón "Siguiente" deshabilitado |
| **Validating** | Verificando nickname | Spinner junto al campo nickname |
| **Valid** | Todos los campos correctos | Botón "Siguiente" habilitado |
| **Invalid** | Al menos un error | Mensajes de error visibles, botón deshabilitado |
| **Uploading Image** | Subiendo foto | Loading en el avatar |

#### 3.1.7 Integración con API

**Endpoint 1**: `GET /api/v1/users/check-nickname?nickname={value}`

**Response**:
```json
{
  "available": true
}
```

**Endpoint 2**: `POST /api/v1/users/upload-avatar` (si el usuario sube foto)

**Request**: Multipart form-data
```
avatar: <binary file>
```

**Response**:
```json
{
  "avatar_url": "https://storage.parkdog.com/avatars/uuid.jpg"
}
```

#### 3.1.8 Almacenamiento Local

```javascript
await AsyncStorage.setItem('onboarding_step1', JSON.stringify({
  nickname: 'juanito',
  age: 28,
  avatar_url: 'https://...'
}))
```

#### 3.1.9 Navegación

**Entradas**:
- Desde LoginScreen (si `user.onboarded === false`)
- Desde Step2Screen (botón "Anterior")

**Salidas**:
- A Step2Screen (botón "Siguiente")

---

### 3.2 Step2Screen (Perfil del Perro)

**Archivo**: `mobile/src/screens/onboarding/Step2Screen.js`

#### 3.2.1 Propósito

Recopilar información del perro del usuario: nombre, edad, raza y foto.

#### 3.2.2 Componentes Visuales

- **Header**: Indicador de progreso (2/3)
- **Título**: "Cuéntanos sobre tu perro"
- **Avatar circular del perro**: Foto (placeholder si no hay)
- **Botón de cámara**: Para agregar foto
- **Campo de nombre**: Input de texto
- **Campo de edad**: Input numérico
- **Dropdown de raza**: Selector con lista de razas
- **Botones**: "Anterior" y "Siguiente"

#### 3.2.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| **name*** | String | Sí | - Min 2 caracteres<br>- Max 50 caracteres<br>- Letras y espacios | "Nombre muy corto"<br>"Solo letras y espacios permitidos" |
| **age*** | Number | Sí | - Min: 0 años<br>- Max: 25 años<br>- Entero positivo | "Edad no válida"<br>"Edad debe ser entre 0 y 25 años" |
| **breed*** | String | Sí | - Debe estar en lista predefinida | "Selecciona una raza" |
| **photo** | Image | No | - Formato: JPG, PNG, WEBP<br>- Tamaño máx: 5MB | "Imagen muy grande" |

#### 3.2.4 Lista de Razas Disponibles

```javascript
const breeds = [
  'Golden Retriever',
  'Labrador',
  'Pastor Alemán',
  'Bulldog Francés',
  'Beagle',
  'Poodle',
  'Chihuahua',
  'Yorkshire Terrier',
  'Boxer',
  'Dachshund',
  'Pug',
  'Rottweiler',
  'Border Collie',
  'Husky Siberiano',
  'Cocker Spaniel',
  'Schnauzer',
  'Doberman',
  'Shih Tzu',
  'Mestizo',
  'Otro'
]
```

#### 3.2.5 Flujo de Usuario

1. **Usuario llega a Step2**
   - Recupera datos de Step1 del AsyncStorage
   - Campos vacíos
   - Botón "Siguiente" deshabilitado

2. **Usuario sube foto del perro (opcional)**
   - Similar a Step1
   - Opciones: Cámara o Galería

3. **Usuario completa formulario**
   - Ingresa nombre del perro
   - Selecciona edad
   - Selecciona raza del dropdown

4. **Usuario presiona "Siguiente"**
   - Sistema valida campos
   - Guarda datos localmente
   - Navega a Step3Screen

5. **Usuario presiona "Anterior"**
   - Guarda datos actuales
   - Navega a Step1Screen

#### 3.2.6 Almacenamiento Local

```javascript
await AsyncStorage.setItem('onboarding_step2', JSON.stringify({
  dog_name: 'Max',
  dog_age: 3,
  dog_breed: 'Golden Retriever',
  dog_photo_url: 'https://...'
}))
```

#### 3.2.7 Navegación

**Entradas**:
- Desde Step1Screen (botón "Siguiente")
- Desde Step3Screen (botón "Anterior")

**Salidas**:
- A Step1Screen (botón "Anterior")
- A Step3Screen (botón "Siguiente")

---

### 3.3 Step3Screen (Privacidad e Intereses)

**Archivo**: `mobile/src/screens/onboarding/Step3Screen.js`

#### 3.3.1 Propósito

Configurar preferencias de privacidad y seleccionar intereses del usuario.

#### 3.3.2 Componentes Visuales

- **Header**: Indicador de progreso (3/3)
- **Título**: "Preferencias y privacidad"
- **Sección de Privacidad**: 3 switches
- **Sección de Intereses**: Grid de intereses con checkboxes
- **Botones**: "Anterior" y "Finalizar"

#### 3.3.3 Campos y Validaciones

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| **public_profile** | Boolean | No | `true` | Perfil visible para todos |
| **allow_matching** | Boolean | No | `true` | Permitir sugerencias de match |
| **allow_proximity** | Boolean | No | `true` | Mostrar distancia a otros usuarios |
| **interests** | Array[String] | No | `[]` | Lista de intereses seleccionados (max 10) |

#### 3.3.4 Lista de Intereses

```javascript
const availableInterests = [
  'Paseos largos',
  'Entrenamiento',
  'Socialización',
  'Juegos al aire libre',
  'Agility',
  'Natación',
  'Caminatas por montaña',
  'Parques urbanos',
  'Playas dog-friendly',
  'Eventos caninos'
]
```

#### 3.3.5 Flujo de Usuario

1. **Usuario llega a Step3**
   - Switches de privacidad en estado default
   - Ningún interés seleccionado

2. **Usuario configura privacidad**
   - Activa/desactiva switches según preferencia
   - No hay validación requerida

3. **Usuario selecciona intereses**
   - Selecciona hasta 10 intereses
   - Si intenta seleccionar más de 10, se deshabilitan los demás

4. **Usuario presiona "Finalizar"**
   - Sistema combina datos de Step1, Step2 y Step3
   - Envía payload completo al backend
   - Actualiza `user.onboarded = true`
   - Limpia AsyncStorage de datos temporales
   - Navega a Main screen

#### 3.3.6 Integración con API

**Endpoint**: `POST /api/v1/users/onboarding`

**Request Body**:
```json
{
  "user": {
    "nickname": "juanito",
    "age": 28,
    "avatar_url": "https://..."
  },
  "dog": {
    "name": "Max",
    "age": 3,
    "breed": "Golden Retriever",
    "photo_url": "https://..."
  },
  "privacy": {
    "public_profile": true,
    "allow_matching": true,
    "allow_proximity": true
  },
  "interests": [
    "Paseos largos",
    "Socialización",
    "Parques urbanos"
  ]
}
```

**Response Success (200)**:
```json
{
  "user": {
    "id": 123,
    "onboarded": true,
    ...
  },
  "message": "Perfil completado exitosamente"
}
```

#### 3.3.7 Redux State Management

**Action**: `completeOnboarding(onboardingData)`

**State Changes**:
```javascript
// Antes
{
  user: {
    id: 123,
    onboarded: false,
    ...
  }
}

// Después
{
  user: {
    id: 123,
    onboarded: true,
    nickname: 'juanito',
    dog: { ... },
    privacy: { ... },
    interests: [ ... ]
  }
}
```

#### 3.3.8 Navegación

**Entradas**:
- Desde Step2Screen (botón "Siguiente")

**Salidas**:
- A Step2Screen (botón "Anterior")
- A Main (botón "Finalizar", después de completar onboarding)

---

## 4. Módulo de Parques

### 4.1 ParksScreen (Lista de Parques)

**Archivo**: `mobile/src/screens/parks/ParksScreen.js`

#### 4.1.1 Propósito

Mostrar una lista de parques cercanos, permitir búsqueda, filtrado y visualización en mapa.

#### 4.1.2 Componentes Visuales

- **Barra de búsqueda**: Input con ícono de lupa
- **Botón de filtros**: Abre modal de filtros
- **Toggle Map/List**: Alterna entre vista de mapa y lista
- **Mapa** (si está en modo mapa): react-native-maps con markers
- **Lista de tarjetas** (si está en modo lista): FlatList con ParkCard
- **FAB**: Botón flotante para registrar visita rápida

#### 4.1.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Descripción |
|-------|------|-----------|------------|-------------|
| **searchQuery** | String | No | - Max 100 caracteres | Busca por nombre o barrio |
| **location** | Coords | Sí | - Lat/Long válidas | Ubicación actual del usuario |
| **filters** | Object | No | - Ver filtros disponibles | Filtros aplicados |

#### 4.1.4 Filtros Disponibles

```javascript
const filters = {
  distance: {
    label: 'Distancia máxima',
    type: 'slider',
    min: 1,
    max: 50,
    unit: 'km',
    default: 10
  },
  hasArea: {
    label: 'Con área para perros',
    type: 'boolean',
    default: false
  },
  isFenced: {
    label: 'Cercado',
    type: 'boolean',
    default: false
  },
  hasWater: {
    label: 'Con agua disponible',
    type: 'boolean',
    default: false
  },
  sortBy: {
    label: 'Ordenar por',
    type: 'select',
    options: ['Distancia', 'Nombre', 'Popularidad'],
    default: 'Distancia'
  }
}
```

#### 4.1.5 Flujo de Usuario

1. **Usuario abre ParksScreen**
   - Sistema solicita permisos de ubicación
   - Si concedido: Obtiene ubicación actual
   - Si denegado: Muestra mensaje y usa ubicación por defecto

2. **Sistema carga parques cercanos**
   - Hace request a API con ubicación y filtros
   - Muestra loading skeleton
   - Renderiza lista de parques

3. **Usuario busca parque**
   - Escribe en barra de búsqueda
   - Debounce de 300ms
   - Filtra parques localmente o hace nueva request

4. **Usuario aplica filtros**
   - Presiona botón de filtros
   - Se abre modal ParkFilterModal
   - Selecciona filtros deseados
   - Presiona "Aplicar"
   - Sistema actualiza lista con filtros

5. **Usuario cambia vista Map/List**
   - Presiona toggle
   - Vista se actualiza sin perder estado de búsqueda/filtros

6. **Usuario selecciona un parque**
   - Presiona tarjeta o marker
   - Navega a ParkDetailScreen

#### 4.1.6 Permisos Requeridos

**Android**: `android.permission.ACCESS_FINE_LOCATION`

**Manejo de permisos**:
```javascript
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  }
  return true
}
```

#### 4.1.7 Integración con API

**Endpoint**: `GET /api/v1/parks`

**Query Parameters**:
```
lat=34.6037
lng=58.3816
radius=10000
hasArea=true
isFenced=false
hasWater=false
sortBy=distance
limit=20
offset=0
```

**Response**:
```json
{
  "parks": [
    {
      "id": 1,
      "name": "Parque Centenario",
      "neighborhood": "Caballito",
      "latitude": -34.6037,
      "longitude": -58.4316,
      "distance": 2.3,
      "hasArea": true,
      "isFenced": true,
      "hasWater": true,
      "description": "Parque amplio con área especial...",
      "active_visits": 5
    },
    ...
  ],
  "total": 45,
  "hasMore": true
}
```

#### 4.1.8 Estados de la Pantalla

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Loading** | Carga inicial | Skeleton placeholders |
| **Normal** | Con datos | Muestra lista/mapa de parques |
| **Empty** | Sin parques cercanos | Mensaje "No hay parques cerca" + sugerir ampliar radio |
| **Error Location** | Permisos denegados | Mensaje explicativo + botón para abrir configuración |
| **Error Network** | Sin conexión | Mensaje de error + botón para reintentar |
| **Refreshing** | Pull to refresh | Indicador de refresh |

#### 4.1.9 Componente ParkCard

**Información mostrada**:
- Nombre del parque
- Barrio/zona
- Distancia del usuario
- Características: Íconos de hasArea, isFenced, hasWater
- Número de visitas activas
- Botón "Ver detalles"

---

### 4.2 ParkDetailScreen (Detalle de Parque)

**Archivo**: `mobile/src/screens/parks/ParkDetailScreen.js`

#### 4.2.1 Propósito

Mostrar información detallada de un parque específico y permitir registrar visita.

#### 4.2.2 Componentes Visuales

- **Mapa**: Muestra ubicación exacta del parque
- **Card de información**: Nombre, barrio, descripción
- **Chips de características**: hasArea, isFenced, hasWater
- **Botón "Registrar visita"**: CTA principal

#### 4.2.3 Flujo de Usuario

1. **Usuario llega desde ParksScreen**
   - Recibe objeto `park` en route.params
   - Renderiza mapa centrado en el parque

2. **Usuario lee información**
   - Ve nombre, descripción, características

3. **Usuario presiona "Registrar visita"**
   - Navega a RegisterVisitScreen con park como parámetro

#### 4.2.4 Navegación

**Entradas**:
- Desde ParksScreen (selección de parque)
- Desde búsqueda global

**Salidas**:
- A RegisterVisitScreen (botón "Registrar visita")
- Back a ParksScreen

---

### 4.3 RegisterVisitScreen (Registrar Visita)

**Archivo**: `mobile/src/screens/parks/RegisterVisitScreen.js`

#### 4.3.1 Propósito

Permitir al usuario registrar una visita planificada a un parque específico.

#### 4.3.2 Componentes Visuales

- **Card del parque**: Nombre y barrio (read-only)
- **Date picker**: Selección de fecha
- **Time picker**: Selección de hora
- **Notes input**: Textarea para notas adicionales
- **Botones**: "Registrar" y "Cancelar"

#### 4.3.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| **date*** | Date | Sí | - Debe ser hoy o fecha futura<br>- Max 30 días adelante | "Selecciona una fecha válida"<br>"No puedes registrar visitas tan lejanas" |
| **time*** | Time | Sí | - Formato HH:mm<br>- Si es hoy, debe ser hora futura | "Selecciona una hora válida"<br>"La hora debe ser futura" |
| **notes** | String | No | - Max 500 caracteres | "Notas muy largas (máx 500 caracteres)" |

#### 4.3.4 Flujo de Usuario

1. **Usuario llega desde ParkDetailScreen**
   - Recibe objeto `park` en params
   - Fecha por defecto: Hoy
   - Hora por defecto: Ahora + 1 hora

2. **Usuario selecciona fecha**
   - Presiona botón de fecha
   - Se abre DateTimePicker nativo
   - Selecciona fecha
   - Picker se cierra

3. **Usuario selecciona hora**
   - Similar a fecha
   - DateTimePicker en modo "time"

4. **Usuario agrega notas (opcional)**
   - Escribe en textarea

5. **Usuario presiona "Registrar"**
   - Sistema valida campos
   - Hace POST a API
   - Si exitoso:
     - Muestra toast de éxito
     - Navega back a ParksScreen o MyVisitsScreen
   - Si error:
     - Muestra toast de error
     - Permite reintentar

#### 4.3.5 Integración con API

**Endpoint**: `POST /api/v1/visits`

**Request Body**:
```json
{
  "park_id": 1,
  "date": "2024-01-20",
  "time": "16:00",
  "notes": "Llevaré juguetes para compartir"
}
```

**Response Success (201)**:
```json
{
  "visit": {
    "id": 456,
    "park_id": 1,
    "park_name": "Parque Centenario",
    "date": "2024-01-20",
    "time": "16:00",
    "notes": "...",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 4.3.6 Navegación

**Entradas**:
- Desde ParkDetailScreen

**Salidas**:
- Back a ParkDetailScreen (botón "Cancelar")
- A MyVisitsScreen (después de registrar exitosamente)

---

## 5. Módulo de Matches

### 5.1 DiscoverScreen (Descubrir Usuarios)

**Archivo**: `mobile/src/screens/matches/DiscoverScreen.js`

#### 5.1.1 Propósito

Mostrar sugerencias de otros usuarios para hacer match, estilo Tinder con swipe gestures.

#### 5.1.2 Componentes Visuales

- **Stack de tarjetas**: Máximo 3 tarjetas visibles
- **Tarjeta de usuario**: Foto, nombre, edad, info del perro
- **Botones de acción**: Like (corazón) y Pass (X)
- **Indicadores de compatibilidad**: Percentage match
- **Empty state**: Cuando no hay más sugerencias

#### 5.1.3 Gestos y Acciones

| Gesto | Acción | Efecto |
|-------|--------|--------|
| **Swipe Right** | Like | Envía like al usuario, si hay match mutuo → navega a chat |
| **Swipe Left** | Pass | Descarta al usuario, no se muestra nuevamente |
| **Tap botón corazón** | Like | Igual que swipe right |
| **Tap botón X** | Pass | Igual que swipe left |
| **Tap en tarjeta** | Ver perfil | Navega a perfil completo del usuario (modal) |

#### 5.1.4 Lógica de Matching

**Algoritmo de sugerencias** (backend):
1. Usuarios dentro del radio configurado
2. Con visitas a parques similares
3. Con intereses en común
4. Que no han sido descartados previamente
5. Que no están bloqueados

**Score de compatibilidad**:
```javascript
compatibilityScore = (
  (commonInterests / totalInterests) * 40 +
  (proximityScore) * 30 +
  (commonParks / totalParks) * 30
)
```

#### 5.1.5 Flujo de Usuario

1. **Usuario abre DiscoverScreen**
   - Sistema carga sugerencias de matches
   - Muestra stack de tarjetas

2. **Usuario hace swipe o presiona botón**
   - Animación de la tarjeta (sale hacia derecha/izquierda)
   - Sistema envía acción al backend
   - Siguiente tarjeta se muestra

3. **Si hay match mutuo**
   - Se muestra modal "¡Es un Match!"
   - Foto de ambos usuarios
   - Botón "Enviar mensaje"
   - Botón "Seguir descubriendo"

4. **Si se acaban las sugerencias**
   - Muestra empty state
   - Mensaje: "No hay más sugerencias por ahora"
   - Botón: "Visita más parques para conocer gente nueva"

#### 5.1.6 Integración con API

**Endpoint 1**: `GET /api/v1/matches/suggestions`

**Response**:
```json
{
  "suggestions": [
    {
      "user_id": 101,
      "name": "María",
      "age": 28,
      "avatar_url": "https://...",
      "dog": {
        "name": "Luna",
        "breed": "Golden Retriever",
        "photo_url": "https://..."
      },
      "compatibility_score": 85,
      "common_interests": ["Paseos largos", "Socialización"],
      "distance_km": 2.3
    },
    ...
  ]
}
```

**Endpoint 2**: `POST /api/v1/matches/{userId}/like`

**Response si no hay match**:
```json
{
  "liked": true,
  "match": false
}
```

**Response si hay match**:
```json
{
  "liked": true,
  "match": true,
  "conversation_id": 789,
  "user": { ... }
}
```

**Endpoint 3**: `POST /api/v1/matches/{userId}/pass`

**Response**:
```json
{
  "passed": true
}
```

#### 5.1.7 Estados de la Pantalla

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Loading** | Cargando sugerencias | Skeleton loader |
| **Normal** | Con sugerencias | Stack de tarjetas interactivo |
| **Empty** | Sin más sugerencias | Mensaje motivacional + sugerencia |
| **Match Modal** | Match mutuo detectado | Modal celebratorio |
| **Error** | Fallo al cargar | Mensaje de error + botón reintentar |

---

### 5.2 MyMatchesScreen (Mis Matches)

**Archivo**: `mobile/src/screens/matches/MyMatchesScreen.js`

#### 5.2.1 Propósito

Mostrar la lista de matches mutuos del usuario con opciones para ver perfil o iniciar chat.

#### 5.2.2 Componentes Visuales

- **FlatList de tarjetas**: Una tarjeta por match
- **Tarjeta de match**: Avatar, nombre, info del perro, último mensaje
- **Botones**: "Ver perfil" y "Chat"
- **Empty state**: Si no hay matches

#### 5.2.3 Flujo de Usuario

1. **Usuario abre MyMatchesScreen**
   - Sistema carga matches desde API
   - Ordena por último mensaje

2. **Usuario ve lista de matches**
   - Puede hacer pull-to-refresh

3. **Usuario presiona "Ver perfil"**
   - Navega a UserProfileScreen (modal)

4. **Usuario presiona "Chat"**
   - Navega a DMChatScreen con ese usuario

#### 5.2.4 Integración con API

**Endpoint**: `GET /api/v1/matches?mutual=true`

**Response**:
```json
{
  "matches": [
    {
      "id": 1,
      "user": {
        "id": 101,
        "name": "María",
        "nickname": "María",
        "age": 28,
        "avatar_url": "https://...",
        "lastMessage": "¡Hola! Luna se divirtió mucho en el parque",
        "lastMessageTime": "5 min"
      },
      "dog": {
        "name": "Luna",
        "breed": "Golden Retriever",
        "age": 3
      },
      "park_name": "Parque Centenario",
      "matchedAt": "2024-01-15",
      "status": "active"
    },
    ...
  ]
}
```

#### 5.2.5 Navegación

**Entradas**:
- Desde tab navigator
- Desde DiscoverScreen (después de match)
- Desde ProfileScreen

**Salidas**:
- A UserProfileScreen (botón "Ver perfil")
- A DMChatScreen (botón "Chat")

---

## 6. Módulo de Mensajería

### 6.1 ChatsListScreen (Lista de Conversaciones)

**Archivo**: `mobile/src/screens/chats/ChatsListScreen.js`

#### 6.1.1 Propósito

Mostrar todas las conversaciones activas del usuario con indicadores de mensajes no leídos.

#### 6.1.2 Componentes Visuales

- **Header**: Título "Mensajes"
- **FlatList**: Lista de conversaciones
- **Item de conversación**: Avatar, nombre, último mensaje, timestamp, badge de no leídos
- **Indicador online**: Punto verde si el usuario está online
- **Empty state**: Si no hay conversaciones

#### 6.1.3 Campos Mostrados por Conversación

| Campo | Descripción | Fuente |
|-------|-------------|--------|
| **Avatar** | Foto del otro usuario | `user.avatar` |
| **Nombre** | Nickname del otro usuario | `user.nickname` |
| **Último mensaje** | Texto del último mensaje (truncado) | `last_message` |
| **Timestamp** | Tiempo relativo (ej: "5 min", "2 h") | `last_message_time` con date-fns |
| **Badge no leídos** | Cantidad de mensajes sin leer | `unread` |
| **Online status** | Punto verde si está online | `user.is_online` |

#### 6.1.4 Flujo de Usuario

1. **Usuario abre ChatsListScreen**
   - Sistema carga conversaciones desde API
   - Muestra lista ordenada por último mensaje

2. **Sistema actualiza en tiempo real**
   - WebSocket escucha nuevos mensajes
   - Actualiza último mensaje y contador de no leídos
   - Reordena lista si es necesario

3. **Usuario presiona una conversación**
   - Navega a ChatScreen con ese chat_id

4. **Usuario hace pull-to-refresh**
   - Recarga conversaciones desde API

#### 6.1.5 Integración con API

**Endpoint**: `GET /api/v1/messages/conversations`

**Response**:
```json
{
  "conversations": [
    {
      "chat_id": 789,
      "user": {
        "id": 101,
        "nickname": "María",
        "avatar": "https://...",
        "is_online": true
      },
      "last_message": "¡Hola! Luna se divirtió mucho...",
      "last_message_time": "2024-01-15T14:30:00Z",
      "unread": 2
    },
    ...
  ]
}
```

#### 6.1.6 WebSocket Events

**Escucha**:
- `message:new`: Actualiza último mensaje
- `user:online`: Actualiza status online
- `user:offline`: Actualiza status offline
- `message:read`: Limpia contador de no leídos

#### 6.1.7 Navegación

**Entradas**:
- Desde tab navigator
- Desde notificación de mensaje

**Salidas**:
- A ChatScreen (selección de conversación)

---

### 6.2 ChatScreen (Conversación de Grupo)

**Archivo**: `mobile/src/screens/chats/ChatScreen.js`

#### 6.2.2 Propósito

Chat grupal asociado a una visita a un parque o evento específico.

#### 6.2.3 Componentes Visuales

- **Header**: Avatar y nombre del otro usuario, status online
- **FlatList de mensajes**: Burbujas de chat
- **Input de mensaje**: TextInput multiline
- **Botón enviar**: IconButton
- **Indicador de typing**: "Usuario está escribiendo..."
- **Loading**: Al cargar historial

#### 6.2.4 Estructura de Mensaje

```javascript
const message = {
  id: 123,
  sender_id: 101,
  text: "Hola, ¿vamos al parque mañana?",
  created_at: "2024-01-15T14:30:00Z",
  time: "14:30",
  is_read: false
}
```

#### 6.2.5 Flujo de Usuario

1. **Usuario abre ChatScreen**
   - Recibe chat_id y user en params
   - Carga historial de mensajes
   - Conecta WebSocket si no está conectado
   - Marca mensajes como leídos
   - Scroll automático al último mensaje

2. **Usuario lee mensajes**
   - Mensajes propios: Alineados a la derecha, fondo azul
   - Mensajes ajenos: Alineados a la izquierda, fondo gris
   - Indicadores de leído: Doble check azul (leído) o gris (entregado)

3. **Usuario escribe mensaje**
   - Escribe en input
   - Sistema emite evento "typing" por WebSocket
   - Timeout de 3 segundos para detener typing indicator

4. **Usuario envía mensaje**
   - Presiona botón enviar
   - Sistema valida que no esté vacío
   - Envía mensaje por API
   - Mensaje se agrega a la lista con estado "sending"
   - Cuando llega confirmación, se marca como "sent"
   - Cuando es leído, se marca como "read"

5. **Usuario recibe mensaje nuevo**
   - WebSocket emite evento "message:new"
   - Mensaje se agrega a la lista
   - Sistema envía confirmación de lectura
   - Scroll automático al final

#### 6.2.6 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| **message_text*** | String | Sí | - Min 1 carácter<br>- Max 1000 caracteres<br>- No solo espacios | "El mensaje está vacío"<br>"Mensaje muy largo" |

#### 6.2.7 Integración con API

**Endpoint 1**: `GET /api/v1/messages?chatId={id}&limit=50&after={cursor}`

**Response**:
```json
{
  "messages": [
    {
      "id": 123,
      "sender_id": 101,
      "text": "Hola",
      "created_at": "2024-01-15T14:30:00Z",
      "time": "14:30",
      "is_read": true
    },
    ...
  ],
  "hasMore": false
}
```

**Endpoint 2**: `POST /api/v1/messages`

**Request**:
```json
{
  "chat_id": 789,
  "text": "Hola, ¿cómo estás?"
}
```

**Response**:
```json
{
  "message": {
    "id": 124,
    "sender_id": 100,
    "text": "Hola, ¿cómo estás?",
    "created_at": "2024-01-15T14:35:00Z",
    "time": "14:35",
    "is_read": false
  }
}
```

**Endpoint 3**: `POST /api/v1/messages/read`

**Request**:
```json
{
  "chat_id": 789
}
```

#### 6.2.8 WebSocket Events

**Emite**:
- `typing`: Cuando el usuario está escribiendo
  ```json
  { "chat_id": 789, "user_id": 100 }
  ```

**Escucha**:
- `message:new`: Nuevo mensaje recibido
- `typing`: Otro usuario está escribiendo
- `message:read`: Mensajes marcados como leídos
- `user:online` / `user:offline`: Cambio de status

#### 6.2.9 Estados del Mensaje

| Estado | Ícono | Descripción |
|--------|-------|-------------|
| **Pending** | Reloj | Enviando al servidor |
| **Sent** | Check simple | Entregado al servidor |
| **Delivered** | Doble check gris | Entregado al destinatario |
| **Read** | Doble check azul | Leído por el destinatario |
| **Failed** | ⚠ | Error al enviar |

---

### 6.3 DMChatScreen (Mensajes Directos)

**Archivo**: `mobile/src/screens/chats/DMChatScreen.js`

#### 6.3.1 Propósito

Chat directo 1 a 1 entre usuarios que tienen match mutuo.

#### 6.3.2 Diferencias con ChatScreen

- **Validación de match**: Solo funciona si hay match mutuo
- **End-to-End Encryption**: Mensajes encriptados (según configuración)
- **Mejor integración con perfil**: Fácil acceso al perfil del otro usuario
- **Manejo de bloqueo**: Detecta si el usuario está bloqueado

#### 6.3.3 Validaciones de Acceso

**Al abrir el chat**:
1. Verificar que existe match mutuo
2. Verificar que ninguno ha bloqueado al otro
3. Obtener token de WebSocket (realtime_token)
4. Conectar a WebSocket
5. Unirse a la conversación

#### 6.3.4 Flujo de Usuario

Similar a ChatScreen, con estas diferencias:

**1. Validación inicial**
```javascript
// Si no hay match mutuo
if (error.code === 'NO_MATCH') {
  // Mostrar pantalla de error
  // "No puedes enviar mensajes a este usuario"
  // Botón para volver
}

// Si está bloqueado
if (error.code === 'BLOCKED') {
  // "Este usuario te ha bloqueado"
  // Botón para volver
}
```

**2. Conexión a WebSocket**
```javascript
// Obtener realtime_token del Keychain
const credentials = await Keychain.getGenericPassword({
  service: 'realtime_token'
})
const realtimeToken = credentials.password

// Conectar con el token
socketRef.current = await messageService.connectWebSocket()
```

**3. Unirse a conversación**
```javascript
const response = await messageService.joinConversation(conversationId)
// Recibe historial de mensajes
```

#### 6.3.5 Integración con API

**Endpoint 1**: Obtener token de WebSocket

`POST /api/v1/auth/ws-token`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "realtime_token": "eyJhbGc...",
  "expires_in": 900
}
```

**Endpoint 2**: Unirse a conversación

`POST /api/v1/dm/join`

**Request**:
```json
{
  "conversation_id": "uuid-v4"
}
```

**Response**:
```json
{
  "messages": [...],
  "participants": [...],
  "conversation_id": "uuid-v4"
}
```

**Endpoint 3**: Enviar mensaje DM

`POST /api/v1/dm/send`

**Request**:
```json
{
  "conversation_id": "uuid-v4",
  "text": "Hola"
}
```

#### 6.3.6 WebSocket Events (DM específicos)

**Emite**:
- `dm:typing`: Indicador de escritura
  ```json
  {
    "conversationId": "uuid-v4",
    "isTyping": true
  }
  ```

**Escucha**:
- `dm:new`: Nuevo mensaje directo
  ```json
  {
    "conversationId": "uuid-v4",
    "message": {
      "id": "msg-uuid",
      "sender_id": 101,
      "text": "Hola",
      "created_at": "2024-01-15T14:30:00Z"
    }
  }
  ```

- `dm:typing`: Otro usuario escribiendo
- `dm:read`: Mensaje leído
- `dm:error`: Error específico de DM (NO_MATCH, BLOCKED, etc.)

#### 6.3.7 Manejo de Errores Específicos

| Error Code | Mensaje | Acción |
|------------|---------|--------|
| `NO_MATCH` | "No tienes match con este usuario" | Mostrar pantalla de error, no permitir enviar |
| `BLOCKED` | "Este usuario te ha bloqueado" | Mostrar pantalla de error, no permitir enviar |
| `UNAUTHORIZED` | "Sesión expirada" | Redirigir a login |
| `RATE_LIMIT` | "Demasiados mensajes, espera un momento" | Deshabilitar input temporalmente |

#### 6.3.8 Estados de Conexión

| Estado | Mensaje | UI |
|--------|---------|-----|
| **connecting** | "Conectando..." | Chip amarillo en header |
| **connected** | - | Sin indicador (normal) |
| **reconnecting** | "Reconectando..." | Chip rojo en header |
| **disconnected** | "Sin conexión" | Chip gris, input deshabilitado |

---

## 7. Módulo de Perfil

### 7.1 ProfileScreen (Mi Perfil)

**Archivo**: `mobile/src/screens/profile/ProfileScreen.js`

#### 7.1.1 Propósito

Mostrar el perfil del usuario con estadísticas, configuraciones y opciones de cuenta.

#### 7.1.2 Componentes Visuales

- **Card de perfil**: Avatar, nombre, email, fecha de registro
- **Botón "Editar perfil"**: Navega a EditProfileScreen
- **Card de estadísticas**: Visitas, matches, conexiones
- **Card de configuración**: Switches de dark mode y notificaciones
- **Botón de privacidad**: Navega a PrivacySettingsScreen
- **Botones de acciones**: Mis visitas, Mis matches, Cerrar sesión

#### 7.1.3 Información Mostrada

**Sección de Perfil**:
- Avatar (80x80)
- Nombre completo
- Email
- Fecha de registro ("Miembro desde...")

**Estadísticas**:
- Número de visitas registradas
- Número de matches
- Número de conexiones activas

**Configuraciones**:
- Dark mode: Switch (on/off)
- Notificaciones: Switch (on/off)
- Privacidad: Enlace a PrivacySettingsScreen

#### 7.1.4 Flujo de Usuario

1. **Usuario abre ProfileScreen**
   - Sistema carga datos del usuario desde Redux
   - Carga estadísticas desde AsyncStorage o API
   - Carga configuraciones desde AsyncStorage

2. **Usuario edita perfil**
   - Presiona "Editar perfil"
   - Navega a EditProfileScreen

3. **Usuario cambia configuraciones**
   - Toggle de dark mode: Guarda en AsyncStorage
   - Toggle de notificaciones: Guarda en AsyncStorage y actualiza permisos

4. **Usuario accede a secciones**
   - "Mis visitas": Navega a MyVisitsScreen
   - "Mis matches": Navega a MyMatchesScreen
   - "Privacidad": Navega a PrivacySettingsScreen

5. **Usuario cierra sesión**
   - Presiona "Cerrar sesión"
   - Sistema muestra Alert de confirmación
   - Si confirma:
     - Limpia tokens de AsyncStorage
     - Limpia estado de Redux
     - Navega a LoginScreen

#### 7.1.5 Almacenamiento Local

**Configuraciones**:
```javascript
await AsyncStorage.setItem('darkMode', 'true')
await AsyncStorage.setItem('notifications', 'true')
```

**Al cerrar sesión**:
```javascript
await AsyncStorage.multiRemove([
  'authToken',
  'refreshToken',
  'userData',
  'darkMode',
  'notifications'
])
```

#### 7.1.6 Integración con API

**Endpoint**: `GET /api/v1/users/me/stats` (opcional, si las stats se cargan del servidor)

**Response**:
```json
{
  "stats": {
    "visits": 25,
    "matches": 12,
    "connections": 8
  }
}
```

#### 7.1.7 Navegación

**Entradas**:
- Desde tab navigator

**Salidas**:
- A EditProfileScreen
- A PrivacySettingsScreen
- A MyVisitsScreen
- A MyMatchesScreen
- A LoginScreen (logout)

---

### 7.2 EditProfileScreen (Editar Perfil)

**Archivo**: `mobile/src/screens/profile/EditProfileScreen.js`

#### 7.2.1 Propósito

Permitir al usuario editar su información personal y foto de perfil.

#### 7.2.2 Componentes Visuales

- **Avatar editable**: Presionar para cambiar foto
- **Campos de formulario**:
  - Nombre
  - Email (read-only)
  - Bio
  - Ubicación
  - Teléfono (opcional)
- **Botones**: "Guardar cambios" y "Cancelar"

#### 7.2.3 Campos y Validaciones

| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| **name*** | String | Sí | - Min 2 caracteres<br>- Max 50 caracteres<br>- Solo letras y espacios | "Nombre muy corto"<br>"Nombre muy largo" |
| **email** | String | Sí | - Formato de email válido<br>- Read-only (no editable) | - |
| **bio** | String | No | - Max 500 caracteres | "Bio muy larga" |
| **location** | String | No | - Max 100 caracteres | - |
| **phone** | String | No | - Formato: +XX XXX XXX XXXX<br>- Solo números y + | "Formato de teléfono inválido" |
| **avatar** | Image | No | - Formato: JPG, PNG, WEBP<br>- Max 5MB | "Imagen muy grande" |

#### 7.2.4 Flujo de Usuario

1. **Usuario abre EditProfileScreen**
   - Campos pre-poblados con datos actuales

2. **Usuario edita campos**
   - Valida en tiempo real (excepto al guardar)

3. **Usuario cambia avatar**
   - Presiona avatar
   - Modal de opciones: Cámara, Galería, Remover
   - Selecciona imagen
   - Preview se actualiza

4. **Usuario guarda cambios**
   - Presiona "Guardar cambios"
   - Sistema valida todos los campos
   - Si hay errores: Muestra mensajes
   - Si todo OK:
     - Hace PUT a API
     - Actualiza Redux state
     - Muestra toast de éxito
     - Navega back a ProfileScreen

#### 7.2.5 Integración con API

**Endpoint**: `PUT /api/v1/users/me`

**Request** (multipart si hay avatar):
```json
{
  "name": "Juan Pérez",
  "bio": "Amante de los perros y los parques",
  "location": "Buenos Aires, Argentina",
  "phone": "+54 11 1234 5678",
  "avatar": <binary>
}
```

**Response**:
```json
{
  "user": {
    "id": 100,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "bio": "Amante de los perros...",
    "location": "Buenos Aires, Argentina",
    "phone": "+54 11 1234 5678",
    "avatar_url": "https://..."
  }
}
```

---

### 7.3 PrivacySettingsScreen (Configuración de Privacidad)

**Archivo**: `mobile/src/screens/profile/PrivacySettingsScreen.js`

#### 7.3.1 Propósito

Permitir al usuario controlar su privacidad, visibilidad y gestión de datos.

#### 7.3.2 Secciones

**1. Privacidad del Perfil**
- Visibilidad del perfil: Switch
- Mostrar ubicación: Switch
- Mostrar última conexión: Switch

**2. Privacidad de Comunicación**
- Permitir mensajes: Switch
- Aparecer en descubrimiento: Switch

**3. Privacidad de Datos**
- Recopilación de datos: Switch
- Compartir ubicación: Switch

**4. Gestión de Datos**
- Exportar mis datos: Botón
- Eliminar cuenta: Botón (rojo)

#### 7.3.3 Campos y Validaciones

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| **profileVisibility** | Boolean | `true` | Perfil visible para todos los usuarios |
| **showLocation** | Boolean | `true` | Mostrar ubicación aproximada |
| **showLastSeen** | Boolean | `true` | Mostrar "Última vez activo" |
| **allowMessages** | Boolean | `true` | Recibir mensajes de matches |
| **showInDiscovery** | Boolean | `true` | Aparecer en sugerencias de match |
| **dataCollection** | Boolean | `true` | Permitir análisis de uso |
| **locationSharing** | Boolean | `true` | Compartir ubicación para funciones |

#### 7.3.4 Flujo de Usuario

**Cambiar configuración de privacidad**:
1. Usuario toggle un switch
2. Sistema guarda en AsyncStorage
3. Sistema envía actualización a API (async)
4. Si falla: Revierte el switch y muestra error

**Exportar datos**:
1. Usuario presiona "Exportar mis datos"
2. Sistema muestra Alert de confirmación
3. Si confirma:
   - Sistema hace request a API
   - Backend genera archivo ZIP con datos
   - Usuario recibe enlace por email o descarga directa

**Eliminar cuenta**:
1. Usuario presiona "Eliminar cuenta"
2. Sistema muestra Alert: "¿Estás seguro?"
3. Si confirma:
   - Sistema muestra segundo Alert: "Esta acción es permanente"
4. Si confirma nuevamente:
   - Sistema hace DELETE a API
   - Backend elimina usuario y datos
   - App limpia AsyncStorage
   - Navega a LoginScreen

#### 7.3.5 Integración con API

**Endpoint 1**: `PUT /api/v1/users/me/privacy`

**Request**:
```json
{
  "profileVisibility": true,
  "showLocation": true,
  "showLastSeen": false,
  "allowMessages": true,
  "showInDiscovery": true,
  "dataCollection": true,
  "locationSharing": true
}
```

**Endpoint 2**: `POST /api/v1/users/me/export-data`

**Response**:
```json
{
  "message": "Te enviaremos un enlace por email en 24 horas",
  "request_id": "uuid-v4"
}
```

**Endpoint 3**: `DELETE /api/v1/users/me`

**Response**:
```json
{
  "message": "Tu cuenta ha sido eliminada permanentemente"
}
```

#### 7.3.6 Almacenamiento Local

```javascript
await AsyncStorage.setItem('privacySettings', JSON.stringify({
  profileVisibility: true,
  showLocation: true,
  // ... resto de configuraciones
}))
```

#### 7.3.7 Alertas y Confirmaciones

**Eliminar cuenta - Primera confirmación**:
```
Título: "Eliminar cuenta"
Mensaje: "Esta acción eliminará permanentemente tu cuenta,
         todos tus datos, matches y mensajes. ¿Estás seguro?"
Botones: ["Cancelar", "Eliminar"]
```

**Eliminar cuenta - Segunda confirmación**:
```
Título: "Confirmar eliminación"
Mensaje: "Esta es tu última oportunidad. Una vez eliminada,
         no podrás recuperar tu cuenta. ¿Deseas continuar?"
Botones: ["Cancelar", "Sí, eliminar permanentemente"]
```

---

## 8. Módulo de Visitas

### 8.1 MyVisitsScreen (Mis Visitas)

**Archivo**: `mobile/src/screens/visits/MyVisitsScreen.js`

#### 8.1.1 Propósito

Mostrar todas las visitas planificadas del usuario (pasadas, próximas y todas).

#### 8.1.2 Componentes Visuales

- **Header**: Título y subtítulo
- **SegmentedButtons**: Filtros (Próximas, Pasadas, Todas)
- **FlatList**: Lista de tarjetas de visita
- **Tarjeta de visita**: Info del parque, fecha, hora, notas
- **Botón de cancelar**: En visitas próximas
- **Empty state**: Si no hay visitas

#### 8.1.3 Estados de Vista

| Tab | Descripción | Query |
|-----|-------------|-------|
| **Upcoming** | Visitas futuras (hoy o después) | `date >= today` |
| **Past** | Visitas pasadas | `date < today` |
| **All** | Todas las visitas | Sin filtro |

#### 8.1.4 Flujo de Usuario

1. **Usuario abre MyVisitsScreen**
   - Tab por defecto: "Upcoming"
   - Sistema carga visitas próximas desde API

2. **Usuario cambia de tab**
   - Presiona "Pasadas" o "Todas"
   - Sistema carga visitas correspondientes

3. **Usuario hace pull-to-refresh**
   - Recarga lista actual

4. **Usuario cancela visita**
   - Presiona ícono de eliminar
   - Sistema muestra Dialog de confirmación
   - Si confirma:
     - Hace DELETE a API
     - Remueve visita de la lista
     - Muestra toast de éxito

#### 8.1.5 Integración con API

**Endpoint**: `GET /api/v1/visits/me?filter={upcoming|past|all}`

**Response**:
```json
{
  "visits": [
    {
      "id": 456,
      "park_id": 1,
      "park_name": "Parque Centenario",
      "date": "2024-01-20",
      "time": "16:00",
      "duration": "1h 30min",
      "notes": "Llevaré juguetes",
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

**Endpoint**: `DELETE /api/v1/visits/{id}`

**Response**:
```json
{
  "message": "Visita cancelada exitosamente"
}
```

#### 8.1.6 Navegación

**Entradas**:
- Desde ProfileScreen
- Desde tab navigator (si hay tab)
- Desde notificación de visita próxima

**Salidas**:
- Back a ProfileScreen

---

## 9. Módulo de Administración

### 9.1 AdminPanelScreen (Panel de Administración)

**Archivo**: `mobile/src/screens/admin/AdminPanelScreen.js`

#### 9.1.1 Propósito

Panel exclusivo para administradores con estadísticas del sistema y gestión.

#### 9.1.2 Restricción de Acceso

**Validación**:
```javascript
if (!user.is_admin) {
  navigation.replace('Main')
  return
}
```

#### 9.1.3 Secciones

**1. Estadísticas del Sistema**
- Total de usuarios
- Usuarios activos (última semana)
- Total de parques
- Total de visitas
- Total de matches
- Reportes pendientes (con badge si > 0)

**2. Gestión**
- Gestión de usuarios: Navega a UserManagementScreen
- Gestión de parques: Navega a ParkManagementScreen
- Gestión de reportes: Navega a ReportManagementScreen

**3. Sistema**
- Analytics: Navega a AnalyticsScreen
- Configuración del sistema: Navega a SystemSettingsScreen
- Backup: Muestra Alert de confirmación

#### 9.1.4 Flujo de Usuario

1. **Admin abre AdminPanelScreen**
   - Sistema carga estadísticas desde API
   - Muestra stats en grid 2x3

2. **Admin presiona cualquier opción de gestión**
   - Navega a screen correspondiente (TODO)
   - O muestra "Próximamente" si no está implementado

3. **Admin presiona "Backup"**
   - Sistema muestra Alert: "¿Iniciar backup del sistema?"
   - Si confirma:
     - Hace POST a API /admin/backup
     - Muestra toast: "Backup iniciado"

#### 9.1.5 Integración con API

**Endpoint**: `GET /api/v1/admin/stats`

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "stats": {
    "totalUsers": 1250,
    "activeUsers": 150,
    "totalParks": 45,
    "totalVisits": 3420,
    "totalMatches": 890,
    "pendingReports": 3
  }
}
```

**Endpoint**: `POST /api/v1/admin/backup`

**Response**:
```json
{
  "message": "Backup iniciado",
  "backup_id": "uuid-v4"
}
```

#### 9.1.6 Navegación

**Entradas**:
- Desde menú oculto (solo visible para admins)

**Salidas**:
- A varias pantallas de gestión (TODO)
- Back a Main

---

## 10. Flujos de Usuario Completos

### 10.1 Flujo de Primer Uso

**Usuario nuevo que descarga la app**:

```
1. Splash Screen
   ↓
2. LoginScreen
   - Usuario ve características de la app
   - Presiona "Iniciar sesión con Google"
   ↓
3. Google Sign-In
   - Selector de cuenta
   - Autenticación
   ↓
4. Backend valida token
   - Crea usuario en BD
   - Retorna user.onboarded = false
   ↓
5. OnboardingNavigator
   ↓
6. Step1Screen
   - Usuario completa perfil personal
   - Presiona "Siguiente"
   ↓
7. Step2Screen
   - Usuario completa perfil del perro
   - Presiona "Siguiente"
   ↓
8. Step3Screen
   - Usuario configura privacidad e intereses
   - Presiona "Finalizar"
   ↓
9. Backend actualiza user.onboarded = true
   ↓
10. MainNavigator (Tab Navigator)
    - Tab 1: HomeTab → ParksScreen
    - Tab 2: DiscoverTab → DiscoverScreen
    - Tab 3: ChatsTab → ChatsListScreen
    - Tab 4: ProfileTab → ProfileScreen
```

---

### 10.2 Flujo de Registro de Visita

**Usuario quiere registrar una visita a un parque**:

```
1. Usuario abre app (ya autenticado)
   ↓
2. HomeTab → ParksScreen
   - Lista de parques cercanos se carga
   ↓
3. Usuario busca/filtra parques (opcional)
   - Escribe nombre o aplica filtros
   ↓
4. Usuario selecciona un parque
   - Presiona tarjeta de parque
   ↓
5. ParkDetailScreen
   - Ve detalles del parque
   - Mapa con ubicación
   - Presiona "Registrar visita"
   ↓
6. RegisterVisitScreen
   - Selecciona fecha (date picker)
   - Selecciona hora (time picker)
   - Agrega notas opcionales
   - Presiona "Registrar"
   ↓
7. Sistema valida y envía a API
   ↓
8. Confirmación
   - Toast: "Visita registrada exitosamente"
   - Navega a MyVisitsScreen
   ↓
9. MyVisitsScreen
   - Muestra la visita recién creada en "Próximas"
```

---

### 10.3 Flujo de Match y Chat

**Usuario quiere encontrar y chatear con otros dueños**:

```
1. Usuario abre app
   ↓
2. DiscoverTab → DiscoverScreen
   - Sistema carga sugerencias de matches
   - Muestra stack de tarjetas
   ↓
3. Usuario ve perfil de otro usuario
   - Foto, nombre, edad, perro, compatibilidad
   ↓
4. Usuario hace swipe right (o presiona corazón)
   - Sistema envía "like" a API
   ↓
5a. Si NO hay match mutuo:
    - Tarjeta se desliza fuera
    - Siguiente sugerencia se muestra
    - Fin del flujo

5b. Si HAY match mutuo:
    - Sistema detecta match
    - Modal "¡Es un Match!" aparece
    - Usuario presiona "Enviar mensaje"
    ↓
6. DMChatScreen
   - Chat se abre con el match
   - Usuario escribe mensaje
   - Presiona "Enviar"
   ↓
7. Mensaje se envía por WebSocket
   - Aparece en la conversación
   ↓
8. Otro usuario recibe notificación
   - Abre chat y responde
   ↓
9. Conversación continúa en tiempo real
```

---

### 10.4 Flujo de Gestión de Perfil

**Usuario quiere actualizar su información**:

```
1. ProfileTab → ProfileScreen
   ↓
2. Usuario presiona "Editar perfil"
   ↓
3. EditProfileScreen
   - Campos pre-poblados con datos actuales
   ↓
4. Usuario actualiza información
   - Cambia foto
   - Edita nombre, bio, ubicación, teléfono
   ↓
5. Usuario presiona "Guardar cambios"
   ↓
6. Sistema valida campos
   ↓
7a. Si hay errores:
    - Muestra mensajes de error
    - Usuario corrige y reintenta

7b. Si todo es válido:
    - Envía PUT a API
    - Actualiza Redux state
    - Muestra toast de éxito
    - Navega back a ProfileScreen
    ↓
8. ProfileScreen
   - Datos actualizados se reflejan
```

---

## 11. Validaciones Globales

### 11.1 Validación de Sesión

**En cada pantalla protegida**:
```javascript
useEffect(() => {
  if (!user || !isAuthenticated) {
    navigation.replace('Auth')
  }
}, [user, isAuthenticated])
```

### 11.2 Validación de Onboarding

**En MainNavigator**:
```javascript
if (!user.onboarded) {
  return <OnboardingNavigator />
}
```

### 11.3 Validación de Permisos

**Ubicación** (requerido para ParksScreen):
```javascript
const checkLocationPermission = async () => {
  const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
  if (status !== 'granted') {
    Alert.alert(
      'Permiso requerido',
      'ParkDog necesita acceso a tu ubicación para mostrar parques cercanos',
      [
        { text: 'Cancelar' },
        { text: 'Configuración', onPress: () => Linking.openSettings() }
      ]
    )
  }
}
```

**Cámara** (para subir fotos):
```javascript
const checkCameraPermission = async () => {
  const status = await request(PERMISSIONS.ANDROID.CAMERA)
  return status === 'granted'
}
```

### 11.4 Validación de Entrada de Texto

**Función global para sanitizar**:
```javascript
const sanitizeInput = (text) => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Prevenir XSS
    .substring(0, MAX_LENGTH)
}
```

### 11.5 Validación de Imágenes

**Función global**:
```javascript
const validateImage = (image) => {
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedFormats.includes(image.type)) {
    throw new Error('Formato de imagen no soportado')
  }

  if (image.size > maxSize) {
    throw new Error('Imagen muy grande (máximo 5MB)')
  }

  return true
}
```

---

## 12. Manejo de Errores

### 12.1 Tipos de Errores

#### 12.1.1 Errores de Red

| Código | Descripción | Acción |
|--------|-------------|--------|
| `NETWORK_ERROR` | Sin conexión a internet | Mostrar toast, botón "Reintentar" |
| `TIMEOUT` | Timeout de request | Mostrar toast, reintentar automáticamente (max 3 veces) |
| `SERVER_ERROR` | Error 500 del backend | Mostrar toast genérico, loguear error |

#### 12.1.2 Errores de Autenticación

| Código | Descripción | Acción |
|--------|-------------|--------|
| `UNAUTHORIZED` | Token inválido o expirado | Navegar a LoginScreen, limpiar tokens |
| `FORBIDDEN` | Sin permisos para la acción | Mostrar toast, no permitir acción |
| `INVALID_TOKEN` | Token de Google inválido | Mostrar error, permitir reintentar login |

#### 12.1.3 Errores de Validación

| Código | Descripción | Acción |
|--------|-------------|--------|
| `VALIDATION_ERROR` | Datos inválidos | Mostrar mensajes de error debajo de cada campo |
| `DUPLICATE_NICKNAME` | Nickname ya existe | Mostrar mensaje: "Este nickname ya está en uso" |
| `INVALID_FORMAT` | Formato incorrecto | Mostrar mensaje específico del campo |

#### 12.1.4 Errores de Negocio

| Código | Descripción | Acción |
|--------|-------------|--------|
| `NO_MATCH` | No hay match con el usuario | Mostrar pantalla de error, no permitir chat |
| `BLOCKED` | Usuario bloqueado | Mostrar pantalla de error |
| `RATE_LIMIT` | Demasiadas requests | Mostrar toast, deshabilitar acción temporalmente |
| `NOT_FOUND` | Recurso no encontrado | Mostrar toast, navegar back |

### 12.2 Estrategia de Manejo

#### 12.2.1 Interceptor de API

**Archivo**: `mobile/src/services/api/client.js`

```javascript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Token expirado, intentar refresh
          const newToken = await refreshAccessToken()
          if (newToken) {
            // Reintentar request original
            return apiClient.request(error.config)
          } else {
            // Logout
            store.dispatch(logout())
            navigationRef.navigate('Auth')
          }
          break

        case 403:
          Toast.show({
            type: 'error',
            text1: 'Acceso denegado',
            text2: data.error.message
          })
          break

        case 404:
          Toast.show({
            type: 'error',
            text1: 'No encontrado',
            text2: data.error.message
          })
          break

        case 429:
          Toast.show({
            type: 'error',
            text1: 'Demasiadas solicitudes',
            text2: 'Espera un momento antes de reintentar'
          })
          break

        case 500:
          Toast.show({
            type: 'error',
            text1: 'Error del servidor',
            text2: 'Estamos trabajando para solucionarlo'
          })
          MobileLogger.logError(error, { status: 500 })
          break

        default:
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.error?.message || 'Ocurrió un error inesperado'
          })
      }
    } else if (error.request) {
      // Sin respuesta del servidor
      Toast.show({
        type: 'error',
        text1: 'Sin conexión',
        text2: 'Verifica tu conexión a internet'
      })
    }

    return Promise.reject(error)
  }
)
```

#### 12.2.2 Logger de Errores

**Archivo**: `mobile/src/utils/logger.js`

```javascript
const MobileLogger = {
  logError: (error, context = {}, screen = '') => {
    const errorId = uuid.v4()
    const errorLog = {
      id: errorId,
      timestamp: new Date().toISOString(),
      screen,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: Platform.OS + ' ' + Platform.Version
    }

    // Log to console in DEV
    if (__DEV__) {
      console.error('[ERROR]', errorLog)
    }

    // Send to error tracking service (Sentry, etc.)
    // Sentry.captureException(error, { extra: errorLog })

    return errorId
  }
}
```

### 12.3 Mensajes de Error al Usuario

#### 12.3.1 Principios

1. **Claros y concisos**: Explicar qué salió mal sin tecnicismos
2. **Accionables**: Sugerir qué puede hacer el usuario
3. **Amigables**: Tono empático, no culpar al usuario
4. **Consistentes**: Mismo formato en toda la app

#### 12.3.2 Ejemplos

**Mal**:
```
Error: ECONNREFUSED 127.0.0.1:5000
```

**Bien**:
```
No pudimos conectar con el servidor.
Verifica tu conexión a internet e intenta nuevamente.
[Botón: Reintentar]
```

---

**Mal**:
```
ValidationError: nickname must be unique
```

**Bien**:
```
Este nickname ya está en uso.
Por favor, elige otro.
```

---

## Fin del Documento

Este documento de especificaciones funcionales cubre todas las pantallas y flujos principales de la aplicación móvil ParkDog. Para detalles técnicos de implementación, consultar `MOBILE_ARCHITECTURE.md`.

**Última actualización**: Enero 2025
**Versión**: 1.0
**Autor**: Claude Code (Anthropic)
