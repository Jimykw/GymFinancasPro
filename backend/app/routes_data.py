from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .auth import get_current_user
from .database import get_db
from .models import Aluno, Receita, Despesa, Filial, User
from .schemas import SyncResponse, PatchDespesaRequest, PatchDespesaResponse, DespesaOut


router = APIRouter()


def _to_despesa_out(d: Despesa) -> DespesaOut:
    return DespesaOut(
        id=d.id,
        descricao=d.descricao,
        categoria=d.categoria,
        tipo=d.tipo,
        valor=float(d.valor),
        dataVencimento=d.data_vencimento,
        dataPagamento=d.data_pagamento,
        status=d.status,
        fornecedor=d.fornecedor,
        filialId=d.filial_id,
        recorrente=bool(d.recorrente),
    )


@router.get("/api/data/sync", response_model=SyncResponse)
def sync_data(current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> SyncResponse:
    filial_id = current_user.filialId

    if current_user.role == "funcionario" and filial_id:
        alunos = db.query(Aluno).filter(Aluno.filial_id == filial_id).all()
        receitas = db.query(Receita).filter(Receita.filial_id == filial_id).all()
        despesas = db.query(Despesa).filter(Despesa.filial_id == filial_id).all()
        filiais = db.query(Filial).filter(Filial.id == filial_id).all()
    else:
        alunos = db.query(Aluno).all()
        receitas = db.query(Receita).all()
        despesas = db.query(Despesa).all()
        filiais = db.query(Filial).all()

    return SyncResponse(
        alunos=[
            {
                "id": a.id,
                "nome": a.nome,
                "cpf": a.cpf,
                "email": a.email,
                "plano": a.plano,
                "valorPlano": float(a.valor_plano),
                "dataMatricula": a.data_matricula,
                "status": a.status,
                "filialId": a.filial_id,
                "dataUltimoPagamento": a.data_ultimo_pagamento,
                "diasAtraso": a.dias_atraso,
            }
            for a in alunos
        ],
        receitas=[
            {
                "id": r.id,
                "alunoId": r.aluno_id,
                "valor": float(r.valor),
                "dataVencimento": r.data_vencimento,
                "dataPagamento": r.data_pagamento,
                "status": r.status,
                "tipo": r.tipo,
                "filialId": r.filial_id,
            }
            for r in receitas
        ],
        despesas=[
            {
                "id": d.id,
                "descricao": d.descricao,
                "categoria": d.categoria,
                "tipo": d.tipo,
                "valor": float(d.valor),
                "dataVencimento": d.data_vencimento,
                "dataPagamento": d.data_pagamento,
                "status": d.status,
                "fornecedor": d.fornecedor,
                "filialId": d.filial_id,
                "recorrente": bool(d.recorrente),
            }
            for d in despesas
        ],
        filiais=[
            {
                "id": f.id,
                "nome": f.nome,
                "endereco": f.endereco,
            }
            for f in filiais
        ],
    )


@router.patch("/api/despesas/{despesa_id}", response_model=PatchDespesaResponse)
def patch_despesa(
    despesa_id: str,
    payload: PatchDespesaRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PatchDespesaResponse:
    despesa = db.query(Despesa).filter(Despesa.id == despesa_id).first()
    if not despesa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Despesa não encontrada")

    if current_user.role == "funcionario":
        if not current_user.filialId or despesa.filial_id != current_user.filialId:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    if payload.status not in ("pago", "pendente"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status inválido")

    despesa.status = payload.status

    if payload.status == "pago":
        despesa.data_pagamento = payload.dataPagamento or date.today().isoformat()
    else:
        # Se virar pendente, remove data de pagamento (mantém coerente)
        despesa.data_pagamento = None

    db.add(despesa)
    db.commit()
    db.refresh(despesa)

    return PatchDespesaResponse(despesa=_to_despesa_out(despesa))

