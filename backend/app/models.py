# ----------------------------
# models.py
# ----------------------------
from sqlalchemy import BigInteger, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

from sqlalchemy import DateTime
from datetime import datetime


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    ticker = Column(String, unique=True, index=True)
    numero_acoes = Column(BigInteger)
    dados = relationship("DadoFinanceiro", back_populates="empresa")


class DadoFinanceiro(Base):
    __tablename__ = "dados_financeiros"

    id = Column(Integer, primary_key=True, index=True)
    ano = Column(Integer)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))

    lucro_t1 = Column(Float)
    lucro_t2 = Column(Float)
    lucro_t3 = Column(Float)
    lucro_t4 = Column(Float)
    dividendo_por_acao = Column(Float)
    payout_projetado = Column(Float)
    ajuste_dividendo = Column(Float)
    cagr = Column(Float, nullable=True)

    tipo_analise = Column(String, nullable=True)
    ajuste_motivo = Column(String, nullable=True)
    vantagens = Column(String, nullable=True)
    desvantagens = Column(String, nullable=True)

    lucro_liquido_anual = Column(Float, nullable=True)
    lpa = Column(Float, nullable=True)
    variacao_yoy = Column(Float, nullable=True)
    crescimento_estimado_lucro = Column(Float, default=0)
    lpa_estimada = Column(Float, nullable=True)
    dividendo_projetado_calc = Column(Float, nullable=True)
    yield_projetado = Column(Float, nullable=True)
    preco_teto = Column(Float, nullable=True)
    margem = Column(Float, nullable=True)
    cotacao_yf = Column(Float, nullable=True)
    ultima_atualizacao = Column(DateTime, nullable=True)

    empresa = relationship("Empresa", back_populates="dados")
# ----------------------------
# models.py