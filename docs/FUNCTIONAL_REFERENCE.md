# ParkDog Mobile - Guía Funcional por Característica

## Índice

1. [Autenticación](#1-autenticación)
2. [Onboarding](#2-onboarding)
3. [Gestión de Parques](#3-gestión-de-parques)
4. [Sistema de Matches](#4-sistema-de-matches)
5. [Mensajería](#5-mensajería)
6. [Perfil de Usuario](#6-perfil-de-usuario)
7. [Gestión de Visitas](#7-gestión-de-visitas)
8. [Panel de Administración](#8-panel-de-administración)

---

## 1. Autenticación

### 1.1 Inicio de Sesión con Google

**¿Qué hace?**: Permite al usuario autenticarse usando su cuenta de Google sin necesidad de crear contraseñas.

**Campos**:
- Sin campos de entrada manual (autenticación delegada a Google)

**Botones y Acciones**:

| Botón/Acción | ¿Qué hace? |
|--------------|------------|
| **Iniciar sesión con Google** | Abre el selector de cuentas de Google, obtiene el token de autenticación, lo envía al backend y autentica al usuario. Si es primera vez (`onboarded=false`), lleva a Onboarding. Si ya completó onboarding, lleva a pantalla principal. |
| **Selector de idioma** | Cambia el idioma de la app entre Español e Inglés. |

**Estados**:
- **Normal**: Botón habilitado para iniciar sesión
- **Cargando**: Muestra spinner mientras autentica
- **Error**: Muestra mensaje de error si falla (token inválido, sin Google Play Services, cancelación)

---

## 2. Onboarding

### 2.1 Paso 1 - Perfil Personal

**¿Qué hace?**: Recopila información básica del usuario (nickname, edad, foto).

**Campos**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Foto de perfil** | Avatar del usuario | Al presionar, abre opciones para tomar foto con cámara o seleccionar de galería. Actualiza la vista previa. | Opcional. Máx 5MB, formatos JPG/PNG/WEBP |
| **Nickname** | Nombre de usuario único | Usuario escribe su apodo. Después de 500ms sin escribir, verifica disponibilidad en tiempo real y muestra ✓ verde (disponible) o ✗ roja (no disponible). | Requerido. 3-20 caracteres, solo letras, números y guion bajo. Debe ser único. |
| **Edad** | Años del usuario | Selector numérico donde el usuario elige su edad. | Requerido. Entre 10 y 99 años. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Siguiente** | Valida todos los campos. Si hay errores, los muestra. Si todo es válido, guarda los datos localmente y avanza a Paso 2. |

---

### 2.2 Paso 2 - Perfil del Perro

**¿Qué hace?**: Recopila información del perro del usuario.

**Campos**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Foto del perro** | Imagen del perro | Igual que foto de perfil: permite tomar foto o seleccionar de galería. | Opcional. Máx 5MB, formatos JPG/PNG/WEBP |
| **Nombre** | Nombre del perro | Usuario escribe el nombre de su perro. | Requerido. 2-50 caracteres, solo letras y espacios. |
| **Edad** | Años del perro | Selector numérico para la edad del perro. | Requerido. Entre 0 y 25 años. |
| **Raza** | Raza del perro | Dropdown con lista de 20+ razas predefinidas (Golden Retriever, Labrador, Mestizo, etc.). | Requerido. Debe seleccionar una opción. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Anterior** | Guarda datos actuales y vuelve a Paso 1. |
| **Siguiente** | Valida campos. Si todo es válido, guarda datos localmente y avanza a Paso 3. |

---

### 2.3 Paso 3 - Privacidad e Intereses

**¿Qué hace?**: Configura preferencias de privacidad y selecciona intereses del usuario.

**Campos de Privacidad**:

| Campo | ¿Qué es? | ¿Qué hace? | Default |
|-------|----------|------------|---------|
| **Perfil público** | Switch de privacidad | Si está ON, tu perfil es visible para todos. Si está OFF, solo tus matches te ven. | ON |
| **Permitir matching** | Switch de funcionalidad | Si está ON, apareces en sugerencias de match. Si está OFF, no te muestran a otros usuarios. | ON |
| **Mostrar proximidad** | Switch de ubicación | Si está ON, otros usuarios ven tu distancia aproximada. Si está OFF, tu ubicación es privada. | ON |

**Campos de Intereses**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Lista de intereses** | Grid de checkboxes | Muestra 10 intereses disponibles (Paseos largos, Entrenamiento, Socialización, etc.). Usuario selecciona los que aplican. | Opcional. Máximo 10 seleccionados. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Anterior** | Vuelve a Paso 2. |
| **Finalizar** | Combina datos de Paso 1, 2 y 3, los envía al backend. Backend marca `user.onboarded=true`. Limpia datos temporales y navega a pantalla principal. |

---

## 3. Gestión de Parques

### 3.1 Lista de Parques

**¿Qué hace?**: Muestra parques cercanos a la ubicación del usuario con opciones de búsqueda y filtrado.

**Campos de Búsqueda y Filtros**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Barra de búsqueda** | Input de texto | Usuario escribe nombre de parque o barrio. Después de 300ms, filtra la lista mostrando solo coincidencias. | Opcional. Máx 100 caracteres. |
| **Distancia máxima** | Slider | Usuario ajusta radio de búsqueda (1-50 km). Recarga lista con parques dentro del nuevo radio. | Default: 10 km |
| **Con área para perros** | Checkbox | Si está marcado, solo muestra parques que tienen área dedicada para perros. | Default: OFF |
| **Cercado** | Checkbox | Si está marcado, solo muestra parques con cerco perimetral. | Default: OFF |
| **Con agua** | Checkbox | Si está marcado, solo muestra parques con fuentes de agua disponibles. | Default: OFF |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Toggle Map/List** | Alterna entre vista de mapa (con markers) y vista de lista (tarjetas). Mantiene filtros aplicados. |
| **Filtros** | Abre modal con todos los filtros disponibles. Usuario aplica filtros y presiona "Aplicar" para actualizar la lista. |
| **Tarjeta de parque** | Al presionar, navega a detalle del parque seleccionado. |
| **Pull to refresh** | Desliza hacia abajo para recargar lista de parques. |

**Permisos Requeridos**:
- **Ubicación**: Solicita permiso de ubicación al abrir. Si se niega, usa ubicación por defecto y muestra mensaje.

---

### 3.2 Detalle de Parque

**¿Qué hace?**: Muestra información completa de un parque específico.

**Información Mostrada**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Mapa** | Muestra ubicación exacta del parque con marker |
| **Nombre** | Nombre oficial del parque |
| **Barrio/Zona** | Ubicación del parque |
| **Descripción** | Información adicional del parque (si existe) |
| **Características** | Chips visuales: área para perros, cercado, agua |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Registrar visita** | Navega a pantalla de registro de visita con este parque pre-seleccionado. |

---

### 3.3 Registrar Visita

**¿Qué hace?**: Permite planificar y registrar una visita futura a un parque.

**Campos**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Fecha** | Selector de fecha | Usuario presiona y se abre date picker nativo. Selecciona día de la visita. | Requerido. Debe ser hoy o fecha futura (máx 30 días adelante). |
| **Hora** | Selector de hora | Usuario presiona y se abre time picker nativo. Selecciona hora de la visita. | Requerido. Si es hoy, debe ser hora futura. |
| **Notas** | Textarea | Usuario puede escribir notas adicionales (ej: "llevaré juguetes para compartir"). | Opcional. Máx 500 caracteres. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Registrar** | Valida fecha y hora. Envía datos al backend. Si es exitoso, muestra toast de confirmación y navega a "Mis Visitas". Si falla, muestra error. |
| **Cancelar** | Descarta cambios y vuelve a detalle del parque. |

---

## 4. Sistema de Matches

### 4.1 Descubrir Usuarios (Swipe)

**¿Qué hace?**: Muestra sugerencias de otros usuarios para hacer match, estilo Tinder.

**Información de Tarjeta**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Foto** | Avatar del usuario sugerido |
| **Nombre y edad** | "María, 28" |
| **Info del perro** | "Con Luna (Golden Retriever)" |
| **Compatibilidad** | Porcentaje de match basado en intereses comunes, proximidad y parques visitados |
| **Distancia** | "A 2.3 km de ti" |

**Gestos y Acciones**:

| Gesto/Botón | ¿Qué hace? |
|-------------|------------|
| **Swipe Right (deslizar derecha)** | Envía "like" al usuario. Si el otro usuario ya te dio like, se crea match mutuo y aparece modal "¡Es un Match!". Si no, simplemente se guarda el like y pasa a siguiente tarjeta. |
| **Swipe Left (deslizar izquierda)** | Descarta al usuario. No se mostrará nuevamente. Pasa a siguiente tarjeta. |
| **Botón ❤️ (corazón)** | Igual que swipe right. |
| **Botón ✗ (X)** | Igual que swipe left. |
| **Tap en tarjeta** | Abre perfil completo del usuario en modal. |

**Modal de Match**:
- Aparece cuando hay match mutuo
- Muestra fotos de ambos usuarios
- **Botón "Enviar mensaje"**: Abre chat directo con el match
- **Botón "Seguir descubriendo"**: Cierra modal y continúa viendo sugerencias

---

### 4.2 Mis Matches

**¿Qué hace?**: Lista todos los matches mutuos del usuario.

**Información de Tarjeta**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Avatar** | Foto del usuario con quien hiciste match |
| **Nombre y edad** | Información básica |
| **Info del perro** | Nombre y raza |
| **Último mensaje** | Preview del último mensaje intercambiado |
| **Timestamp** | Cuándo fue el último mensaje ("5 min", "2 h") |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Ver perfil** | Abre perfil completo del match en modal. |
| **Chat** | Abre conversación directa con ese match. |
| **Pull to refresh** | Recarga lista de matches. |

---

## 5. Mensajería

### 5.1 Lista de Conversaciones

**¿Qué hace?**: Muestra todas las conversaciones activas del usuario.

**Información de Conversación**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Avatar** | Foto del otro usuario |
| **Nombre** | Nickname del otro usuario |
| **Indicador online** | Punto verde si está conectado ahora, gris si offline |
| **Último mensaje** | Texto del último mensaje (truncado) |
| **Timestamp** | "5 min", "2 h", "ayer" |
| **Badge de no leídos** | Número de mensajes sin leer (si hay) |

**Acciones**:

| Acción | ¿Qué hace? |
|--------|------------|
| **Presionar conversación** | Abre el chat completo con ese usuario. |
| **Pull to refresh** | Recarga lista de conversaciones. |

**Actualización en Tiempo Real**:
- Lista se actualiza automáticamente cuando llegan nuevos mensajes
- Contador de no leídos se actualiza en vivo
- Status online/offline se actualiza en vivo

---

### 5.2 Chat Grupal

**¿Qué hace?**: Conversación asociada a una visita o evento en un parque (múltiples participantes).

**Elementos de Mensaje**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Burbuja de mensaje** | Contiene el texto del mensaje. Azul y alineada a la derecha si es tuyo, gris y a la izquierda si es de otro. |
| **Timestamp** | Hora del mensaje ("14:30") |
| **Indicador de lectura** | Solo en mensajes propios: reloj (enviando), check simple (entregado), doble check gris (recibido), doble check azul (leído) |
| **Indicador "escribiendo..."** | Aparece cuando otro usuario está escribiendo |

**Campos**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Input de mensaje** | Textarea multiline | Usuario escribe su mensaje. Mientras escribe, envía señal de "typing" a otros usuarios. | Requerido. Min 1 carácter, máx 1000 caracteres, no solo espacios. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Enviar (ícono avión)** | Envía el mensaje al chat. Aparece instantáneamente en la lista con estado "enviando". Cuando el servidor confirma, cambia a "entregado". |
| **Avatar del header** | Presionar para ver perfil del otro usuario. |

**Eventos en Tiempo Real**:
- Mensajes nuevos aparecen instantáneamente
- Indicadores de lectura se actualizan en vivo
- Status online/offline se actualiza automáticamente

---

### 5.3 Chat Directo (DM)

**¿Qué hace?**: Conversación privada 1 a 1 entre usuarios con match mutuo.

**Diferencias con Chat Grupal**:
- Valida que exista match mutuo antes de abrir
- Si no hay match: muestra error "No puedes enviar mensajes a este usuario"
- Si usuario te bloqueó: muestra error "Este usuario te ha bloqueado"
- Indicador de conexión en header (conectando, conectado, reconectando)

**Campos y Acciones**: Idénticas a Chat Grupal

**Estados de Conexión**:

| Estado | ¿Qué muestra? | ¿Qué significa? |
|--------|---------------|-----------------|
| **Conectando** | Chip amarillo "Conectando..." | Estableciendo conexión WebSocket |
| **Conectado** | Sin indicador | Conexión activa, mensajes en tiempo real |
| **Reconectando** | Chip rojo "Reconectando..." | Perdió conexión, intentando recuperar |
| **Sin conexión** | Chip gris, input deshabilitado | Sin internet o servidor caído |

---

## 6. Perfil de Usuario

### 6.1 Mi Perfil

**¿Qué hace?**: Muestra información del usuario, estadísticas y configuraciones.

**Información Mostrada**:

| Sección | ¿Qué muestra? |
|---------|---------------|
| **Perfil** | Avatar, nombre, email, fecha de registro |
| **Estadísticas** | Número de visitas, matches y conexiones activas |

**Configuraciones (Switches)**:

| Switch | ¿Qué es? | ¿Qué hace? |
|--------|----------|------------|
| **Dark mode** | Modo oscuro | Activa/desactiva tema oscuro de la app. Guarda preferencia localmente. |
| **Notificaciones** | Notificaciones push | Activa/desactiva notificaciones. Actualiza permisos del sistema. |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Editar perfil** | Navega a pantalla de edición de perfil. |
| **Privacidad** | Navega a configuración de privacidad. |
| **Mis visitas** | Navega a lista de visitas planificadas. |
| **Mis matches** | Navega a lista de matches. |
| **Cerrar sesión** | Muestra confirmación. Si acepta: limpia tokens, cierra sesión y vuelve a login. |

---

### 6.2 Editar Perfil

**¿Qué hace?**: Permite modificar información personal del usuario.

**Campos**:

| Campo | ¿Qué es? | ¿Qué hace? | Validación |
|-------|----------|------------|------------|
| **Foto de perfil** | Avatar | Presionar para cambiar foto (cámara, galería o remover). | Opcional. Máx 5MB. |
| **Nombre** | Nombre completo | Usuario edita su nombre. | Requerido. 2-50 caracteres, solo letras y espacios. |
| **Email** | Correo electrónico | Solo lectura (no editable, viene de Google). | - |
| **Bio** | Descripción personal | Textarea para que el usuario escriba sobre sí mismo. | Opcional. Máx 500 caracteres. |
| **Ubicación** | Ciudad/zona | Usuario escribe su ubicación. | Opcional. Máx 100 caracteres. |
| **Teléfono** | Número de contacto | Usuario escribe su teléfono. | Opcional. Formato: +XX XXX XXX XXXX |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Guardar cambios** | Valida campos. Envía actualización al backend. Si es exitoso, actualiza datos en Redux y muestra toast de éxito. Vuelve a perfil. |
| **Cancelar** | Descarta cambios y vuelve a perfil. |

---

### 6.3 Configuración de Privacidad

**¿Qué hace?**: Control detallado de privacidad y gestión de datos.

**Privacidad del Perfil (Switches)**:

| Switch | ¿Qué es? | ¿Qué hace? |
|--------|----------|------------|
| **Visibilidad del perfil** | Control de quién ve tu perfil | ON: Todos pueden ver tu perfil. OFF: Solo tus matches te ven. |
| **Mostrar ubicación** | Control de ubicación | ON: Otros ven tu distancia aproximada. OFF: Ubicación privada. |
| **Mostrar última conexión** | Control de actividad | ON: Otros ven cuándo estuviste activo. OFF: "Última vez" oculto. |

**Privacidad de Comunicación (Switches)**:

| Switch | ¿Qué es? | ¿Qué hace? |
|--------|----------|------------|
| **Permitir mensajes** | Control de mensajería | ON: Matches pueden enviarte mensajes. OFF: Mensajes deshabilitados. |
| **Aparecer en descubrimiento** | Control de visibilidad en matches | ON: Apareces en sugerencias. OFF: No te muestran a otros usuarios. |

**Privacidad de Datos (Switches)**:

| Switch | ¿Qué es? | ¿Qué hace? |
|--------|----------|------------|
| **Recopilación de datos** | Análisis de uso | ON: Permite analytics. OFF: Desactiva tracking. |
| **Compartir ubicación** | Servicios basados en ubicación | ON: Usa GPS para funciones. OFF: Sin acceso a ubicación. |

**Gestión de Datos**:

| Opción | ¿Qué hace? |
|--------|------------|
| **Exportar mis datos** | Muestra confirmación. Backend genera archivo ZIP con todos tus datos (perfil, mensajes, visitas, etc.) y lo envía por email. |
| **Eliminar cuenta** | Muestra doble confirmación (dos alertas). Si confirma ambas, elimina permanentemente la cuenta y todos los datos asociados. Vuelve a login. |

---

## 7. Gestión de Visitas

### 7.1 Mis Visitas

**¿Qué hace?**: Lista todas las visitas planificadas del usuario (próximas, pasadas o todas).

**Filtros (Tabs)**:

| Tab | ¿Qué muestra? |
|-----|---------------|
| **Próximas** | Visitas de hoy en adelante |
| **Pasadas** | Visitas anteriores a hoy |
| **Todas** | Todas las visitas sin filtro |

**Información de Visita**:

| Elemento | ¿Qué es? |
|----------|----------|
| **Nombre del parque** | A qué parque es la visita |
| **Fecha** | "Viernes, 20 de enero" |
| **Hora y duración** | "16:00 • 1h 30min" |
| **Notas** | Notas adicionales (si las hay) |

**Botones y Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Eliminar (en próximas)** | Muestra dialog de confirmación. Si acepta, cancela la visita, la elimina del backend y de la lista. |
| **Pull to refresh** | Recarga lista de visitas. |
| **Explorar parques (empty state)** | Si no hay visitas, botón navega a lista de parques. |

---

## 8. Panel de Administración

### 8.1 Panel Admin

**¿Qué hace?**: Dashboard exclusivo para administradores con estadísticas del sistema.

**Restricción de Acceso**:
- Solo usuarios con `is_admin=true` pueden acceder
- Si no es admin, redirige automáticamente

**Estadísticas Mostradas**:

| Métrica | ¿Qué es? |
|---------|----------|
| **Total de usuarios** | Cantidad total de usuarios registrados |
| **Usuarios activos** | Usuarios activos en la última semana |
| **Total de parques** | Parques registrados en el sistema |
| **Total de visitas** | Visitas planificadas (todas) |
| **Total de matches** | Matches creados |
| **Reportes pendientes** | Reportes de usuarios sin revisar (con badge rojo) |

**Opciones de Gestión**:

| Opción | ¿Qué hace? |
|--------|------------|
| **Gestión de usuarios** | Navega a pantalla de gestión de usuarios (TODO) |
| **Gestión de parques** | Navega a pantalla de gestión de parques (TODO) |
| **Gestión de reportes** | Navega a pantalla de reportes (TODO) |
| **Analytics** | Navega a dashboard de analytics (TODO) |
| **Configuración del sistema** | Navega a settings del sistema (TODO) |
| **Backup** | Muestra confirmación. Si acepta, inicia backup completo del sistema. |

**Botones de Acciones**:

| Botón | ¿Qué hace? |
|-------|------------|
| **Refrescar stats** | Recarga estadísticas desde el backend. |
| **Volver** | Regresa a pantalla principal. |

---

## Resumen de Convenciones

### Tipos de Campos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Input de texto** | Usuario escribe texto libremente | Nombre, bio, notas |
| **Selector numérico** | Usuario selecciona número con picker | Edad |
| **Dropdown** | Usuario selecciona de lista predefinida | Raza del perro |
| **Textarea** | Input multilinea para textos largos | Bio, notas, mensajes |
| **Date picker** | Calendario nativo para seleccionar fecha | Fecha de visita |
| **Time picker** | Reloj nativo para seleccionar hora | Hora de visita |
| **Switch** | Toggle ON/OFF para opciones binarias | Dark mode, privacidad |
| **Checkbox** | Selección múltiple | Intereses, filtros |
| **Image picker** | Selector de foto con opciones cámara/galería | Avatar, foto de perro |

### Validaciones Comunes

| Tipo | Regla | Mensaje |
|------|-------|---------|
| **Requerido** | Campo no puede estar vacío | "Este campo es requerido" |
| **Longitud mínima** | Min N caracteres | "Muy corto (mín N caracteres)" |
| **Longitud máxima** | Max N caracteres | "Muy largo (máx N caracteres)" |
| **Formato de email** | formato@dominio.com | "Email inválido" |
| **Formato de teléfono** | +XX XXX XXX XXXX | "Formato de teléfono inválido" |
| **Solo letras** | Únicamente caracteres alfabéticos | "Solo letras permitidas" |
| **Alfanumérico** | Letras y números | "Solo letras y números" |
| **Único** | No debe existir en BD | "Ya existe / no disponible" |
| **Rango numérico** | Entre min y max | "Debe estar entre X e Y" |
| **Tamaño de archivo** | Max X MB | "Archivo muy grande (máx X MB)" |
| **Fecha futura** | Debe ser hoy o después | "Selecciona una fecha futura" |

### Tipos de Acciones

| Tipo | Descripción | Comportamiento |
|------|-------------|----------------|
| **Navegación** | Lleva a otra pantalla | Cambia de pantalla, puede pasar datos |
| **Guardado** | Persiste datos | Envía a backend/AsyncStorage, muestra confirmación |
| **Validación** | Verifica datos | Muestra errores si falla, permite continuar si pasa |
| **Carga** | Obtiene datos | Muestra loading, actualiza UI con datos |
| **Confirmación** | Requiere doble check | Muestra alert antes de acción destructiva |
| **Actualización en tiempo real** | WebSocket | Actualiza UI automáticamente sin recargar |

### Estados de la UI

| Estado | ¿Cuándo? | ¿Qué muestra? |
|--------|----------|---------------|
| **Loading** | Cargando datos | Skeleton placeholders o spinner |
| **Empty** | Sin datos para mostrar | Mensaje + ilustración + CTA |
| **Error** | Falló una operación | Mensaje de error + botón "Reintentar" |
| **Success** | Operación exitosa | Toast de confirmación |
| **Normal** | Con datos | Contenido normal de la pantalla |

---

## Fin del Documento

Este documento sirve como guía de referencia rápida para entender qué hace cada funcionalidad, campo y acción en la aplicación ParkDog Mobile.

Para especificaciones técnicas completas, consultar `MOBILE_FUNCTIONAL_SPECIFICATIONS.md`.

**Última actualización**: Enero 2025
**Versión**: 1.0
