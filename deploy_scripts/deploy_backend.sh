#!/bin/bash

# Script de Deploy Automatizado para o Backend do Sistema de Análise de Dividendos
# Autor: Manus AI
# Data: $(date)

set -e  # Parar o script se houver qualquer erro

echo "=========================================="
echo "Deploy do Backend - Sistema Análise de Dividendos"
echo "=========================================="

# Variáveis de configuração
REPO_URL="https://github.com/amaurywalbert/Analise-Dividendos.git"
DEPLOY_DIR="/home/ubuntu/Analise-Dividendos"
BACKEND_DIR="$DEPLOY_DIR/backend"
SERVICE_NAME="analise_dividendos_backend"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se o Git está instalado
if ! command_exists git; then
    echo "Instalando Git..."
    sudo apt update
    sudo apt install -y git
fi

# Verificar se o Python3 e pip estão instalados
if ! command_exists python3; then
    echo "Instalando Python3..."
    sudo apt install -y python3 python3-pip python3-venv
fi

# Clonar ou atualizar o repositório
if [ -d "$DEPLOY_DIR" ]; then
    echo "Atualizando repositório existente..."
    cd "$DEPLOY_DIR"
    git pull origin main
else
    echo "Clonando repositório..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
fi

# Navegar para o diretório do backend
cd "$BACKEND_DIR"

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

# Definir caminho para o python e pip do ambiente virtual
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"
VENV_PIP="$BACKEND_DIR/venv/bin/pip"
VENV_ALEMBIC="$BACKEND_DIR/venv/bin/alembic"

# Instalar/atualizar dependências
echo "Instalando dependências..."
$VENV_PIP install --upgrade pip
$VENV_PIP install -r requirements.txt
$VENV_PIP install gunicorn

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "Criando arquivo .env..."
    cat > .env << EOF
DATABASE_URL=sqlite:///./database.db
# Adicione outras variáveis de ambiente conforme necessário
EOF
fi

# Executar migrações do banco de dados
echo "Executando migrações do banco de dados..."
$VENV_ALEMBIC upgrade head

# Criar script de inicialização do Gunicorn
echo "Criando script de inicialização do Gunicorn..."
cat > gunicorn_start.sh << EOF
#!/bin/bash

NAME="$SERVICE_NAME"
DIR="$BACKEND_DIR"
VENV="$BACKEND_DIR/venv"
SOCKFILE="$BACKEND_DIR/gunicorn.sock"
USER=ubuntu
GROUP=ubuntu
NUM_WORKERS=1

echo "Starting $NAME as `whoami`"

# Navegar para o diretório do backend
cd "$DIR"

# Executar Gunicorn usando o python do ambiente virtual
exec "$VENV/bin/gunicorn" main:app \
  --name "$NAME" \
  --workers "$NUM_WORKERS" \
  --user="$USER" --group="$GROUP" \
  --bind=unix:"$SOCKFILE" \
  --log-level=info \
  --log-file=-
EOF

# Tornar o script executável
chmod +x gunicorn_start.sh

# Criar arquivo de serviço systemd
echo "Criando serviço systemd..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Gunicorn instance to serve Analise Dividendos Backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/gunicorn_start.sh
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e iniciar o serviço
echo "Configurando e iniciando o serviço..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

# Verificar status do serviço
echo "Verificando status do serviço..."
sudo systemctl status $SERVICE_NAME --no-pager

echo "=========================================="
echo "Deploy do Backend concluído!"
echo "Para verificar logs: sudo journalctl -u $SERVICE_NAME -f"
echo "=========================================="
