#!/bin/bash

# Script de Otimizações para Instâncias com Recursos Limitados
# Autor: Manus AI
# Data: $(date)

set -e  # Parar o script se houver qualquer erro

echo "=========================================="
echo "OTIMIZAÇÕES PARA RECURSOS LIMITADOS"
echo "=========================================="

echo "Aplicando otimizações específicas para instâncias com 512MB RAM..."

# 1. Configurar limites de memória para processos
echo "Configurando limites de memória..."

# Criar arquivo de configuração para limites
sudo tee /etc/security/limits.d/99-memory-limits.conf > /dev/null << EOF
# Limites de memória para otimização em instâncias pequenas
* soft memlock 64
* hard memlock 64
* soft nproc 1024
* hard nproc 2048
EOF

# 2. Otimizar configurações do kernel
echo "Otimizando parâmetros do kernel..."

sudo tee -a /etc/sysctl.conf > /dev/null << EOF

# Otimizações para instâncias com pouca RAM
# Reduzir uso de cache de página
vm.dirty_ratio = 5
vm.dirty_background_ratio = 2

# Otimizar gerenciamento de memória
vm.overcommit_memory = 1
vm.overcommit_ratio = 50

# Reduzir tempo de limpeza de cache
vm.dirty_expire_centisecs = 1500
vm.dirty_writeback_centisecs = 500

# Otimizar TCP para conexões limitadas
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 1000
net.ipv4.tcp_max_syn_backlog = 1024
EOF

# Aplicar as configurações
sudo sysctl -p

# 3. Configurar logrotate para evitar acúmulo de logs
echo "Configurando rotação de logs..."

sudo tee /etc/logrotate.d/analise-dividendos > /dev/null << EOF
/var/log/nginx/analise_dividendos_*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 www-data adm
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# 4. Configurar cron para limpeza automática
echo "Configurando limpeza automática..."

# Criar script de limpeza
sudo tee /usr/local/bin/cleanup-system.sh > /dev/null << 'EOF'
#!/bin/bash
# Script de limpeza automática

# Limpar cache de pacotes
apt-get clean

# Limpar logs antigos
journalctl --vacuum-time=7d

# Limpar arquivos temporários
find /tmp -type f -atime +7 -delete 2>/dev/null || true

# Limpar cache do pip se existir
if [ -d "/home/ubuntu/.cache/pip" ]; then
    rm -rf /home/ubuntu/.cache/pip/*
fi

# Limpar cache do npm se existir
if [ -d "/home/ubuntu/.npm" ]; then
    npm cache clean --force 2>/dev/null || true
fi

echo "$(date): Limpeza automática executada" >> /var/log/cleanup.log
EOF

sudo chmod +x /usr/local/bin/cleanup-system.sh

# Adicionar ao cron para executar semanalmente
(crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/cleanup-system.sh") | crontab -

# 5. Configurar monitoramento básico de recursos
echo "Configurando monitoramento básico..."

sudo tee /usr/local/bin/monitor-resources.sh > /dev/null << 'EOF'
#!/bin/bash
# Script de monitoramento básico de recursos

LOG_FILE="/var/log/resource-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Obter informações de memória
MEM_USAGE=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100.0}')
SWAP_USAGE=$(free | awk '/^Swap:/ {if($2>0) printf "%.1f", $3/$2 * 100.0; else print "0.0"}')

# Obter informações de CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

# Obter informações de disco
DISK_USAGE=$(df / | awk 'NR==2 {printf "%.1f", $3/$2 * 100.0}')

# Verificar se algum serviço crítico está parado
BACKEND_STATUS=$(systemctl is-active analise_dividendos_backend 2>/dev/null || echo "inactive")
NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "inactive")

# Log das informações
echo "$TIMESTAMP - MEM: ${MEM_USAGE}% | SWAP: ${SWAP_USAGE}% | CPU: ${CPU_USAGE}% | DISK: ${DISK_USAGE}% | Backend: $BACKEND_STATUS | Nginx: $NGINX_STATUS" >> $LOG_FILE

# Alertas básicos (log apenas)
if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
    echo "$TIMESTAMP - ALERTA: Uso de memória alto (${MEM_USAGE}%)" >> $LOG_FILE
fi

if (( $(echo "$DISK_USAGE > 85" | bc -l) )); then
    echo "$TIMESTAMP - ALERTA: Uso de disco alto (${DISK_USAGE}%)" >> $LOG_FILE
fi

if [ "$BACKEND_STATUS" != "active" ]; then
    echo "$TIMESTAMP - ALERTA: Backend não está ativo" >> $LOG_FILE
fi

if [ "$NGINX_STATUS" != "active" ]; then
    echo "$TIMESTAMP - ALERTA: Nginx não está ativo" >> $LOG_FILE
fi
EOF

sudo chmod +x /usr/local/bin/monitor-resources.sh

# Adicionar ao cron para executar a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-resources.sh") | crontab -

# 6. Instalar htop para monitoramento manual
echo "Instalando ferramentas de monitoramento..."
sudo apt install -y htop iotop

echo ""
echo "=========================================="
echo "OTIMIZAÇÕES APLICADAS COM SUCESSO!"
echo "=========================================="
echo ""
echo "📊 Otimizações aplicadas:"
echo "   ✓ Limites de memória configurados"
echo "   ✓ Parâmetros do kernel otimizados"
echo "   ✓ Rotação de logs configurada"
echo "   ✓ Limpeza automática semanal"
echo "   ✓ Monitoramento básico a cada 5 minutos"
echo "   ✓ Ferramentas de monitoramento instaladas (htop, iotop)"
echo ""
echo "📋 Comandos úteis para monitoramento:"
echo "   - htop                    # Monitor interativo de processos"
echo "   - iotop                   # Monitor de I/O de disco"
echo "   - tail -f /var/log/resource-monitor.log  # Logs de monitoramento"
echo "   - tail -f /var/log/cleanup.log           # Logs de limpeza"
echo ""
echo "🔧 Arquivos de configuração criados:"
echo "   - /etc/security/limits.d/99-memory-limits.conf"
echo "   - /etc/logrotate.d/analise-dividendos"
echo "   - /usr/local/bin/cleanup-system.sh"
echo "   - /usr/local/bin/monitor-resources.sh"
echo ""
echo "⚙️ As otimizações estão ativas e serão executadas automaticamente."
echo "=========================================="
