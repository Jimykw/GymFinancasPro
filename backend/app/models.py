from __future__ import annotations

from typing import Optional

from sqlalchemy import String, Integer, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_hash: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)  # 'admin' | 'funcionario'
    filial_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class Filial(Base):
    __tablename__ = "filiais"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String, index=True)
    endereco: Mapped[str] = mapped_column(String)


class Aluno(Base):
    __tablename__ = "alunos"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String, index=True)
    cpf: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, index=True)
    plano: Mapped[str] = mapped_column(String)  # 'mensal' | 'trimestral' | 'anual'
    valor_plano: Mapped[float] = mapped_column(Numeric(10, 2))
    data_matricula: Mapped[str] = mapped_column(String)  # ISO 'YYYY-MM-DD'
    status: Mapped[str] = mapped_column(String)  # 'ativo' | 'inadimplente' | 'cancelado'
    filial_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    data_ultimo_pagamento: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dias_atraso: Mapped[int] = mapped_column(Integer, default=0)


class Receita(Base):
    __tablename__ = "receitas"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    aluno_id: Mapped[str] = mapped_column(String, index=True)
    valor: Mapped[float] = mapped_column(Numeric(10, 2))
    data_vencimento: Mapped[str] = mapped_column(String)  # ISO 'YYYY-MM-DD'
    data_pagamento: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String)  # 'pago' | 'pendente'
    tipo: Mapped[str] = mapped_column(String)  # 'mensalidade' | 'matricula' | 'taxa'
    filial_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class Despesa(Base):
    __tablename__ = "despesas"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    descricao: Mapped[str] = mapped_column(String, index=True)
    categoria: Mapped[str] = mapped_column(String, index=True)
    tipo: Mapped[str] = mapped_column(String)  # 'fixa' | 'variavel'
    valor: Mapped[float] = mapped_column(Numeric(10, 2))
    data_vencimento: Mapped[str] = mapped_column(String)  # ISO 'YYYY-MM-DD'
    data_pagamento: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String)  # 'pago' | 'pendente'
    fornecedor: Mapped[str] = mapped_column(String)
    filial_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    recorrente: Mapped[bool] = mapped_column(Boolean, default=False)