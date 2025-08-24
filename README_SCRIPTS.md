# Scripts de Build y Deploy

## Scripts Creados

### 1. Build y Deploy Full Stack (Docker)

#### Windows: `build-deploy.bat`
```bash
# Build y deploy completo
.\build-deploy.bat full

# Solo build
.\build-deploy.bat build

# Solo deploy (sin build)
.\build-deploy.bat deploy

# Ver logs
.\build-deploy.bat logs

# Parar servicios
.\build-deploy.bat stop

# Limpiar todo (containers e imágenes)
.\build-deploy.bat clean
```

#### Linux/Mac: `build-deploy.sh`
```bash
# Build y deploy completo
./build-deploy.sh full

# Solo build
./build-deploy.sh build

# Solo deploy (sin build)
./build-deploy.sh deploy

# Ver logs
./build-deploy.sh logs

# Parar servicios
./build-deploy.sh stop

# Limpiar todo (containers e imágenes)
./build-deploy.sh clean
```

### 2. Build y Deploy Mobile

#### Windows: `mobile-build.bat`
```bash
# Desarrollo - Expo dev server
.\mobile-build.bat dev

# Run en Android
.\mobile-build.bat android

# Run en iOS
.\mobile-build.bat ios

# Build de producción (EAS)
.\mobile-build.bat build

# Prebuild (generar código nativo)
.\mobile-build.bat prebuild

# Instalar dependencias
.\mobile-build.bat install

# Clean install
.\mobile-build.bat clean
```

#### Linux/Mac: `mobile-build.sh`
```bash
# Desarrollo - Expo dev server
./mobile-build.sh dev

# Run en Android
./mobile-build.sh android

# Run en iOS
./mobile-build.sh ios

# Build de producción (EAS)
./mobile-build.sh build

# Prebuild (generar código nativo)
./mobile-build.sh prebuild

# Instalar dependencias
./mobile-build.sh install

# Clean install
./mobile-build.sh clean
```

## Configuración para que Claude use Docker

### Ver: `DOCKER_SETUP.md`

Agrega estas líneas al final de tu `CLAUDE.md`:

```markdown
## Development Environment Rules for Claude

### Docker First Policy
- ALWAYS use Docker containers instead of running services directly
- NEVER run `pnpm dev`, `python run.py`, or similar commands directly
- ALWAYS use `docker-compose up` for development
- Use the provided scripts: `build-deploy.bat/sh` and `mobile-build.bat/sh`
```

## Servicios Docker

Una vez levantados con `./build-deploy.sh full`:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000  
- **Database**: localhost:5432 (postgres/password)
- **Redis**: localhost:6379

## Comandos Docker Útiles

```bash
# Ver servicios corriendo
docker-compose ps

# Logs de servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Ejecutar comando en container
docker-compose exec backend bash
docker-compose exec frontend bash

# Rebuild un servicio específico
docker-compose build backend
docker-compose up -d backend

# Ver uso de recursos
docker stats
```

## Variables de Entorno

Crea `.env` en la raíz:

```env
POSTGRES_DB=parkdog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@db:5432/parkdog

FRONTEND_URL=http://frontend:3000
BACKEND_URL=http://backend:5000

JWT_SECRET_KEY=dev-secret-key
JWT_ACCESS_TTL_MIN=120

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

REDIS_URL=redis://redis:6379/0
```

## Estado Actual

✅ **Arreglado**: WebSocket connection - se corrigieron los imports de session en Flask-SocketIO
✅ **Creado**: Scripts de build y deploy para Docker y Mobile
✅ **Creado**: Guía para configurar Claude con Docker
✅ **Arreglado**: Placeholder avatar existente en frontend/public/

### Próximos pasos para usar sin tokens de Claude:

1. Usar `./build-deploy.sh full` en lugar de comandos individuales
2. Usar `./mobile-build.sh dev` para desarrollo móvil
3. Configurar el CLAUDE.md con las reglas Docker para que Claude siempre use contenedores