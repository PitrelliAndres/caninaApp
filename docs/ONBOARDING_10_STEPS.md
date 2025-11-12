# ParkDog - Flujo de Onboarding de 10 Pasos

**Versión**: 2.0
**ID del flujo**: ONB_PARKDOG_V1
**Total de pasos**: 10 pasos con barra de progreso

---

## 📋 Resumen del Flujo

Este flujo se dispara cuando:
- `isNewUser = true` (usuario recién autenticado con Google)
- `onboardingStatus != 'COMPLETED'` (usuario con onboarding incompleto)

---

## 🎯 Tabla de Pasos

| Paso | ID Pantalla | Título Principal | Obligatorio | Screen Mobile |
|------|-------------|------------------|-------------|---------------|
| 1 | `ONB_NAME` | ¿Cuál es tu nombre? | Sí | `Step1Screen.js` |
| 2 | `ONB_BIRTHDATE` | Tu fecha de nacimiento | Sí | `Step2Screen.js` |
| 3 | `ONB_GENDER` | ¿Cuál es tu género? | Sí | `Step3Screen.js` |
| 4 | `ONB_ORIENTATION` | ¿Cuál es tu orientación sexual? | Opcional | `Step4Screen.js` |
| 5 | `ONB_LOOKING_FOR` | ¿Qué estás buscando? | Opcional | `Step5Screen.js` |
| 6 | `ONB_DISTANCE` | ¿Qué distancia preferís? | Sí | `Step6Screen.js` |
| 7 | `ONB_LOCATION_PERMISSION` | ¿Vivís por acá cerca? | Sí (crítico) | `Step7Screen.js` |
| 8 | `ONB_HABITS_DOG` | Hablemos de hábitos de paseo | Opcional | `Step8Screen.js` |
| 9 | `ONB_INTERESTS_DOG` | ¿Qué te gusta hacer con tu perro? | Opcional | `Step9Screen.js` |
| 10 | `ONB_PHOTOS` | Añadí tus primeras fotos | Recomendado | `Step10Screen.js` |

---

## 📱 Componentes Comunes en Todos los Pasos

### Barra de Progreso
- **Ubicación**: Top de la pantalla
- **Estilo**: Barra horizontal segmentada (similar a Tinder)
- **Color**: Primario de marca (magenta/verde Parkdog)
- **Cálculo**: `currentStep / 10 * 100`

```javascript
// Ejemplo: Paso 1 → 10%, Paso 2 → 20%, ..., Paso 10 → 100%
const progress = (currentStep / 10) * 100;
```

### Navegación
- **Flecha atrás**: Top-left (vuelve al paso anterior)
- **Botón "Omitir"**: Top-right (solo en pasos opcionales)
- **Botón principal**: Bottom (Siguiente/Finalizar)

### Persistencia
- Cada paso guarda su progreso localmente (AsyncStorage)
- Al finalizar, se envía TODO el payload al backend

---

## 🔢 Detalle por Paso

---

## Paso 1: ONB_NAME - ¿Cuál es tu nombre?

### Propósito
Capturar el nombre visible del usuario en su perfil.

### UI
- **Título**: "¿Cuál es tu nombre?"
- **Campo de texto**: Input underline style
  - Placeholder: "Ingresá tu nombre"
  - **Autocompletado**: Se rellena automáticamente con el nombre de la cuenta de Google
  - **Editable**: El usuario puede modificarlo durante el onboarding
- **Texto de ayuda**: "Así va a aparecer en tu perfil. Una vez completado el registro, no podrás cambiarlo."
- **Botón**: "Siguiente" (deshabilitado hasta validación)

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `name` | String | Sí | - Min 2 caracteres<br>- Max 30 caracteres<br>- No solo espacios<br>- Normalizar espacios múltiples | "El nombre debe tener al menos 2 caracteres"<br>"Nombre muy largo (máx 30)" |

### Payload
```json
{
  "stepId": "ONB_NAME",
  "data": {
    "name": "Andrés"
  }
}
```

---

## Paso 2: ONB_BIRTHDATE - Tu fecha de nacimiento

### Propósito
Obtener fecha de nacimiento, validar edad mínima y confirmar con popup.

### UI
- **Título**: "Tu fecha de nacimiento"
- **Campo de fecha**: Card grande con estilo de input
  - Placeholder: "10 nov 1995"
  - Al tocar → Date picker nativo
- **Tarjeta de signo astral** (opcional):
  - "Tu signo astral es: Escorpio"
  - Toggle: "¿Mostrarlo en tu perfil?"
  - Texto: "Podrás modificarlo más tarde"
