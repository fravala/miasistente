from fastapi import APIRouter
from app.db import supabase

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("/")
def get_tasks():
    res = supabase.table("tasks").select("*").execute()
    return res.data
