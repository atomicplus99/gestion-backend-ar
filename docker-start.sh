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
docker-compose up -d

echo "=========================================="
echo "✅ SERVICIOS INICIADOS"
echo "=========================================="
echo "🌐 URL: http://localhost:3000"
echo "📊 API Docs: http://localhost:3000/api"
echo "🗄️ MySQL: localhost:3306"
echo "=========================================="

# Mostrar estado de contenedores
echo "📋 Estado de contenedores:"
docker-compose ps
