# ----------------------------
# database.py
# ----------------------------
# cria a conexão com SQLite via .env com log de conexão

# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Verifica se a variável de ambiente DATABASE_URL está definida
if not DATABASE_URL:
    raise ValueError("DATABASE_URL não encontrada. Verifique o arquivo .env")

# Adiciona um print para depuração
print(f"DEBUG: DATABASE_URL carregada: {DATABASE_URL}")

# Cria a engine de conexão com o banco de dados
# Para SQLite, é importante usar check_same_thread=False para evitar problemas com threads
# Também, para aiosqlite, o URL deve ser \'sqlite+aiosqlite:///./database.db\'
# Se a URL já for \'sqlite:///./database.db\', o SQLAlchemy deve inferir o driver
# No entanto, para garantir, podemos forçar o uso de aiosqlite se a URL for SQLite

if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    # Substitui o prefixo para usar o driver aiosqlite
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    print(f"DEBUG: DATABASE_URL ajustada para aiosqlite: {DATABASE_URL}")

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={
        "check_same_thread": False
    } if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# ----------------------------
# database.py