- **Botón**: "Siguiente"

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `birthdate` | Date | Sí | - Edad mínima: 18 años<br>- Edad máxima: 120 años<br>- Fecha válida | "Debés tener al menos 18 años para usar Parkdog" |
| `showZodiacSign` | Boolean | No | - | - |

### Popup de Confirmación (Obligatorio)
Al tocar "Siguiente":
- **Icono**: Torta/cumpleaños
- **Título**: "¿Tenés [edad calculada] años?"
- **Texto**: "Comprobá que tu edad es la correcta, después no vas a poder cambiarla."
- **Botones**:
  - "Confirmar" → Envía y avanza
  - "Modificar" → Cierra modal y permite editar
  - Botón X → Igual que Modificar

### Cálculo Automático
```javascript
const age = calculateAge(birthdate); // En años
const zodiacSign = calculateZodiacSign(birthdate); // Ej: "Escorpio"
```

### Payload
```json
{
  "stepId": "ONB_BIRTHDATE",
  "data": {
    "birthdate": "1994-10-09",
    "age": 31,
    "zodiacSign": "Libra",
    "showZodiacSign": true
  }
}
```

---

## Paso 3: ONB_GENDER - ¿Cuál es tu género?

### Propósito
Capturar género con opción de mostrar/ocultar en perfil.

### UI
- **Título**: "¿Cuál es tu género?"
- **Subtítulo**: "Seleccioná todas las opciones que te describan para ayudarnos a que mostremos tu perfil a las personas correctas. Podés agregar más detalles si querés."
- **Lista de opciones** (multi-select):
  - Varón
  - Mujer
  - No binario / Extrabinario
  - (Opcional: Prefiero no decirlo)
- **Enlace**: "Conocé cómo Parkdog usa esta información" → Página legal
- **Checkbox**: "Mostrar género en el perfil"
- **Botón**: "Siguiente"

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `genders` | Array[String] | Sí | - Min 1 opción<br>- Max 3 opciones | "Seleccioná al menos un género"<br>"Máximo 3 opciones" |
| `showGenderOnProfile` | Boolean | No | - | - |

### Valores Permitidos
```javascript
const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"];
```

### Payload
```json
{
  "stepId": "ONB_GENDER",
  "data": {
    "genders": ["MALE"],
    "showGenderOnProfile": true
  }
}
```

---

## Paso 4: ONB_ORIENTATION - ¿Cuál es tu orientación sexual?

### Propósito
Guardar orientación sexual con definiciones y opción de privacidad (paso opcional).

### UI
- **Título**: "¿Cuál es tu orientación sexual?"
- **Subtítulo**: "Seleccioná todas las opciones que reflejen tu identidad."
- **Botón "Omitir"**: Top-right
- **Cards con título + descripción** (multi-select):
  - Heterosexual: "Persona que se siente atraída únicamente por personas del género opuesto"
  - Gay
  - Lesbiana
  - Bisexual
  - Asexual
  - Pansexual
  - Queer
  - Demisexual
  - (Otros según catálogo)
- **Checkbox**: "Mostrar orientación sexual en mi perfil"
- **Botón**: "Siguiente"

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `orientations` | Array[String] | No | - Multi-select libre | - |
| `showOrientationOnProfile` | Boolean | No | - | - |

### Comportamiento
- **Si pulsa "Omitir"**: Envía lista vacía con `skipped: true`
- **Si selecciona**: Envía lista con opciones

### Payload
```json
{
  "stepId": "ONB_ORIENTATION",
  "data": {
    "orientations": ["HETEROSEXUAL"],
    "showOrientationOnProfile": true,
    "skipped": false
  }
}
```

---

## Paso 5: ONB_LOOKING_FOR - ¿Qué estás buscando?

### Propósito
Capturar tipo de relación/conexión que busca el usuario (opcional).

### UI
- **Título**: "¿Qué estás buscando?"
- **Subtítulo**: "Todo bien si eso después cambia. Acá hay algo para todo el mundo."
- **Grid 2x3 de cards cuadradas** con emoji/icono (selección única):
  - ❤️‍🔥 Pareja estable
  - 😍 Pareja o algo casual
  - 🥂 Algo casual o algo estable
  - 🎉 Algo casual
  - 👋 Hacer amigxs
  - 🤔 Todavía no sé qué quiero
- **Botón**: "Siguiente"

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `lookingFor` | String | No | - Una opción (single choice) | "Seleccioná una opción" |

### Valores Permitidos
```javascript
const LOOKING_FOR_OPTIONS = [
  "SERIOUS_RELATIONSHIP",
  "RELATIONSHIP_OR_CASUAL",
  "CASUAL_OR_RELATIONSHIP",
  "CASUAL",
  "MAKE_FRIENDS",
  "NOT_SURE"
];
```

### Payload
```json
{
  "stepId": "ONB_LOOKING_FOR",
  "data": {
    "lookingFor": "SERIOUS_RELATIONSHIP"
  }
}
```

---

## Paso 6: ONB_DISTANCE - ¿Qué distancia preferís?

### Propósito
Guardar distancia máxima para sugerir matches/paseos.

### UI
- **Título**: "¿Qué distancia preferís?"
- **Subtítulo**: "Usá el selector para establecer la máxima distancia a la que querés que se encuentren tus posibles matches y paseos."
- **Slider**:
  - Label: "Preferencia de distancia"
  - Valor a la derecha: "61 km"
  - Rango: 1-100 km
- **Texto secundario**: "Podés cambiar tus preferencias más adelante en Ajustes."
- **Botón**: "Siguiente"

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `maxDistanceKm` | Number | Sí | - Min: 1 km<br>- Max: 100 km<br>- Default: 10 km | "Distancia inválida" |

### Payload
```json
{
  "stepId": "ONB_DISTANCE",
  "data": {
    "maxDistanceKm": 25
  }
}
```

---

## Paso 7: ONB_LOCATION_PERMISSION - ¿Vivís por acá cerca?

### Propósito
Solicitar permiso de ubicación (crítico para la app).

### UI
- **Título**: "¿Vivís por acá cerca?"
- **Subtítulo**: "Establecé tu ubicación para ver quiénes están en tu barrio o alrededores. De lo contrario, no vas a poder hacer match con otra gente."
- **Ilustración central**: Círculo grande con ícono de pin/mapa
- **Botón principal**: "Permitir"
- **Enlace inferior**: "¿Cómo se usa mi ubicación?" → Despliega texto legal

### Comportamiento

#### Si acepta permiso:
1. Invocar permisos de geolocalización del SO
2. Obtener coordenadas actuales
3. Enviar payload con ubicación
4. Avanzar a Paso 8

#### Si rechaza permiso:
- Mostrar mensaje: "Sin tu ubicación no podemos mostrarte personas y paseos cerca. Podés activarla más tarde desde Ajustes."
- **Decisión de negocio**:
  - Opción A: Bloquear avance (recomendado)
  - Opción B: Permitir continuar pero feed vacío hasta que active ubicación

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `locationPermissionGranted` | Boolean | Sí | - Debe ser `true` para continuar | "Permiso de ubicación requerido" |
| `lat` | Number | Sí (si granted) | - Latitud válida | - |
| `lng` | Number | Sí (si granted) | - Longitud válida | - |

### Payload
```json
{
  "stepId": "ONB_LOCATION_PERMISSION",
  "data": {
    "locationPermissionGranted": true,
    "lat": -34.6037,
    "lng": -58.3816,
    "accuracy": 30
  }
}
```

---

## Paso 8: ONB_HABITS_DOG - Hablemos de hábitos de paseo

### Propósito
Entender hábitos del usuario y su perro para mejores matches/paseos (opcional).

### UI
- **Título**: "Hablemos sobre hábitos, [Nombre]"
- **Subtítulo**: "¿Tus hábitos de paseo coinciden con los de los demás? Arrancá vos."
- **Botón "Omitir"**: Top-right
- **Secciones con chips seleccionables** (multi-select):

#### Sección 1: ¿Cada cuánto salís a pasear con tu perro? 🐕
- Varias veces por día
- Una vez por día
- Solo los findes
- Cuando tengo tiempo
- Todavía no tengo perro, quiero unirme igual

#### Sección 2: ¿Qué tipo de paseo preferís? 🏞️
- Paseos tranquilos
- Salir a correr
- Parques para perros
- Senderismo / naturaleza
- Paseos urbanos (ciudad)
- Playas dog-friendly

#### Sección 3: ¿Cómo se lleva tu perro con otros perros? 🐾
- Muy sociable
- Tímido al principio
- Prefiere humanos
- En proceso de adaptación
- No tengo perro (todavía)

#### Sección 4: ¿Tenés más mascotas? 🐱
- Perro
- Gato
- Otros
- Solo mi perro
- Ninguna por ahora

- **Botón**: "Siguiente 0/4" (contador de secciones respondidas)

