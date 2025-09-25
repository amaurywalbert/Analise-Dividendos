from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import SessionLocal
import csv
import io
from typing import List, Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




# Função utilitária para calcular recomendação sem salvar no banco
def calcular_recomendacao_temp(margem: Optional[float]) -> Optional[str]:
    if margem is None:
        return None
    if margem > 0.2:
        return "Comprar"
    elif -0.3 <= margem <= 0.2:
        return "Manter"
    else:
        return "Vender"

# --- Rotas da Empresa ---
@router.post("/", response_model=schemas.EmpresaOut)
def criar_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    return crud.criar_empresa(db, empresa)

@router.get("/", response_model=List[schemas.EmpresaOut])
def listar_empresas(db: Session = Depends(get_db)):
    return crud.listar_empresas(db)

@router.put("/{empresa_id}", response_model=schemas.EmpresaOut)
def atualizar_empresa(empresa_id: int, empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    empresa_atualizada = crud.atualizar_empresa(db, empresa_id, empresa)
    if not empresa_atualizada:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return empresa_atualizada

@router.delete("/{empresa_id}")
def excluir_empresa(empresa_id: int, db: Session = Depends(get_db)):
    sucesso = crud.excluir_empresa(db, empresa_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return {"detail": "Empresa excluída com sucesso"}






# --- Rotas de Dados Financeiros ---
@router.post("/dados", response_model=schemas.DadoFinanceiroOut)
def criar_dado_financeiro(dado: schemas.DadoFinanceiroCreate, db: Session = Depends(get_db)):
    try:
        return crud.criar_dado_financeiro(db, dado)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.get("/{empresa_id}/dados", response_model=List[schemas.DadoFinanceiroOut])
def listar_dados(empresa_id: int, db: Session = Depends(get_db)):
    dados_financeiros = crud.listar_dados_por_empresa(db, empresa_id)
    if not dados_financeiros:
        return []

    ano_mais_recente = max(d.ano for d in dados_financeiros)

    saida = []
    for d in dados_financeiros:
        dado_out = schemas.DadoFinanceiroOut.from_orm(d)
        if d.ano == ano_mais_recente:
            dado_out.recomendacao_temp = calcular_recomendacao_temp(d.margem)
        saida.append(dado_out)

    return saida



@router.delete("/{empresa_id}/dados/{ano}")
def excluir_dado_financeiro(empresa_id: int, ano: int, db: Session = Depends(get_db)):
    dado = db.query(models.DadoFinanceiro).filter_by(empresa_id=empresa_id, ano=ano).first()
    if not dado:
        raise HTTPException(status_code=404, detail="Dado financeiro não encontrado")
    
    db.delete(dado)
    db.commit()
    
    # Recalcula os dados da empresa para garantir consistência após a exclusão de um dado
    empresa = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if empresa:
        crud.recalcular_dados_empresa(db, empresa)

    return {"detail": f"Dado financeiro do ano {ano} excluído com sucesso"}

@router.put("/{empresa_id}/dados/{ano}", response_model=schemas.DadoFinanceiroOut)
def atualizar_dado_financeiro(
    empresa_id: int,
    ano: int,
    dado_update: schemas.DadoFinanceiroCreate,
    db: Session = Depends(get_db)
):
    empresa = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    dado = (
        db.query(models.DadoFinanceiro)
        .filter_by(empresa_id=empresa_id, ano=ano)
        .first()
    )

    if not dado:
        raise HTTPException(status_code=404, detail="Dado financeiro não encontrado")

    # Atualiza somente os campos enviados
    for campo, valor in dado_update.dict().items():
        setattr(dado, campo, valor)

    db.commit()
    db.refresh(dado)

    # Recalcular apenas o ano mais recente
    crud.recalcular_dados_empresa(db, empresa)

    return dado

@router.post("/{empresa_id}/dados/{ano}/atualizar_cotacao_yf", response_model=schemas.DadoFinanceiroOut)
def atualizar_cotacao_yf(
    empresa_id: int, ano: int, db: Session = Depends(get_db)
):
    empresa = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # Recalcula todos os dados da empresa para manter a consistência, incluindo a atualização da cotação
    # O `crud.recalcular_dados_empresa` já faz a chamada a `obter_cotacao_yf`
    crud.recalcular_dados_empresa(db, empresa)
    
    # Busca o dado específico para retornar após a atualização
    dado = db.query(models.DadoFinanceiro).filter_by(empresa_id=empresa_id, ano=ano).first()
    if not dado:
        raise HTTPException(status_code=404, detail="Dado financeiro não encontrado")
    
    return dado







# --- Rota de Detalhes e Importação ---

@router.get("/{empresa_id}/detalhes", response_model=dict)
def obter_detalhes_completos(empresa_id: int, db: Session = Depends(get_db)):
    empresa = db.query(models.Empresa).filter_by(id=empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    dados_financeiros = db.query(models.DadoFinanceiro).filter_by(empresa_id=empresa.id).all()

    if not dados_financeiros:
        return {
            "empresa": {
                "id": empresa.id,
                "nome": empresa.nome,
                "ticker": empresa.ticker,
                "numero_acoes": empresa.numero_acoes
            },
            "dados_financeiros": []
        }

    # Determina ano mais recente
    ano_mais_recente = max(d.ano for d in dados_financeiros)

    # Monta lista de saída com recomendacao_temp só para o ano mais recente
    dados_out = []
    for d in dados_financeiros:
        dado_out = schemas.DadoFinanceiroOut.from_orm(d)
        if d.ano == ano_mais_recente:
            dado_out.recomendacao_temp = calcular_recomendacao_temp(d.margem)
        dados_out.append(dado_out)

    return {
        "empresa": {
            "id": empresa.id,
            "nome": empresa.nome,
            "ticker": empresa.ticker,
            "numero_acoes": empresa.numero_acoes
        },
        "dados_financeiros": dados_out
    }







@router.post("/importar_csv")
def importar_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    importados, atualizados, erros = 0, 0, []

    def parse_float(value: Optional[str]) -> float:
        try:
            return float(value) if value else 0.0
        except (ValueError, TypeError):
            return 0.0

    def parse_int(value: Optional[str]) -> int:
        try:
            return int(value) if value else 0
        except (ValueError, TypeError):
            return 0
            
    empresas_para_recalcular = set()

    for row in reader:
        try:
            ticker = row.get("ticker")
            ano = parse_int(row.get("ano"))
            
            if not ticker or not ano:
                erros.append({"linha": row, "erro": "Ticker ou ano ausente"})
                continue
            
            empresa = db.query(models.Empresa).filter_by(ticker=ticker).first()
            if not empresa:
                empresa = models.Empresa(
                    nome=row.get("nome", ticker),
                    ticker=ticker,
                    numero_acoes=parse_int(row.get("numero_acoes"))
                )
                db.add(empresa)
                db.commit()
                db.refresh(empresa)

            dado_data = {
                "empresa_id": empresa.id,
                "ano": ano,
                "lucro_t1": parse_float(row.get("lucro_t1")),
                "lucro_t2": parse_float(row.get("lucro_t2")),
                "lucro_t3": parse_float(row.get("lucro_t3")),
                "lucro_t4": parse_float(row.get("lucro_t4")),
                "dividendo_por_acao": parse_float(row.get("dividendo_por_acao")),
                "payout_projetado": parse_float(row.get("payout_projetado")),
                "ajuste_dividendo": parse_float(row.get("ajuste_dividendo")),
                "cagr": parse_float(row.get("cagr")),
                "tipo_analise": row.get("tipo_analise"),
                "ajuste_motivo": row.get("ajuste_motivo"),
                "vantagens": row.get("vantagens"),
                "desvantagens": row.get("desvantagens"),
            }

            dado_existente = db.query(models.DadoFinanceiro).filter_by(
                empresa_id=empresa.id, ano=ano
            ).first()

            if dado_existente:
                for field, value in dado_data.items():
                    setattr(dado_existente, field, value)
                atualizados += 1
            else:
                db_dado = models.DadoFinanceiro(**dado_data)
                db.add(db_dado)
                importados += 1

            empresas_para_recalcular.add(empresa)
            
        except Exception as e:
            print(f"⚠️ Erro ao importar linha: {row}")
            print(f"Motivo: {e}")
            erros.append({"linha": row, "erro": str(e)})
            db.rollback() # Adicionado rollback em caso de erro

    db.commit()
    
    # Recalcular todos os dados das empresas afetadas
    for empresa in empresas_para_recalcular:
        crud.recalcular_dados_empresa(db, empresa)
    
    db.commit()

    return {
        "importados": importados,
        "atualizados": atualizados,
        "falhas": len(erros),
        "erros": erros
    }