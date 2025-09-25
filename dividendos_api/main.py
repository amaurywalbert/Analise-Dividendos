# dividendos_api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import empresas
from dotenv import load_dotenv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste para os domínios corretos em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


load_dotenv()

app = FastAPI(title="Sistema de Preço Teto - Dividendos")

app.include_router(empresas.router, prefix="/empresas", tags=["Empresas"])

@app.get("/")
def read_root():
    return {"status": "OK"}