### Validaciones
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `walkFrequency` | Array[String] | No | Multi-select libre |
| `walkTypes` | Array[String] | No | Multi-select libre |
| `dogSociability` | Array[String] | No | Multi-select libre |
| `otherPets` | Array[String] | No | Multi-select libre |
| `sectionsAnswered` | Number | No | 0-4 (contador visual) |

### Payload
```json
{
  "stepId": "ONB_HABITS_DOG",
  "data": {
    "walkFrequency": ["DAILY"],
    "walkTypes": ["PARKS", "URBAN"],
    "dogSociability": ["VERY_SOCIAL"],
    "otherPets": ["DOG", "CAT"],
    "sectionsAnswered": 3
  }
}
```

---

## Paso 9: ONB_INTERESTS_DOG - ¿Qué te gusta hacer con tu perro?

### Propósito
Capturar intereses (hasta 10) para mejorar matching y planes (opcional).

### UI
- **Título**: "¿Qué te gusta hacer?"
- **Subtítulo**: "Agregá hasta 10 intereses a tu perfil para ayudarte a encontrar personas que disfruten lo mismo que vos (y tu perro)."
- **Botón "Omitir"**: Top-right
- **Contador**: "Siguiente: 0/10" (en botón o parte baja del scroll)
- **Categorías colapsables con chips**:

#### 🏕 Aire libre y aventura
- Caminatas largas
- Senderismo con perro
- Ir a la montaña
- Acampar
- Viajes de ruta con perro
- Playas dog-friendly
- Parques grandes
- Agility / deportes caninos

#### ☕ Social y ciudad
- Cafés dog-friendly
- Paseos grupales
- Plazas del barrio
- Dog dates (perros con perros)
- Eventos para perros
- After office con perros

#### 🌱 Bienestar y estilo de vida
- Adiestramiento positivo
- Voluntariado / refugios
- Adopciones y rescate
- Fotografía de perros
- Cosas DIY para mascotas
- Slow walks / paseos tranquilos

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `interests` | Array[String] | No | - Máximo 10 intereses | "Podés elegir hasta 10 intereses" |

### Comportamiento
- Si intenta seleccionar el 11º: Toast + No marca el 11º
- Paso opcional (puede Omitir)

### Payload
```json
{
  "stepId": "ONB_INTERESTS_DOG",
  "data": {
    "interests": [
      "DOG_FRIENDLY_CAFES",
      "GROUP_WALKS",
      "HIKING_WITH_DOG"
    ]
  }
}
```

---

## Paso 10: ONB_PHOTOS - Añadí tus primeras fotos

### Propósito
Que el usuario añada fotos de perfil (persona + perro).

### UI
- **Título**: "Añadí tus primeras fotos"
- **Subtítulo**: "Elegí fotos tuyas y de tu perro que muestren su personalidad y sus gustos."
- **Grid 2x3 de placeholders** (6 slots) con ícono de imagen
- **Tip abajo**: "Nuestros consejos para elegir tus fotos" → Modal con tips
- **Botón inferior grande**: "Añadir una foto"
- **Botón "Siguiente"/"Finalizar"**: Solo habilitado si cumple mínimo

### Reglas
- **Mínimo recomendado**: 2 fotos
- **Recomendaciones**:
  - Al menos 1 donde se vea claramente la persona
  - Al menos 1 donde se vea el perro (si tiene)
- **Formatos**: JPG, PNG, WEBP
- **Peso máximo**: 5MB por foto

### Comportamiento

#### Al presionar "Añadir una foto":
1. Abrir sheet con opciones:
   - Tomar foto con cámara
   - Elegir de galería
   - Cancelar
2. Seleccionar imagen
3. Validar tamaño y formato
4. Mostrar preview en placeholder
5. Hacer upload a storage
6. Obtener `photoUrl`

### Validaciones
| Campo | Tipo | Requerido | Validación | Mensaje de Error |
|-------|------|-----------|------------|------------------|
| `photos` | Array[Object] | Sí | - Min 2 fotos<br>- Max 6 fotos<br>- Al menos 1 tipo USER<br>- Al menos 1 tipo DOG (si tiene perro) | "Agregá al menos 2 fotos"<br>"Al menos 1 foto tuya"<br>"Al menos 1 foto de tu perro" |

### Decisión de Negocio
- **Hard requirement**: No permitir finalizar sin 2 fotos (recomendado)
- **Soft requirement**: Permitir finalizar pero avisar de menos visibilidad

### Payload
```json
{
  "stepId": "ONB_PHOTOS",
  "data": {
    "photos": [
      { "url": "https://cdn/.../user_1.jpg", "type": "USER" },
      { "url": "https://cdn/.../dog_1.jpg", "type": "DOG" }
    ]
  }
}
```

### Al Finalizar
Cuando este paso se completa:
```json
{
  "onboardingStatus": "COMPLETED"
}
```
Backend habilita acceso al feed/mapa de paseos.

---

## 🔄 Persistencia y Navegación

### Almacenamiento Local (AsyncStorage)
Cada paso guarda su progreso:
```javascript
await AsyncStorage.setItem(`onboarding_step_${stepNumber}`, JSON.stringify(data));
```

### Recuperación de Progreso
Al volver a la app:
1. Leer último paso completado
2. Cargar datos previos
3. Permitir editar antes de enviar

### Envío Final
Al completar Paso 10:
```javascript
const finalPayload = {
  step1: { name: "Andrés" },
  step2: { birthdate: "1994-10-09", age: 31, ... },
  step3: { genders: ["MALE"], showGenderOnProfile: true },
  step4: { orientations: [], skipped: true },
  step5: { lookingFor: "SERIOUS_RELATIONSHIP" },
  step6: { maxDistanceKm: 25 },
  step7: { locationPermissionGranted: true, lat: -34.6037, lng: -58.3816 },
  step8: { walkFrequency: ["DAILY"], walkTypes: ["PARKS"], ... },
  step9: { interests: ["DOG_FRIENDLY_CAFES", ...] },
  step10: { photos: [{ url: "...", type: "USER" }, ...] }
};

await onboardingAPI.complete(finalPayload);
```

Backend responde:
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

---

## 📊 Analytics Sugeridos

### Eventos a Trackear
- `onb_step_view { stepId }` - Vista de cada paso
- `onb_step_completed { stepId }` - Completó un paso
- `onb_step_skipped { stepId }` - Omitió un paso opcional
- `onb_birthdate_underage` - Intentó con edad < 18
- `onb_location_permission_denied` - Negó permisos de ubicación
- `onb_photos_min_not_met` - Intentó finalizar sin fotos mínimas
- `onb_completed { totalTimeSeconds }` - Completó todo el onboarding

---

## 🎨 Consideraciones de UI/UX

### Barra de Progreso
- Usar color primario de marca
- Segmentada (no continua)
- Animación suave al avanzar

### Transiciones
- Slide horizontal al cambiar de paso
- Fade in/out para modals

### Feedback Visual
- Checkmark verde en campos válidos
- Shake animation en errores
- Loading states claros

### Accesibilidad
- Labels descriptivos
- Contraste WCAG AA+
- Touch targets mínimos 44x44px

---

## 🔐 Seguridad y Privacidad

### Datos Sensibles
- Género y orientación sexual: Tratados como datos sensibles
- Textos claros de uso de la información
- Toggles de "mostrar en el perfil"
- Consentimiento implícito al continuar

### Permisos del Sistema
- Ubicación: Solicitar con texto claro
- Cámara/Galería: Solicitar al usar

### Almacenamiento
- Datos locales: AsyncStorage (no sensibles)
- Fotos: Upload a storage seguro (S3, Cloudinary)
- Tokens: Secure storage (Keychain en iOS, Keystore en Android)

---

## ✅ Checklist de Implementación

### Backend
- [ ] Agregar campos al modelo User
- [ ] Crear migración de BD
- [ ] Endpoint `POST /onboarding/step` para guardar progreso parcial
- [ ] Endpoint `POST /onboarding/complete` para finalizar
- [ ] Validaciones de edad mínima
- [ ] Validaciones de ubicación

### Mobile
- [ ] Crear 10 screens de onboarding
- [ ] Implementar navegación con barra de progreso
- [ ] Implementar persistencia local (AsyncStorage)
- [ ] Implementar permisos de ubicación
- [ ] Implementar subida de fotos
- [ ] Implementar date picker + popup de confirmación
- [ ] Implementar chips multi-select
- [ ] Implementar slider de distancia
- [ ] Integrar con API backend
- [ ] Agregar traducciones i18n (es/en)
- [ ] Testing de flujo completo

### Diseño
- [ ] Diseñar cada pantalla en Figma
- [ ] Definir colores y tipografía
- [ ] Crear iconografía para categorías
- [ ] Definir animaciones y transiciones

---

**Última actualización**: Noviembre 2025
**Versión del documento**: 2.0
**Autor**: Claude Code (Anthropic)
