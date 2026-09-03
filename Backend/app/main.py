import os

from dotenv import load_dotenv
from fastapi import FastAPI
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.user import router as user_router

from app.auth import hash_password

from app.database import (
    Base,
    SessionLocal,
    engine
)

from app.models import Admin


load_dotenv()


app = FastAPI(
    title="KIZUNA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(
    bind=engine
)


# ==========================================
# CREATE SINGLE ADMIN
# ==========================================

def create_initial_admin():

    admin_username = os.getenv(
        "ADMIN_USERNAME"
    )

    admin_password = os.getenv(
        "ADMIN_PASSWORD"
    )


    if not admin_username:

        raise RuntimeError(
            "ADMIN_USERNAME is missing in .env"
        )


    if not admin_password:

        raise RuntimeError(
            "ADMIN_PASSWORD is missing in .env"
        )


    db: Session = SessionLocal()


    try:

        existing_admin = (
            db.query(Admin)
            .first()
        )


        # Only one admin is allowed
        if existing_admin is None:

            admin = Admin(

                username=admin_username,

                password_hash=hash_password(
                    admin_password
                )
            )


            db.add(
                admin
            )

            db.commit()

            print(
                "Initial administrator created successfully"
            )


    finally:

        db.close()


create_initial_admin()


# ==========================================
# INCLUDE ROUTERS
# ==========================================

app.include_router(
    admin_router
)

app.include_router(
    user_router
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message": "KIZUNA Backend is running"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }