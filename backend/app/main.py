from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .config import settings
from .database import engine, Base, SessionLocal
from .routes_auth import router as auth_router
from .routes_data import router as data_router
from .seed import seed_if_empty


app = FastAPI(title="GymFinanças Pro Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(data_router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "email" not in user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
    if "avatar_url" not in user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

