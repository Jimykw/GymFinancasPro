from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    username: str
    email: str
    password: str = Field(min_length=6)


class RegisterGoogleRequest(BaseModel):
    name: str
    email: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str | None = None
    avatarUrl: str | None = None
    name: str
    role: str
    filialId: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class FilialOut(BaseModel):
    id: str
    nome: str
    endereco: str


class AlunoOut(BaseModel):
    id: str
    nome: str
    cpf: str
    email: str
    plano: str
    valorPlano: float
    dataMatricula: str
    status: str
    filialId: str | None = None
    dataUltimoPagamento: str | None = None
    diasAtraso: int | None = None


class ReceitaOut(BaseModel):
    id: str
    alunoId: str
    valor: float
    dataVencimento: str
    dataPagamento: str | None = None
    status: str
    tipo: str
    filialId: str | None = None


class DespesaOut(BaseModel):
    id: str
    descricao: str
    categoria: str
    tipo: str
    valor: float
    dataVencimento: str
    dataPagamento: str | None = None
    status: str
    fornecedor: str
    filialId: str | None = None
    recorrente: bool


class SyncResponse(BaseModel):
    alunos: list[AlunoOut]
    receitas: list[ReceitaOut]
    despesas: list[DespesaOut]
    filiais: list[FilialOut]


class PatchDespesaRequest(BaseModel):
    status: str
    dataPagamento: str | None = None


class PatchDespesaResponse(BaseModel):
    despesa: DespesaOut


class PostDespesaRequest(BaseModel):
    descricao: str
    categoria: str
    tipo: str
    valor: float
    dataVencimento: str
    dataPagamento: str | None = None
    status: str
    fornecedor: str
    filialId: str | None = None
    recorrente: bool = False


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=6)


class ChangePasswordResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    message: str


class UpdateProfileRequest(BaseModel):
    name: str
    email: str
    avatarUrl: str | None = None


class UpdateProfileResponse(BaseModel):
    user: UserOut

