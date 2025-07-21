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
