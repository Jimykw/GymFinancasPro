from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from .auth import hash_password
from .models import User, Filial, Aluno, Receita, Despesa


plano_valores = {
    "mensal": 100,
    "trimestral": 270,
    "anual": 960,
}


nomes = [
    "Maria Silva", "João Santos", "Ana Costa", "Pedro Oliveira", "Carla Souza",
    "Lucas Ferreira", "Juliana Lima", "Rafael Almeida", "Patrícia Rocha", "Bruno Martins",
    "Fernanda Ribeiro", "Gustavo Pereira", "Camila Dias", "Thiago Cardoso", "Amanda Gomes",
    "Felipe Barbosa", "Larissa Castro", "Rodrigo Araújo", "Beatriz Mendes", "Diego Correia",
    "Isabela Freitas", "Vitor Monteiro", "Gabriela Teixeira", "Mateus Pinto", "Julia Cavalcanti",
    "Renato Barros", "Vanessa Moreira", "André Nunes", "Carolina Ramos", "Marcelo Cunha",
    "Aline Rezende", "Paulo Fonseca", "Mariana Campos", "Fábio Castro", "Débora Azevedo",
    "Leandro Moura", "Tatiana Vieira", "Ricardo Batista", "Simone Duarte", "Henrique Lima",
    "Priscila Melo", "Daniel Borges", "Cristina Pires", "Alexandre Lopes", "Mônica Carvalho",
    "Renan Santana", "Letícia Nogueira", "Vinícius Macedo", "Natália Fernandes", "Robson Tavares",
]


recorrentes = [
    {"descricao": "Aluguel Academia Centro", "categoria": "aluguel", "valor": 5000, "fornecedor": "Imobiliária XYZ", "filial_id": "1"},
    {"descricao": "Aluguel Academia Zona Norte", "categoria": "aluguel", "valor": 4500, "fornecedor": "Imobiliária ABC", "filial_id": "2"},
    {"descricao": "Salários Professores Centro", "categoria": "salarios", "valor": 8000, "fornecedor": "Folha de Pagamento", "filial_id": "1"},
    {"descricao": "Salários Professores Zona Norte", "categoria": "salarios", "valor": 6500, "fornecedor": "Folha de Pagamento", "filial_id": "2"},
    {"descricao": "Conta de Luz Centro", "categoria": "luz", "valor": 1200, "fornecedor": "Energia Elétrica SA", "filial_id": "1"},
    {"descricao": "Conta de Luz Zona Norte", "categoria": "luz", "valor": 1000, "fornecedor": "Energia Elétrica SA", "filial_id": "2"},
    {"descricao": "Conta de Água Centro", "categoria": "agua", "valor": 400, "fornecedor": "Companhia de Água", "filial_id": "1"},
    {"descricao": "Conta de Água Zona Norte", "categoria": "agua", "valor": 350, "fornecedor": "Companhia de Água", "filial_id": "2"},
    {"descricao": "Marketing Digital", "categoria": "marketing", "valor": 2000, "fornecedor": "Agência Digital", "filial_id": "1"},
]


variaveis = [
    {"descricao": "Manutenção Esteira", "categoria": "manutencao", "valor": 500, "fornecedor": "TechFit", "filial_id": "1", "mes": 1},
    {"descricao": "Compra de Halteres", "categoria": "equipamentos", "valor": 1500, "fornecedor": "FitEquip", "filial_id": "1", "mes": 2},
    {"descricao": "Reforma Vestiário", "categoria": "manutencao", "valor": 3000, "fornecedor": "Construtora ABC", "filial_id": "2", "mes": 3},
    {"descricao": "Novos Colchonetes", "categoria": "equipamentos", "valor": 800, "fornecedor": "FitEquip", "filial_id": "2", "mes": 4},
]


def last_day_of_month(year: int, month: int) -> int:
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    last_day = next_month - timedelta(days=1)
    return last_day.day


def subtract_months(d: date, months: int) -> date:
    year = d.year + (d.month - months - 1) // 12
    month = (d.month - 1 - months) % 12 + 1
    day = min(d.day, last_day_of_month(year, month))
    return date(year, month, day)


