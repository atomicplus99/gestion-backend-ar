# Dockerfile para aplicación NestJS
FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    mysql-client

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Crear directorio para logs
RUN mkdir -p logs

# Crear directorio para certificados SSL
RUN mkdir -p ssl

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:prod"]
