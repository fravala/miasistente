# MiAsistente ERP & AI

Sistema ERP SaaS con IA integrada, backend en FastAPI y frontend en Next.js.

## Estructura del Proyecto

- `backend/`: API Core desarrollada con FastAPI.
- `frontend/`: App Dashboard desarrollada con Next.js e IA UI components.
- `supabase/`: Migraciones y configuración de base de datos.

## Despliegue en Dokploy

Este repositorio está preparado para auto-despliegue en Dokploy utilizando Docker Compose.

1. Conecta tu cuenta de GitHub a Dokploy.
2. Crea un nuevo proyecto y selecciona este repositorio.
3. Dokploy detectará automáticamente el archivo `docker-compose.yml`.
4. Configura las variables de entorno (.env) en el panel de Dokploy.
5. ¡Despliega!

## Desarrollo Local

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