def seed_if_empty(db: Session) -> None:
    existing = db.query(User).first()
    if existing:
        return

    # Users
    db.add(
        User(
            id="1",
            username="admin",
            email="admin@gymfinancas.pro",
            password_hash=hash_password("admin123"),
            name="Administrador",
            role="admin",
            filial_id=None,
        )
    )
    db.add(
        User(
            id="2",
            username="funcionario",
            email="funcionario@gymfinancas.pro",
            password_hash=hash_password("func123"),
            name="João Silva",
            role="funcionario",
            filial_id="1",
        )
    )

    # Filiais
    db.add(Filial(id="1", nome="Academia Centro", endereco="Rua Principal, 100"))
    db.add(Filial(id="2", nome="Academia Zona Norte", endereco="Av. Norte, 500"))

    today = date.today()

    # Alunos
    alunos: list[Aluno] = []
    for i in range(len(nomes)):
        plano = random.choice(["mensal", "trimestral", "anual"])
        status = "ativo"
        if random.random() > 0.15:
            status = "ativo"
        else:
            status = "inadimplente" if random.random() > 0.5 else "cancelado"

        data_mat = subtract_months(today, random.randint(0, 11))
        data_mat = data_mat.replace(day=min(28, last_day_of_month(data_mat.year, data_mat.month)))

        dias_atraso = 0
        data_ultimo = None
        if status == "inadimplente":
            dias_atraso = random.randint(1, 60)
            data_ultimo = subtract_months(today, 1).isoformat()

        alunos.append(
            Aluno(
                id=f"aluno-{i + 1}",
                nome=nomes[i],
                cpf=str(random.randint(0, 99999999999)).zfill(11),
                email=f"{nomes[i].lower().replace(' ', '.') }@email.com",
                plano=plano,
                valor_plano=plano_valores[plano],
                data_matricula=data_mat.isoformat(),
                status=status,
                filial_id="1" if i < 30 else "2",
                data_ultimo_pagamento=data_ultimo,
                dias_atraso=dias_atraso,
            )
        )

    for a in alunos:
        db.add(a)

    # Receitas (mensalidades últimos 6 meses)
    receita_id = 1
    for aluno in alunos:
        if aluno.status == "cancelado":
            continue

        for i in range(5, -1, -1):
            venc = subtract_months(today, i).replace(day=10)
            is_pago: bool
            if i > 0:
                if aluno.status == "ativo":
                    is_pago = random.random() > 0.1
                else:
                    is_pago = random.random() > 0.6
            else:
                is_pago = aluno.status == "ativo"

            db.add(
                Receita(
                    id=f"receita-{receita_id}",
                    aluno_id=aluno.id,
                    valor=float(aluno.valor_plano),
                    data_vencimento=venc.isoformat(),
                    data_pagamento=venc.isoformat() if is_pago else None,
                    status="pago" if is_pago else "pendente",
                    tipo="mensalidade",
                    filial_id=aluno.filial_id,
                )
            )
            receita_id += 1

    # Despesas recorrentes últimos 6 meses
    despesa_id = 1
    for desp in recorrentes:
        for i in range(5, -1, -1):
            venc = subtract_months(today, i).replace(day=5)
            is_pago = i > 0 or random.random() > 0.2
            db.add(
                Despesa(
                    id=f"despesa-{despesa_id}",
                    descricao=desp["descricao"],
                    categoria=desp["categoria"],
                    tipo="fixa",
                    valor=float(desp["valor"]),
                    data_vencimento=venc.isoformat(),
                    data_pagamento=venc.isoformat() if is_pago else None,
                    status="pago" if is_pago else "pendente",
                    fornecedor=desp["fornecedor"],
                    filial_id=desp["filial_id"],
                    recorrente=True,
                )
            )
            despesa_id += 1

    # Despesas variáveis
    for desp in variaveis:
        venc = subtract_months(today, desp["mes"]).replace(day=15)
        db.add(
            Despesa(
                id=f"despesa-{despesa_id}",
                descricao=desp["descricao"],
                categoria=desp["categoria"],
                tipo="variavel",
                valor=float(desp["valor"]),
                data_vencimento=venc.isoformat(),
                data_pagamento=venc.isoformat(),
                status="pago",
                fornecedor=desp["fornecedor"],
                filial_id=desp["filial_id"],
                recorrente=False,
            )
        )
        despesa_id += 1

    db.commit()

