#!/bin/bash

# Script para Configurar Swap Space
# Autor: Manus AI
# Data: $(date)

set -e  # Parar o script se houver qualquer erro

echo "=========================================="
echo "Configuração do Swap Space"
echo "=========================================="

# Variáveis de configuração
SWAP_SIZE="2G"  # Tamanho do swap (pode ser alterado conforme necessário)
SWAP_FILE="/swapfile"

# Verificar se já existe um swap ativo
if swapon --show | grep -q "$SWAP_FILE"; then
    echo "Swap já está configurado e ativo em $SWAP_FILE"
    echo "Informações do swap atual:"
    swapon --show
    free -h
    exit 0
fi

# Verificar espaço disponível em disco
echo "Verificando espaço disponível em disco..."
df -h /

# Criar arquivo de swap
echo "Criando arquivo de swap de $SWAP_SIZE..."
sudo fallocate -l $SWAP_SIZE $SWAP_FILE

# Verificar se o arquivo foi criado corretamente
if [ ! -f "$SWAP_FILE" ]; then
    echo "Erro: Falha ao criar o arquivo de swap"
    exit 1
fi

# Definir permissões corretas
echo "Configurando permissões do arquivo de swap..."
sudo chmod 600 $SWAP_FILE

# Configurar o arquivo como swap
echo "Configurando o arquivo como swap..."
sudo mkswap $SWAP_FILE

# Ativar o swap
echo "Ativando o swap..."
sudo swapon $SWAP_FILE

# Verificar se o swap está ativo
echo "Verificando se o swap está ativo..."
swapon --show

# Tornar o swap persistente após reinicializações
echo "Configurando swap para ser persistente..."
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab
    echo "Entrada adicionada ao /etc/fstab"
else
    echo "Entrada já existe no /etc/fstab"
fi

# Otimizar parâmetros de swap
echo "Otimizando parâmetros de swap..."

# Configurar swappiness (0-100, menor valor = menos uso do swap)
# Para servidor com pouca RAM, um valor baixo (10-20) é recomendado
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Configurar vfs_cache_pressure (padrão é 100)
# Valor mais baixo preserva mais cache de diretórios e inodes
sudo sysctl vm.vfs_cache_pressure=50
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

# Mostrar informações finais do sistema
echo "=========================================="
echo "Configuração do Swap concluída!"
echo ""
echo "Informações do sistema:"
echo "Memória:"
free -h
echo ""
echo "Swap ativo:"
swapon --show
echo ""
echo "Parâmetros configurados:"
echo "  - vm.swappiness=10 (menos agressivo no uso do swap)"
echo "  - vm.vfs_cache_pressure=50 (preserva mais cache)"
echo ""
echo "O swap será ativado automaticamente após reinicializações."
echo "=========================================="
