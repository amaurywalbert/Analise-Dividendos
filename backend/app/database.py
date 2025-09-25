# ----------------------------
# database.py
# ----------------------------
# cria a conexão com PostgreSQL via .env com log de conexão

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

# Cria a engine de conexão com o banco de dados
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# ----------------------------
# database.py