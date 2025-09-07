#!/bin/bash

# Script para ver logs de la aplicación Docker

echo "=========================================="
echo "LOGS DE APLICACIÓN DOCKER"
echo "=========================================="

# Mostrar logs
echo "📋 Mostrando logs en tiempo real..."
echo "Presiona Ctrl+C para salir"
echo "=========================================="

docker compose logs -f
