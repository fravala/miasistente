from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()
from app.assistant_router import router as assistant_router
from app.routers.crm import router as crm_router
from app.routers.auth import router as auth_router
from app.routers.settings import router as settings_router
from app.routers.tasks import router as tasks_router
from app.routers.analytics import router as analytics_router

app = FastAPI(
    title="MiAsistente ERP & AI",
    description="Backend API de ERP SaaS Code-First con IA integrada y arquitectura Multitenant.",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde el frontend (especialmente Next.js en puerto 3000)
# Configurar CORS con orígenes específicos para permitir envío de tokens Bearer/Cookies
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrando los routers de Dominio - Order matters for path resolution
app.include_router(auth_router)
app.include_router(crm_router)
app.include_router(tasks_router)
app.include_router(analytics_router)
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(assistant_router, prefix="/api/assistant", tags=["Assistant"])

@app.get("/")
def read_root():
    return {
        "api_status": "online",
        "service": "MiAsistente Core API"
    }
