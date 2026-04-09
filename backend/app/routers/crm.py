from fastapi import APIRouter
from app.db import supabase
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/crm", tags=["CRM"])

class Customer(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "Lead"

@router.get("/customers")
def get_customers():
    res = supabase.table("crm_customers").select("*").execute()
    return res.data

@router.post("/customers")
def create_customer(customer: Customer):
    res = supabase.table("crm_customers").insert(customer.model_dump()).execute()
    return res.data
