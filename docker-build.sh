#!/bin/bash

# Script para construir y ejecutar la aplicación con Docker

echo "=========================================="
echo "CONSTRUCCIÓN Y EJECUCIÓN DOCKER"
echo "=========================================="

# Verificar si existe el archivo de variables de entorno
if [ ! -f "env.docker" ]; then
    echo "❌ Error: No se encontró el archivo env.docker"
    echo "Por favor, crea el archivo env.docker con las variables de entorno"
    exit 1
fi

# Copiar variables de entorno
echo "📋 Copiando variables de entorno..."
cp env.docker .env

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker-compose build

# Ejecutar migraciones y seeders
echo "🗄️ Ejecutando migraciones..."
docker-compose run --rm app npm run migration:run

echo "🌱 Ejecutando seeders..."
docker-compose run --rm app npm run seed:run

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

echo "=========================================="
echo "✅ APLICACIÓN INICIADA EXITOSAMENTE"
echo "=========================================="
echo "🌐 URL: http://localhost:3000"
echo "📊 API Docs: http://localhost:3000/api"
echo "🗄️ MySQL: localhost:3306"
echo "=========================================="

# Mostrar logs
echo "📋 Mostrando logs..."
docker-compose logs -f
