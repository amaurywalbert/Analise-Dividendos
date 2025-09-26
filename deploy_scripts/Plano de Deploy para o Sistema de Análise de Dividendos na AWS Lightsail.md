# Plano de Deploy para o Sistema de Análise de Dividendos na AWS Lightsail

Este documento detalha o processo de deploy do sistema de análise de dividendos (Backend FastAPI + Frontend React) em uma instância AWS Lightsail com recursos limitados (512 MB RAM, 2 vCPUs, 20 GB SSD). O plano foca na otimização de recursos e na estabilidade do ambiente.

## 1. Pré-requisitos na Instância Lightsail

Certifique-se de que a instância Ubuntu 22.04 LTS esteja atualizada e com os pacotes essenciais instalados.

1.  **Atualizar o sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Instalar ferramentas essenciais:**
    ```bash
    sudo apt install -y git python3-pip python3-venv nginx
    ```

## 2. Configuração do Swap Space

Devido à limitação de RAM (512 MB), é crucial adicionar um arquivo de swap para evitar problemas de memória. Recomenda-se um swap de 1 GB ou 2 GB.

1.  **Criar o arquivo de swap (exemplo de 2GB):**
    ```bash
    sudo fallocate -l 2G /swapfile
    ```
2.  **Definir permissões:**
    ```bash
    sudo chmod 600 /swapfile
    ```
3.  **Configurar o arquivo de swap:**
    ```bash
    sudo mkswap /swapfile
    sudo swapon /swapfile
    ```
4.  **Tornar o swap persistente após reinicializações:**
    ```bash
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    ```
5.  **Ajustar parâmetros de swap (opcional, mas recomendado para otimização):**
    *   `swappiness`: Controla a tendência do kernel de mover processos da RAM para o swap. Um valor mais baixo (ex: 10) significa que o swap será usado menos agressivamente.
    *   `vfs_cache_pressure`: Controla a tendência do kernel de desalocar memória para o cache de diretórios e inodes. Um valor mais alto (ex: 100) significa que o kernel irá desalocar mais agressivamente.

    ```bash
    sudo sysctl vm.swappiness=10
    sudo sysctl vm.vfs_cache_pressure=50
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    ```

## 3. Deploy do Backend (FastAPI)

### 3.1. Clonar o Repositório e Configurar Ambiente

1.  **Navegar para o diretório home do usuário:**
    ```bash
    cd /home/ubuntu
    ```
2.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/amaurywalbert/Analise-Dividendos.git
    cd Analise-Dividendos/backend
    ```
3.  **Criar e ativar ambiente virtual:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
4.  **Instalar dependências:**
    ```bash
    pip install -r requirements.txt
    ```

### 3.2. Configuração do Banco de Dados

Assumindo o uso de SQLite para simplificar o deploy inicial e economizar recursos. O arquivo `database.db` será criado na raiz do diretório `backend`.

1.  **Executar migrações do Alembic:**
    ```bash
    alembic upgrade head
    ```

### 3.3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend` para armazenar variáveis de ambiente. Exemplo:

```ini
# .env no diretório backend
DATABASE_URL=sqlite:///./database.db
# Outras variáveis de ambiente, se houver
```

### 3.4. Configuração do Gunicorn

O Gunicorn será usado para servir o FastAPI de forma robusta e gerenciar os workers. Para 512 MB de RAM, é crucial limitar o número de workers.

1.  **Criar um script de inicialização para o Gunicorn (ex: `gunicorn_start.sh` no diretório `backend`):**
    ```bash
    #!/bin/bash

    NAME="analise_dividendos_backend"
    DIR=/home/ubuntu/Analise-Dividendos/backend
    VENV=$DIR/venv
    SOCKFILE=$DIR/gunicorn.sock
    USER=ubuntu
    GROUP=ubuntu
    NUM_WORKERS=1 # Importante: Limitar workers para economizar RAM
    # Ajuste o caminho para o seu arquivo main.py do FastAPI
    # Assumindo que a aplicação FastAPI está em 'main:app'
    # Se sua aplicação estiver em 'app/main.py' e o objeto FastAPI for 'app', use 'app.main:app'
    DJANGO_SETTINGS_MODULE=analise_dividendos.settings
    DJANGO_WSGI_MODULE=analise_dividendos.wsgi

    echo "Starting $NAME as `whoami`"

    # Ativar o ambiente virtual
    cd $DIR
    source $VENV/bin/activate

    # Criar o socket se não existir
    test -d $DIR/run || mkdir -p $DIR/run

    # Executar Gunicorn
    exec $VENV/bin/gunicorn main:app \
      --name $NAME \
      --workers $NUM_WORKERS \
      --user=$USER --group=$GROUP \
      --bind=unix:$SOCKFILE \
      --log-level=info \
      --log-file=- # Saída de log para stdout/stderr
    ```
