from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any
import os

from app.db import get_db
from app.assistant_router import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Gestor de contraseñas usando el algoritmo Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login_user(form_data: LoginRequest, db: Any = Depends(get_db)):
    """
    1. Busca el usuario en Supabase (users table).
    2. Compara el hash de la contraseña (passlib).
    3. Si todo está bien, firma un JWT con el 'tenant_id'.
    """
    
    # Buscar el email en nuestra tabla local de la BD (Recordando NO usar Supabase Auth según reglas)
    response = db.table("users").select("*").eq("email", form_data.email).execute()
    
    if not response.data:
        raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos")
        
    user_db = response.data[0]
    
    # Comprobar la contraseña
    if not pwd_context.verify(form_data.password, user_db["password_hash"]):
        raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos")
        
    # Verificar si está activo
    if not user_db.get("is_active", True):
        raise HTTPException(status_code=401, detail="Usuario inactivo")
        
    # Crear el contenido útil (payload) de nuestro JWT
    payload = {
        "sub": str(user_db["id"]),                # ID del usuario global
        "tenant_id": str(user_db["tenant_id"]),    # ESENCIAL: El aislamiento multitenant
        "role": user_db["role"],
        "exp": datetime.utcnow() + timedelta(days=7) # Expira en una semana
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_db["id"],
            "email": user_db["email"],
            "first_name": user_db["first_name"],
            "role": user_db["role"],
            "tenant_id": user_db["tenant_id"]
        }
    }
