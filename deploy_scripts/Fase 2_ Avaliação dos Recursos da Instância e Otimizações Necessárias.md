# Fase 2: Avaliação dos Recursos da Instância e Otimizações Necessárias

## 1. Análise dos Recursos da Instância AWS Lightsail

A instância AWS Lightsail possui as seguintes especificações:

*   **RAM:** 512 MB
*   **vCPUs:** 2
*   **Armazenamento:** 20 GB SSD

Esses recursos são bastante limitados para rodar um backend Python (FastAPI) e um frontend React (servido por Nginx ou similar) simultaneamente, além de um banco de dados. Será crucial otimizar o uso de recursos.

## 2. Otimizações Necessárias para o Deploy

### 2.1. Backend (FastAPI + SQLAlchemy)

*   **Banco de Dados:** O projeto menciona SQLite ou outro banco relacional. Para um ambiente de produção, especialmente com recursos limitados, o SQLite pode ser uma opção mais leve se o volume de dados e acessos simultâneos for baixo. No entanto, se houver necessidade de escalabilidade ou concorrência, um banco de dados externo (como PostgreSQL gerenciado pela AWS RDS ou um serviço de banco de dados no próprio Lightsail) seria mais adequado para não consumir a RAM da instância. Se o SQLite for usado, ele será um arquivo no disco, o que é bom para a RAM, mas pode ser um gargalo de I/O.
*   **Servidor WSGI:** O `uvicorn` é um servidor ASGI, que é eficiente. No entanto, para produção, é comum usar um processo de gerenciamento como `Gunicorn` na frente do `uvicorn` para gerenciar múltiplos workers e threads, o que pode aumentar o consumo de RAM. Será necessário configurar o Gunicorn com um número reduzido de workers (talvez 1 ou 2) para economizar memória.
*   **Variáveis de Ambiente:** Utilizar variáveis de ambiente para configurações sensíveis (chaves de API, credenciais de banco de dados) é uma boa prática e não impacta a memória.
*   **Otimização de Código Python:** Garantir que o código Python seja o mais eficiente possível, evitando vazamentos de memória e operações desnecessárias.

### 2.2. Frontend (React + Axios + Tailwind)

*   **Servidor Web Estático:** O frontend React é um conjunto de arquivos estáticos (HTML, CSS, JavaScript). Ele deve ser construído (build) e servido por um servidor web leve e eficiente, como `Nginx`. O Nginx é conhecido por seu baixo consumo de memória e alta performance para servir arquivos estáticos.
*   **Otimização do Build:** Garantir que o processo de build do React (com Vite) gere um pacote otimizado e minimizado, reduzindo o tamanho dos arquivos e, consequentemente, o tempo de carregamento e o consumo de banda.
*   **Cache:** Configurar o cache do Nginx para os arquivos estáticos do frontend pode melhorar significativamente a performance e reduzir a carga na instância.

### 2.3. Considerações Gerais para a Instância Lightsail

*   **Swap Space:** É altamente recomendável adicionar um arquivo de swap (swap space) na instância. Com apenas 512 MB de RAM, o sistema pode ficar sem memória rapidamente, levando a falhas. Um swap space permitirá que o sistema mova dados menos usados da RAM para o disco, evitando travamentos, embora possa degradar a performance se for muito utilizado.
*   **Docker:** Embora o Docker seja uma ótima ferramenta para isolamento e portabilidade, ele adiciona uma camada de abstração e consome recursos adicionais (RAM e CPU). Para uma instância com 512 MB de RAM, evitar o Docker e fazer o deploy diretamente na máquina virtual (bare-metal) pode ser a melhor estratégia para maximizar o uso dos recursos disponíveis.
*   **Processos em Segundo Plano:** Minimizar o número de processos em segundo plano e serviços desnecessários rodando na instância.
*   **Monitoramento:** Implementar algum tipo de monitoramento básico para acompanhar o uso de CPU, memória e disco, a fim de identificar gargalos e ajustar as configurações conforme necessário.

### 2.4. Integração com Yahoo Finance

*   A integração com Yahoo Finance é feita via API. As requisições devem ser feitas pelo backend. É importante gerenciar a frequência das requisições para evitar bloqueios e otimizar o uso de recursos, talvez implementando um cache no backend para cotações recentes.

Com base nesta análise, o plano de deploy será focado em eficiência e minimização do consumo de recursos.
