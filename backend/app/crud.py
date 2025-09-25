# crud.py
from sqlalchemy.orm import Session

from app.services.yahoo import obter_cotacao_yf
from . import models, schemas
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import pytz

# --- Constantes ---
# Use um valor default para YIELD_MINIMO que evite a divisão por zero.
YIELD_MINIMO = float(os.getenv("YIELD_MINIMO", "0.08"))


def calcular_lucro_anual(dado: schemas.DadoFinanceiroCreate) -> float:
    # A soma direta é concisa e legível.
    return dado.lucro_t1 + dado.lucro_t2 + dado.lucro_t3 + dado.lucro_t4

def calcular_lpa(lucro: float, numero_acoes: int) -> float:
    # Retorna 0 se o número de ações for 0 para evitar a divisão por zero.
    return lucro / numero_acoes if numero_acoes > 0 else 0.0

def estimar_crescimento(cagr: Optional[float], variacao_yoy: float) -> float:
    # Usa o operador de coalescência para simplificar a lógica.
    cagr = cagr or 0.0
    return 0.4 * cagr + 0.6 * variacao_yoy

def calcular_variacao_yoy_acumulada(atual: models.DadoFinanceiro, anterior: Optional[models.DadoFinanceiro]) -> float:
    """
    Compara apenas os trimestres existentes no ano atual com os mesmos do ano anterior.
    """
    if not anterior:
        return 0.0

    trimestres = ["lucro_t1", "lucro_t2", "lucro_t3", "lucro_t4"]
    
    # Use list comprehensions e zip para uma lógica mais Pythônica e eficiente.
    pares_lucro = [
        (getattr(atual, t), getattr(anterior, t))
        for t in trimestres
        if getattr(atual, t) is not None and getattr(atual, t) != 0.0
    ]

    soma_atual = sum(p[0] for p in pares_lucro)
    soma_passado = sum(p[1] for p in pares_lucro)

    # Lógica de cálculo simplificada e segura.
    if soma_passado == 0:
        return 0.0
    return (soma_atual - soma_passado) / abs(soma_passado)
    
def _calcular_projecoes(
    dado: models.DadoFinanceiro,
    empresa: models.Empresa,
    variacao_yoy: float,
    lpa_ano_anterior: float
) -> None:
    """
    Função auxiliar para encapsular a lógica de cálculo e atualização.
    """
    lucro_anual = calcular_lucro_anual(dado)
    lpa = calcular_lpa(lucro_anual, empresa.numero_acoes)
    crescimento_estimado = estimar_crescimento(dado.cagr, variacao_yoy)
    lpa_estimada = abs(lpa_ano_anterior) * (1 + crescimento_estimado)
    
    if YIELD_MINIMO == 0:
        preco_teto = 0
    else:
        dividendo_proj = lpa_estimada * dado.payout_projetado * (1 + (dado.ajuste_dividendo or 0))
        preco_teto = dividendo_proj / YIELD_MINIMO

    margem = (preco_teto - dado.cotacao_yf) / dado.cotacao_yf if dado.cotacao_yf else 0

    dado.yield_projetado = (dividendo_proj / dado.cotacao_yf) if dado.cotacao_yf else 0.0
    dado.lucro_liquido_anual = lucro_anual
    dado.lpa = lpa
    dado.lpa_estimada = lpa_estimada
    dado.dividendo_projetado_calc = dividendo_proj
    dado.preco_teto = preco_teto
    dado.margem = margem
    dado.crescimento_estimado_lucro = crescimento_estimado
    
def recalcular_dados_empresa(db: Session, empresa: models.Empresa):
    dados: List[models.DadoFinanceiro] = (
        db.query(models.DadoFinanceiro)
        .filter_by(empresa_id=empresa.id)
        .order_by(models.DadoFinanceiro.ano)
        .all()
    )

    cotacao, data_cotacao = obter_cotacao_yf(empresa.ticker)

    ano_mais_recente = max([d.ano for d in dados], default=None)

    for idx, dado in enumerate(dados):
        dado.cotacao_yf = cotacao
        dado.ultima_atualizacao = data_cotacao
        dado_anterior = dados[idx - 1] if idx > 0 else None
        lpa_anterior = dado_anterior.lpa if dado_anterior else 0.0

        variacao_yoy = calcular_variacao_yoy_acumulada(dado, dado_anterior)
        dado.variacao_yoy = variacao_yoy

        _calcular_projecoes(
            dado=dado,
            empresa=empresa,
            variacao_yoy=variacao_yoy,
            lpa_ano_anterior=lpa_anterior,
        )

    db.commit()


# --- CRUD Empresa ---
def criar_empresa(db: Session, empresa: schemas.EmpresaCreate) -> models.Empresa:
    db_empresa = models.Empresa(**empresa.dict())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

def listar_empresas(db: Session) -> List[models.Empresa]:
    return db.query(models.Empresa).all()

def atualizar_empresa(db: Session, empresa_id: int, empresa: schemas.EmpresaCreate) -> Optional[models.Empresa]:
    empresa_existente = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if not empresa_existente:
        return None

    houve_alteracao = False
    for campo, valor in empresa.dict().items():
        if getattr(empresa_existente, campo) != valor:
            setattr(empresa_existente, campo, valor)
            houve_alteracao = True
    
    db.commit()
    db.refresh(empresa_existente)
    
    if houve_alteracao:
        recalcular_dados_empresa(db, empresa_existente)
    
    return empresa_existente

def excluir_empresa(db: Session, empresa_id: int) -> bool:
    empresa = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if not empresa:
        return False
    
    db.delete(empresa)
    db.commit()
    return True

# --- CRUD Dados Financeiros ---
def criar_dado_financeiro(db: Session, dado: schemas.DadoFinanceiroCreate) -> models.DadoFinanceiro:
    empresa = db.query(models.Empresa).filter_by(id=dado.empresa_id).first()
    if not empresa:
        raise ValueError(f"Empresa com ID {dado.empresa_id} não encontrada.")
    
    # Crie o objeto de modelo diretamente e depois recalcule.
    db_dado = models.DadoFinanceiro(**dado.dict())
    db.add(db_dado)
    db.commit()
    db.refresh(db_dado)
    
    # Recalcula todos os dados da empresa para manter a consistência.
    recalcular_dados_empresa(db, empresa)
    
    return db_dado

def listar_dados_por_empresa(db: Session, empresa_id: int) -> List[models.DadoFinanceiro]:
    return db.query(models.DadoFinanceiro).filter_by(empresa_id=empresa_id).all()