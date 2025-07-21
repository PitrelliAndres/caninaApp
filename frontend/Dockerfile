FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copiar package.json y lockfile
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias (incluyendo i18next-browser-languagedetector)
RUN pnpm install

# Copiar el resto del código
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]