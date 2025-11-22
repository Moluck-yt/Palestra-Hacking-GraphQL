#!/bin/bash

# Script para monitorar o Docker em tempo real

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔍 GRAPHQL LAB - MONITORING DASHBOARD 🔍             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verifica se o container está rodando
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -E 'graphql.*lab')
if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Container não está rodando!"
    echo ""
    echo "Para iniciar:"
    echo "  docker-compose up -d --build"
    exit 1
fi

echo "📦 Container: $CONTAINER_NAME"

echo "✅ Container rodando!"
echo ""
echo "Escolha uma opção de monitoramento:"
echo ""
echo "1) 📊 Logs em tempo real (básico)"
echo "2) 🔥 Logs com filtro de ALIAS ATTACK"
echo "3) 📈 Logs com contador de operações"
echo "4) 🎯 Logs de OTP (verifyOtp apenas)"
echo "5) 📋 Estatísticas do container"
echo "6) 🔍 Todas as opções (split screen)"
echo ""
read -p "Escolha [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "📊 Monitorando logs em tempo real..."
        echo "   (Ctrl+C para sair)"
        echo ""
        docker logs -f $CONTAINER_NAME
        ;;
    2)
        echo ""
        echo "🔥 Filtrando ALIAS ATTACKS..."
        echo "   (Ctrl+C para sair)"
        echo ""
        docker logs -f $CONTAINER_NAME | grep -E "ALIAS ATTACK|Amplification|aliases"
        ;;
    3)
        echo ""
        echo "📈 Contador de operações..."
        echo "   (Ctrl+C para sair)"
        echo ""
        docker logs -f $CONTAINER_NAME | grep -E "Operation #|TOTAL OPERATIONS"
        ;;
    4)
        echo ""
        echo "🎯 Monitorando OTP..."
        echo "   (Ctrl+C para sair)"
        echo ""
        docker logs -f $CONTAINER_NAME | grep -E "verifyOtp|OTP|Code:"
        ;;
    5)
        echo ""
        echo "📋 Estatísticas do container:"
        echo ""
        docker stats --no-stream $CONTAINER_NAME
        echo ""
        echo "🔄 Atualizando a cada 2 segundos..."
        echo "   (Ctrl+C para sair)"
        echo ""
        docker stats $CONTAINER_NAME
        ;;
    6)
        echo ""
        echo "🔍 Para ver tudo em split, use:"
        echo ""
        echo "Terminal 1 - Logs gerais:"
        echo "  docker logs -f $CONTAINER_NAME"
        echo ""
        echo "Terminal 2 - Stats:"
        echo "  docker stats $CONTAINER_NAME"
        echo ""
        echo "Terminal 3 - Filtro de ataques:"
        echo "  docker logs -f $CONTAINER_NAME | grep 'ALIAS ATTACK'"
        echo ""
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac
