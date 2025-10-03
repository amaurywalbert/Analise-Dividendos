#!/bin/bash

# Script de Deploy Automatizado para o Frontend do Sistema de Análise de Dividendos
# Autor: Manus AI
# Data: $(date)

set -e  # Parar o script se houver qualquer erro

echo "=========================================="
echo "Deploy do Frontend - Sistema Análise de Dividendos"
echo "=========================================="

# Variáveis de configuração
DEPLOY_DIR="/home/ubuntu/Analise-Dividendos"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
NGINX_SITE_NAME="analise_dividendos"

#!/bin/bash

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

#echo "🔧 Removendo instalações anteriores de Node.js e npm..."
#sudo apt remove --purge -y nodejs npm
#sudo apt autoremove -y

#echo "🧹 Limpando diretórios residuais..."
#sudo rm -rf /usr/lib/node_modules/npm
#sudo rm -rf /usr/lib/node_modules/.npm-*
#sudo rm -rf /usr/local/lib/node_modules
#sudo rm -rf /usr/local/bin/npm
#sudo rm -rf /usr/local/bin/node
#sudo rm -rf ~/.npm
#sudo rm -rf ~/.nvm

# Verificar se o Node.js está instalado e na versão correta
if ! command_exists node || ! node -v | grep -q "v20"; then
    echo "Instalando Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Atualizar npm para a versão mais recente
echo "Atualizando npm..."
sudo npm install -g npm@latest

echo "✅ Versões instaladas:"
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"


# Verificar se o Nginx está instalado
if ! command_exists nginx; then
    echo "Instalando Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Verificar se o diretório do projeto existe
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Erro: Diretório do frontend não encontrado em $FRONTEND_DIR"
    echo "Execute primeiro o script de deploy do backend para clonar o repositório."
    exit 1
fi

# Navegar para o diretório do frontend
cd "$FRONTEND_DIR"

# Remover a dependência problemática do package.json
echo "Removendo dependência 'ui: github:shadcn/ui' do package.json..."
sed -i "/\"ui\": \"github:shadcn\/ui\"/d" package.json

# Instalar dependências do Node.js com mais memória
echo "Instalando dependências do Node.js..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm install

# Realizar o build de produção com mais memória
echo "Realizando build de produção..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build

# Verificar se o build foi criado
BUILD_DIR="$FRONTEND_DIR/dist"
if [ ! -d "$BUILD_DIR" ]; then
    # Tentar com \'build\' se \'dist\' não existir
    BUILD_DIR="$FRONTEND_DIR/build"
    if [ ! -d "$BUILD_DIR" ]; then
        echo "Erro: Diretório de build não encontrado. Verifique a configuração do Vite/React."
        exit 1
    fi
fi

echo "Build encontrado em: $BUILD_DIR"

# Remover configuração padrão do Nginx se existir
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "Removendo configuração padrão do Nginx..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Criar configuração do Nginx
echo "Criando configuração do Nginx..."
sudo tee /etc/nginx/sites-available/$NGINX_SITE_NAME > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Configuração para servir arquivos estáticos do frontend
    location / {
        root $BUILD_DIR;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para arquivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy reverso para a API do backend
    location /api/ {
        proxy_pass http://unix:/home/ubuntu/Analise-Dividendos/backend/gunicorn.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configurações de segurança básicas
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src \'self\' http: https: data: blob: \'unsafe-inline\'" always;

    # Logs
    access_log /var/log/nginx/analise_dividendos_access.log;
    error_log /var/log/nginx/analise_dividendos_error.log;
}
EOF

# Criar link simbólico para habilitar o site
echo "Habilitando configuração do Nginx..."
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE_NAME /etc/nginx/sites-enabled/

# Testar configuração do Nginx
echo "Testando configuração do Nginx..."
sudo nginx -t

# Reiniciar Nginx
echo "Reiniciando Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verificar status do Nginx
echo "Verificando status do Nginx..."
sudo systemctl status nginx --no-pager

# Mostrar informações finais
echo "=========================================="
echo "Deploy do Frontend concluído!"
echo ""
echo "Arquivos servidos de: $BUILD_DIR"
echo "Configuração do Nginx: /etc/nginx/sites-available/$NGINX_SITE_NAME"
echo ""
echo "Para verificar logs do Nginx:"
echo "  - Acesso: sudo tail -f /var/log/nginx/analise_dividendos_access.log"
echo "  - Erro: sudo tail -f /var/log/nginx/analise_dividendos_error.log"
echo ""
echo "Para testar a aplicação, acesse o IP público da sua instância Lightsail."
echo "=========================================="
