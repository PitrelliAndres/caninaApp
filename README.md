# 🐕 ParkDog - Conecta con otros dueños de perros

ParkDog es una aplicación web que permite a los dueños de perros conectar entre sí, registrar visitas a parques y hacer match basado en intereses comunes y horarios compatibles.

## 🚀 Características Principales

- **Autenticación con Google OAuth2**: Login seguro sin contraseñas
- **Onboarding de 3 pasos**: Perfil usuario, mascota y preferencias
- **Registro de visitas**: Agenda tus visitas a parques
- **Sistema de matches**: Encuentra otros dueños compatibles
- **Chat en tiempo real**: Comunícate con tus matches
- **Perfiles detallados**: Información sobre usuarios y sus mascotas
- **Modo oscuro/claro**: Interfaz adaptable
- **100% Responsive**: Funciona en móvil y desktop

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15.2**: Framework React con App Router
- **Redux Toolkit**: Gestión de estado global
- **shadcn/ui**: Componentes UI accesibles
- **Tailwind CSS**: Estilos utility-first
- **Socket.io Client**: WebSockets para chat
- **React OAuth Google**: Autenticación con Google

### Backend
- **Flask 3.0**: Framework web Python
- **PostgreSQL**: Base de datos relacional
- **SQLAlchemy**: ORM para Python
- **Flask-SocketIO**: WebSockets en Flask
- **JWT**: Autenticación basada en tokens
- **Docker**: Containerización

## 📋 Requisitos Previos

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Docker y Docker Compose (opcional)
- Cuenta de Google Cloud para OAuth2

## 🔧 Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/parkdog.git
cd parkdog
```

### 2. Configurar Google OAuth2

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Agregar URIs autorizadas:
   - Desarrollo: `http://localhost:3000`
   - Producción: `https://tu-dominio.com`

### 3. Variables de entorno

Crear archivo `.env` en la raíz:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 4. Opción A: Instalación con Docker (Recomendado)

```bash
# Construir y ejecutar
docker-compose up --build

# En otra terminal, ejecutar seeds
docker-compose exec backend python scripts/seed_data.py
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. Opción B: Instalación Manual

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear base de datos
createdb parkdog

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
flask db upgrade

# Ejecutar seeds
python scripts/seed_data.py

# Iniciar servidor
python run.py
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu GOOGLE_CLIENT_ID

# Iniciar servidor de desarrollo
pnpm dev
```

## 📱 Uso de la Aplicación

### Flujo de Usuario

1. **Login**: Inicia sesión con tu cuenta de Google
2. **Onboarding**: Completa tu perfil en 3 pasos
3. **Explorar Parques**: Busca parques por barrio
4. **Registrar Visitas**: Agenda cuándo irás al parque
5. **Matches**: Descubre otros usuarios compatibles
6. **Chat**: Comunícate con tus matches
7. **Perfil**: Gestiona tu información y privacidad

### Usuarios de Prueba

Si ejecutaste los seeds, puedes usar estos usuarios demo:

- maria.gonzalez@example.com (Free)
- carlos.rodriguez@example.com (Premium)
- admin@parkdog.com (Admin)

## 🚀 Deploy en Producción

### Backend en Render.com

1. Crear cuenta en [Render](https://render.com)
2. Conectar repositorio GitHub
3. Crear nuevo Web Service
4. Configurar:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn wsgi:app`
5. Agregar variables de entorno
6. Crear base de datos PostgreSQL
7. Conectar base de datos al servicio

### Frontend en Vercel

1. Instalar Vercel CLI: `pnpm add -g vercel`
2. En la carpeta frontend: `vercel`
3. Seguir las instrucciones
4. Configurar variables de entorno en Vercel Dashboard

### Base de Datos en Producción

```bash
# Conectar a la DB de producción
psql $DATABASE_URL

# Ejecutar migraciones
flask db upgrade

# Ejecutar seeds (opcional)
python scripts/seed_data.py
```

## 🧪 Testing

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
pnpm run test
```

## 📚 Documentación API

### Autenticación

- `POST /api/auth/google` - Login con Google
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refrescar token

### Usuarios

- `GET /api/users/me` - Perfil completo
- `PUT /api/users/:id` - Actualizar perfil
- `DELETE /api/users/:id` - Eliminar cuenta

### Parques

- `GET /api/parks` - Listar parques
- `GET /api/parks/:id` - Detalle de parque

### Visitas

- `GET /api/visits` - Mis visitas
- `POST /api/visits` - Crear visita
- `DELETE /api/visits/:id` - Cancelar visita

### Matches

- `GET /api/matches/suggestions` - Sugerencias
- `POST /api/matches` - Crear match
- `GET /api/matches/mutual` - Matches mutuos

### Mensajes

- `GET /api/messages/conversations` - Conversaciones
- `GET /api/messages/chats/:id/messages` - Mensajes
- `POST /api/messages/chats/:id/messages` - Enviar mensaje

## 🐛 Solución de Problemas

### "Cannot connect to database"

```bash
# Verificar PostgreSQL está corriendo
sudo service postgresql status

# Crear base de datos
createdb parkdog
```

### "Module not found"

```bash
# Backend
pip install -r requirements.txt

# Frontend  
pnpm install
```

### "Google OAuth error"

- Verificar CLIENT_ID y CLIENT_SECRET
- Agregar URL local a origenes autorizados
- Limpiar cookies y caché del navegador

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Tu Nombre** - *Desarrollo Full Stack* - [GitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- shadcn/ui por los componentes
- Vercel y Render por el hosting
- La comunidad de Next.js y Flask

---

Hecho con ❤️ y ☕ para la comunidad de amantes de los perros 🐕