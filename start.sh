#!/bin/bash
# Script de inicio rápido para ParkDog

echo "🐕 ParkDog - Inicio Rápido"
echo "=========================="

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Función para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 no está instalado${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 instalado${NC}"
        return 0
    fi
}

echo -e "${BLUE}📋 Verificando prerrequisitos...${NC}"
check_command docker

if [ $? -eq 0 ]; then
    echo -e "${BLUE}🐳 Iniciando con Docker...${NC}"
    
    # Verificar si existe .env
    if [ ! -f .env ]; then
        echo -e "${BLUE}Creando archivo .env...${NC}"
        echo "GOOGLE_CLIENT_ID=temp-client-id" > .env
        echo "GOOGLE_CLIENT_SECRET=temp-secret" >> .env
    fi
    
    docker-compose up
else
    echo -e "${BLUE}🔧 Iniciando sin Docker...${NC}"
    
    # Backend
    echo -e "${BLUE}Iniciando Backend...${NC}"
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate || . venv/Scripts/activate
    pip install -r requirements.txt
    python run.py &
    BACKEND_PID=$!
    cd ..
    
    # Frontend
    echo -e "${BLUE}Iniciando Frontend...${NC}"
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "${GREEN}✅ Aplicación iniciada!${NC}"
    echo -e "${BLUE}📱 Abre: http://localhost:3000${NC}"
    
    wait $BACKEND_PID $FRONTEND_PID
fi
