#!/bin/bash

# Script de Deploy Completo - Sistema de Análise de Dividendos
# Autor: Manus AI
# Data: $(date)

set -e  # Parar o script se houver qualquer erro

echo "=========================================="
echo "DEPLOY COMPLETO - SISTEMA ANÁLISE DE DIVIDENDOS"
echo "=========================================="
echo ""
echo "Este script irá:"
echo "1. Atualizar o sistema Ubuntu"
echo "2. Configurar swap space (2GB)"
echo "3. Fazer deploy do backend (FastAPI)"
echo "4. Fazer deploy do frontend (React)"
echo "5. Configurar Nginx como proxy reverso"
echo ""
echo "Recursos da instância detectados:"
echo "- RAM: $(free -h | awk '/^Mem:/ {print $2}')"
echo "- CPU: $(nproc) vCPUs"
echo "- Disco: $(df -h / | awk 'NR==2 {print $2}') disponível"
echo ""

# Solicitar confirmação do usuário
read -p "Deseja continuar com o deploy? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Deploy cancelado pelo usuário."
    exit 0
fi

echo ""
echo "=========================================="
echo "ETAPA 1: Atualizando o sistema..."
echo "=========================================="

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar pacotes essenciais
echo "Instalando pacotes essenciais..."
sudo apt install -y git python3-pip python3-venv nginx curl software-properties-common

echo ""
echo "=========================================="
echo "ETAPA 2: Configurando Swap Space..."
echo "=========================================="

# Executar script de configuração do swap
if [ -f "/home/ubuntu/setup_swap.sh" ]; then
    /home/ubuntu/setup_swap.sh
else
    echo "Erro: Script setup_swap.sh não encontrado!"
    exit 1
fi

echo ""
echo "=========================================="
echo "ETAPA 3: Deploy do Backend..."
echo "=========================================="

# Executar script de deploy do backend
if [ -f "/home/ubuntu/deploy_backend.sh" ]; then
    /home/ubuntu/deploy_backend.sh
else
    echo "Erro: Script deploy_backend.sh não encontrado!"
    exit 1
fi

echo ""
echo "=========================================="
echo "ETAPA 4: Deploy do Frontend..."
echo "=========================================="

# Executar script de deploy do frontend
if [ -f "/home/ubuntu/deploy_frontend.sh" ]; then
    /home/ubuntu/deploy_frontend.sh
else
    echo "Erro: Script deploy_frontend.sh não encontrado!"
    exit 1
fi

echo ""
echo "=========================================="
echo "ETAPA 5: Verificações Finais..."
echo "=========================================="

# Verificar status dos serviços
echo "Status dos serviços:"
echo ""

echo "Backend (Gunicorn):"
sudo systemctl status analise_dividendos_backend --no-pager -l

echo ""
echo "Frontend (Nginx):"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Uso atual de recursos:"
free -h
echo ""
df -h /

echo ""
echo "=========================================="
echo "DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=========================================="
echo ""

# Obter IP público da instância (funciona na AWS)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "IP_NAO_DETECTADO")

if [ "$PUBLIC_IP" != "IP_NAO_DETECTADO" ]; then
    echo "🌐 Sua aplicação está disponível em: http://$PUBLIC_IP"
else
    echo "🌐 Sua aplicação está disponível no IP público da sua instância Lightsail"
fi

echo ""
echo "📋 Informações importantes:"
echo "   - Backend rodando na porta Unix socket (gerenciado pelo Gunicorn)"
echo "   - Frontend servido pelo Nginx na porta 80"
echo "   - API acessível através de /api/ (proxy reverso configurado)"
echo ""
echo "🔧 Comandos úteis para monitoramento:"
echo "   - Logs do backend: sudo journalctl -u analise_dividendos_backend -f"
echo "   - Logs do Nginx: sudo tail -f /var/log/nginx/analise_dividendos_error.log"
echo "   - Status dos serviços: sudo systemctl status analise_dividendos_backend nginx"
echo "   - Uso de recursos: htop (instale com: sudo apt install htop)"
echo ""
echo "🚀 Para atualizações futuras:"
echo "   - Backend: execute novamente /home/ubuntu/deploy_backend.sh"
echo "   - Frontend: execute novamente /home/ubuntu/deploy_frontend.sh"
echo ""
echo "=========================================="
