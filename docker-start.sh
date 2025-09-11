#!/bin/bash

# Script para iniciar la aplicación Docker

echo "=========================================="
echo "INICIANDO APLICACIÓN DOCKER"
echo "=========================================="

# Verificar si existe el archivo de variables de entorno
if [ ! -f "env.docker" ]; then
    echo "❌ Error: No se encontró el archivo env.docker"
    exit 1
fi

# Copiar variables de entorno
echo "📋 Copiando variables de entorno..."
cp env.docker .env

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker compose up -d

echo "=========================================="
echo "✅ SERVICIOS INICIADOS"
echo "=========================================="
if [ "$HTTPS_ENABLED" = "true" ]; then
    echo "🌐 URL: https://localhost:443"
    echo "📊 API Docs: https://localhost:443/api"
else
    echo "🌐 URL: http://localhost:3000"
    echo "📊 API Docs: http://localhost:3000/api"
fi
echo "🗄️ MySQL: localhost:3306"
echo "=========================================="

# Mostrar estado de contenedores
echo "📋 Estado de contenedores:"
docker compose ps
