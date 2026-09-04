import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, trains, user
from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import Admin

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kizuna", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(user.router)
app.include_router(trains.router)


@app.on_event("startup")
def seed_default_admin():
    """Creates a default admin account on first run so /api/admin/login has
    something to authenticate against. Override the credentials via .env
    (ADMIN_USERNAME / ADMIN_PASSWORD) and change the password after first
    login — this is a dev convenience, not meant for production as-is."""
    db = SessionLocal()
    try:
        if db.query(Admin).count() == 0:
            default_username = os.getenv("ADMIN_USERNAME", "admin")
            default_password = os.getenv("ADMIN_PASSWORD", "admin123")
            db.add(Admin(username=default_username, hashed_password=hash_password(default_password)))
            db.commit()
            print(f"[startup] Created default admin '{default_username}' — change its password after first login.")
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}