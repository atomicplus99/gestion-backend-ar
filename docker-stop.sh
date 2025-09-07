#!/bin/bash

# Script para detener la aplicación Docker

echo "=========================================="
echo "DETENIENDO APLICACIÓN DOCKER"
echo "=========================================="

# Detener servicios
echo "🛑 Deteniendo servicios..."
docker compose down

echo "=========================================="
echo "✅ SERVICIOS DETENIDOS"
echo "=========================================="

# Mostrar estado de contenedores
echo "📋 Estado de contenedores:"
docker compose ps