2.  **Tornar o script executável:**
    ```bash
    chmod +x gunicorn_start.sh
    ```

### 3.5. Configuração do Systemd para o Backend

Crie um serviço `systemd` para garantir que o Gunicorn inicie automaticamente e seja gerenciado pelo sistema.

1.  **Criar o arquivo de serviço (ex: `/etc/systemd/system/analise_dividendos_backend.service`):**
    ```ini
    [Unit]
    Description=Gunicorn instance to serve Analise Dividendos Backend
    After=network.target

    [Service]
    User=ubuntu
    Group=ubuntu
    WorkingDirectory=/home/ubuntu/Analise-Dividendos/backend
    ExecStart=/home/ubuntu/Analise-Dividendos/backend/gunicorn_start.sh
    Restart=always
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=analise_dividendos_backend

    [Install]
    WantedBy=multi-user.target
    ```
2.  **Recarregar o systemd, iniciar e habilitar o serviço:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl start analise_dividendos_backend
    sudo systemctl enable analise_dividendos_backend
    ```
3.  **Verificar o status do serviço:**
    ```bash
    sudo systemctl status analise_dividendos_backend
    ```

## 4. Deploy do Frontend (React)

### 4.1. Build do Frontend

1.  **Navegar para o diretório do frontend:**
    ```bash
    cd /home/ubuntu/Analise-Dividendos/frontend
    ```
2.  **Instalar dependências do Node.js:**
    ```bash
    npm install
    ```
3.  **Realizar o build de produção:**
    ```bash
    npm run build
    ```
    Isso criará uma pasta `dist` (ou `build`, dependendo da configuração do Vite) com os arquivos estáticos otimizados.

### 4.2. Configuração do Nginx para o Frontend e Proxy Reverso para o Backend

O Nginx servirá os arquivos estáticos do frontend e atuará como proxy reverso para o backend FastAPI.

1.  **Remover a configuração padrão do Nginx:**
    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```
2.  **Criar um novo arquivo de configuração do Nginx (ex: `/etc/nginx/sites-available/analise_dividendos`):**
    ```nginx
    server {
        listen 80;
        server_name your_domain_or_lightsail_ip;

        location / {
            root /home/ubuntu/Analise-Dividendos/frontend/dist; # Ajuste para o diretório de build do seu frontend
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://unix:/home/ubuntu/Analise-Dividendos/backend/gunicorn.sock;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    **Importante:** Substitua `your_domain_or_lightsail_ip` pelo IP público da sua instância Lightsail ou pelo seu domínio, se configurado. Ajuste o `root` para o caminho correto da pasta de build do seu frontend (geralmente `dist` ou `build`). O `location /api/` é um exemplo, ajuste conforme as rotas da sua API FastAPI.

3.  **Criar um link simbólico para habilitar a configuração:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/analise_dividendos /etc/nginx/sites-enabled
    ```
4.  **Testar a configuração do Nginx e reiniciar:**
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## 5. Acesso e Teste

Após a conclusão de todos os passos, o sistema deverá estar acessível através do IP público da sua instância Lightsail ou do domínio configurado. Verifique os logs do Gunicorn e do Nginx em caso de problemas.

*   **Logs do Backend:** `sudo journalctl -u analise_dividendos_backend -f`
*   **Logs do Nginx:** `sudo tail -f /var/log/nginx/error.log` e `sudo tail -f /var/log/nginx/access.log`

## 6. Considerações Adicionais

*   **HTTPS:** Para produção, é altamente recomendável configurar HTTPS usando Let's Encrypt. Isso pode ser feito após o deploy inicial, utilizando `certbot` com Nginx.
*   **Firewall (AWS Lightsail):** Certifique-se de que as portas 80 (HTTP) e 443 (HTTPS, se configurado) estejam abertas no firewall da sua instância Lightsail.
*   **Monitoramento:** Considere ferramentas de monitoramento mais robustas para acompanhar o desempenho da aplicação e da instância a longo prazo.
*   **Backup:** Implemente uma estratégia de backup para o banco de dados SQLite (se usado) e para os arquivos da aplicação.

Este plano fornece uma base sólida para o deploy do seu sistema, considerando as limitações de recursos da instância Lightsail. Ajustes finos podem ser necessários com base no comportamento da aplicação em produção.
