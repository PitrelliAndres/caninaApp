# 🚀 ParkDog Deployment Guide

## 📱 Mobile Deployment

### Development Build (Local APK)
```bash
# Build and install on connected Android device
cd mobile
npx expo run:android

# Alternative: Use our script
./mobile-build.sh android
```

### Production Build (EAS - Manual)
**⚠️ Requires EAS Account Login (done manually)**

```bash
# 1. Login to EAS (do this manually)
eas login

# 2. Build for Android
eas build --platform android

# 3. Build for iOS (requires Apple Developer account)
eas build --platform ios

# 4. Build for both platforms
eas build --platform all
```

### App Store Deployment
```bash
# Android - Google Play Store
eas submit --platform android

# iOS - Apple App Store  
eas submit --platform ios
```

---

## 🌐 Frontend Deployment

### Build for Production
```bash
# Inside Docker container
docker-compose exec frontend pnpm build

# Or locally
cd frontend
pnpm build
```

### Deploy Options

#### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy from frontend directory
cd frontend
vercel

# For production deployment
vercel --prod
```

#### 2. Netlify
```bash
# Build and deploy
cd frontend
pnpm build
# Upload the .next/out folder to Netlify
```

#### 3. Manual Server Deploy
```bash
# Build static files
pnpm build

# Copy files to server
scp -r .next/out/* user@server:/var/www/html/
```

---

## 🐍 Backend Deployment

### Docker Production Build
```bash
# Build production image
docker build -t parkdog-backend:prod ./backend

# Run in production mode
docker run -d \
  -p 5000:5000 \
  --env-file .env.prod \
  parkdog-backend:prod
```

### Deploy Options

#### 1. Railway
```bash
# Install Railway CLI
pnpm add -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### 2. Render
1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python run.py`

#### 3. Heroku
```bash
# Install Heroku CLI
# Create Procfile in backend/
echo "web: python run.py" > backend/Procfile

# Deploy
cd backend
heroku create parkdog-api
git subtree push --prefix=backend heroku main
```

#### 4. VPS/Server Manual Deploy
```bash
# On server
git clone https://github.com/your-repo/parkdog.git
cd parkdog/backend

# Setup environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Setup database
export DATABASE_URL="postgresql://user:pass@localhost/parkdog"
flask db upgrade

# Run with gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## 🐳 Full Stack Docker Deployment

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/parkdog
      - JWT_SECRET_KEY=your-production-secret
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    
  frontend:
    build: ./frontend
    ports:
      - "80:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.parkdog.app
      
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=parkdog
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    
volumes:
  postgres_data:
```

Deploy with:
```bash
# Build and deploy production stack
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🗄️ Database Deployment

### PostgreSQL Production Setup
```bash
# Create production database
sudo -u postgres createdb parkdog_prod

# Run migrations
DATABASE_URL="postgresql://user:pass@localhost/parkdog_prod" flask db upgrade

# Backup database
pg_dump parkdog_prod > backup.sql

# Restore database
psql parkdog_prod < backup.sql
```

### Managed Database Services
- **Heroku Postgres**
- **AWS RDS**
- **Google Cloud SQL**
- **DigitalOcean Managed Databases**

---

## 🔧 Environment Variables

### Production Environment (.env.prod)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/parkdog_prod

# JWT
JWT_SECRET_KEY=super-secure-production-secret-key
JWT_ACCESS_TTL_MIN=15

# Google OAuth
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-secret

# URLs
FRONTEND_URL=https://parkdog.app
BACKEND_URL=https://api.parkdog.app

# Redis
REDIS_URL=redis://redis.parkdog.app:6379/0

# Production flags
FLASK_ENV=production
DEBUG=false
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.parkdog.app
NEXT_PUBLIC_WS_URL=wss://api.parkdog.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Update version numbers in package.json/app.json
- [ ] Set production environment variables
- [ ] Test all functionality locally
- [ ] Run linting and type checking
- [ ] Update database migrations
- [ ] Configure domain names and SSL certificates

### Mobile Deployment
- [ ] Update app version in app.json
- [ ] Build and test APK locally
- [ ] Submit to EAS Build
- [ ] Test on physical devices
- [ ] Submit to app stores (Google Play/Apple App Store)

### Web Deployment  
- [ ] Build frontend for production
- [ ] Deploy backend with production database
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Configure auto-scaling if needed

### Post-Deployment
- [ ] Monitor application logs
- [ ] Test all critical user flows
- [ ] Monitor performance metrics
- [ ] Set up backup schedules
- [ ] Configure alerts for errors

---

## 🔍 Monitoring & Maintenance

### Monitoring Tools
- **Sentry** - Error tracking
- **DataDog** - Application monitoring  
- **LogRocket** - Session replay
- **Uptime Robot** - Uptime monitoring

### Backup Strategy
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Security
- Use HTTPS everywhere
- Rotate JWT secrets regularly
- Monitor for security vulnerabilities
- Keep dependencies updated
- Use environment-specific secrets

---

## 🆘 Troubleshooting

### Common Issues

#### Mobile Build Failures
```bash
# Clear Metro cache
npx expo start --clear

# Reset node_modules  
rm -rf node_modules && pnpm install

# Check Android SDK setup
npx expo doctor
```

#### Frontend Build Issues
```bash
# Clear Next.js cache
rm -rf .next/

# Check TypeScript errors
pnpm type-check

# Build locally to debug
pnpm build
```

#### Backend Deployment Issues
```bash
# Check database connection
flask db current

# View logs
heroku logs --tail  # or relevant platform command

# Test API endpoints
curl https://api.parkdog.app/api/health
```

Need help? Check the logs first, then consult the specific platform documentation!