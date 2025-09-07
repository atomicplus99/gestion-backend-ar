#!/bin/bash

# Script para configurar la aplicación Docker siguiendo el flujo correcto

echo "=========================================="
echo "CONFIGURACIÓN DOCKER - FLUJO COMPLETO"
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

# PASO 1: Construir la imagen
echo "🔨 PASO 1: Construyendo imagen Docker..."
docker compose build

# PASO 2: Iniciar solo MySQL
echo "🗄️ PASO 2: Iniciando MySQL..."
docker compose up -d mysql

# Esperar a que MySQL esté listo
echo "⏳ Esperando a que MySQL esté listo..."
sleep 30

# PASO 3: Generar migraciones
echo "📝 PASO 3: Generando migraciones..."
docker compose run --rm app npm run migration:generate

# PASO 4: Ejecutar migraciones
echo "🚀 PASO 4: Ejecutando migraciones..."
docker compose run --rm app npm run migration:run

# PASO 5: Ejecutar seeders
echo "🌱 PASO 5: Ejecutando seeders..."
docker compose run --rm app npm run seed:run

# PASO 6: Iniciar la aplicación
echo "🚀 PASO 6: Iniciando aplicación..."
docker compose up -d app

echo "=========================================="
echo "✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE"
echo "=========================================="
echo "🌐 URL: https://localhost:443"
echo "📊 API Docs: https://localhost:443/api"
echo "🗄️ MySQL: localhost:3306"
echo "=========================================="

# Mostrar estado de contenedores
echo "📋 Estado de contenedores:"
docker compose ps

# Mostrar logs
echo "📋 Mostrando logs..."
docker compose logs -f
