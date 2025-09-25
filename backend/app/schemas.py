# ----------------------------
# schemas.py
# ----------------------------
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class EmpresaBase(BaseModel):
    nome: str
    ticker: str
    numero_acoes: int


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    nome: Optional[str] = None
    ticker: Optional[str] = None
    numero_acoes: Optional[int] = None


class EmpresaOut(EmpresaBase):
    id: int

    class Config:
        from_attributes = True


class DadoFinanceiroBase(BaseModel):
    ano: int
    lucro_t1: float
    lucro_t2: float
    lucro_t3: float
    lucro_t4: float
    dividendo_por_acao: float
    payout_projetado: float
    ajuste_dividendo: float
    cagr: Optional[float] = None
    tipo_analise: Optional[str] = None
    ajuste_motivo: Optional[str] = None
    vantagens: Optional[str] = None
    desvantagens: Optional[str] = None


class DadoFinanceiroCreate(DadoFinanceiroBase):
    empresa_id: int


class DadoFinanceiroOut(DadoFinanceiroBase):
    id: int
    empresa_id: int
    lucro_liquido_anual: Optional[float]
    lpa: Optional[float]
    lpa_estimada: Optional[float]
    dividendo_projetado_calc: Optional[float]
    yield_projetado: Optional[float]
    preco_teto: Optional[float]
    variacao_yoy: Optional[float] = None
    crescimento_estimado_lucro: Optional[float] = None
    margem: Optional[float]
    cotacao_yf: float | None = None
    ultima_atualizacao: datetime | None = None

    # Campo temporário: calculado apenas no ano mais recente
    recomendacao_temp: Optional[str] = None

    class Config:
        from_attributes = True
