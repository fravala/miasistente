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

# Configurar CORS con orígenes específicos o permitir todos para facilitar despliegue
origins_env = os.getenv("ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in origins_env if o.strip()] + [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
]

# Si estamos en producción o despliegue, podemos permitir todos temporalmente para asegurar conexión
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Abrimos a todos para despliegue
    allow_credentials=False, # Si usamos "*", credentials debe ser False
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrando los routers de Dominio
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
