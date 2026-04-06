from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .auth import create_access_token, verify_password, hash_password, get_current_user
from .database import get_db
from .models import User
from .schemas import (
    LoginRequest,
    LoginResponse,
    UserOut,
    ChangePasswordRequest,
    ChangePasswordResponse,
    RegisterRequest,
    RegisterGoogleRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
)


router = APIRouter()


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        avatarUrl=user.avatar_url,
        name=user.name,
        role=user.role,
        filialId=user.filial_id,
    )


@router.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha incorretos")

    token = create_access_token(user=user)
    return LoginResponse(token=token, user=_to_user_out(user))


@router.post("/api/auth/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> LoginResponse:
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já cadastrado")

    normalized_email = payload.email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail inválido")

    existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado")

    user = User(
        id=f"user-{uuid4()}",
        username=payload.username.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        role="funcionario",
        filial_id=None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user=user)
    return LoginResponse(token=token, user=_to_user_out(user))


@router.post("/api/auth/register-google", response_model=LoginResponse)
def register_google(payload: RegisterGoogleRequest, db: Session = Depends(get_db)) -> LoginResponse:
    normalized_email = payload.email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail inválido")

    existing_by_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_by_email:
        token = create_access_token(user=existing_by_email)
        return LoginResponse(token=token, user=_to_user_out(existing_by_email))

    base_username = normalized_email.split("@")[0].strip().lower().replace(" ", ".")
    username = base_username
    suffix = 1

    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{suffix}"
        suffix += 1

    user = User(
        id=f"user-{uuid4()}",
        username=username,
        email=normalized_email,
        password_hash=hash_password(uuid4().hex),
        name=payload.name.strip(),
        role="funcionario",
        filial_id=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user=user)
    return LoginResponse(token=token, user=_to_user_out(user))


@router.put("/api/auth/profile", response_model=UpdateProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdateProfileResponse:
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    normalized_email = payload.email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail inválido")

    existing_email = (
        db.query(User)
        .filter(func.lower(User.email) == normalized_email, User.id != user.id)
        .first()
    )
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado")

    user.name = payload.name.strip()
    user.email = normalized_email
    user.avatar_url = payload.avatarUrl.strip() if payload.avatarUrl else None

    db.add(user)
    db.commit()
    db.refresh(user)

    return UpdateProfileResponse(user=_to_user_out(user))


@router.post("/api/auth/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> ForgotPasswordResponse:
    normalized_email = payload.email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail inválido")

    _ = db.query(User).filter(func.lower(User.email) == normalized_email).first()

    # Resposta neutra por segurança (não expõe se o e-mail existe ou não).
    return ForgotPasswordResponse(
        message="Se o e-mail estiver cadastrado, você receberá instruções de recuperação."
    )


@router.post("/api/auth/change-password", response_model=ChangePasswordResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChangePasswordResponse:
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    if not verify_password(payload.currentPassword, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual inválida")

    if payload.currentPassword == payload.newPassword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A nova senha deve ser diferente da atual")

    user.password_hash = hash_password(payload.newPassword)
    db.add(user)
    db.commit()

    return ChangePasswordResponse(message="Senha atualizada com sucesso")

