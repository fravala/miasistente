from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# ==============================================================================
# MODELOS BASE PARA CLIENTES Y PROSPECTOS
# ==============================================================================
class CustomerBase(BaseModel):
    first_name: str = Field(..., description="Nombre del cliente o empresa")
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_type: str = Field(..., description="Debe ser obligatoriamente 'prospect' o 'client'")
    status: str = Field(default="new", description="Ej: new, contacted, won, lost")
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Respuesta que será enviada al Frontend, incluyendo IDs y auditoría
class CustomerResponse(CustomerBase):
    id: UUID
    tenant_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    # FIX: Add interactions_count field to display number of interactions for each customer
    interactions_count: int = Field(default=0, description="Number of interactions/notes for this customer")

    model_config = {
        "from_attributes": True
    }

# ==============================================================================
# MODELOS PARA INTERACCIONES (HISTORIAL)
# ==============================================================================
class InteractionBase(BaseModel):
    interaction_type: str = Field(..., description="Ej: meeting, call, email, note, sale")
    description: str
    interaction_date: Optional[datetime] = None
    # FIX: Accept task_id as string to avoid UUID serialization issues
    task_id: Optional[str] = Field(None, description="Optional reference to a task")

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    interaction_type: Optional[str] = None
    description: Optional[str] = None
    interaction_date: Optional[datetime] = None
    # FIX: Accept task_id as string to avoid UUID serialization issues
    task_id: Optional[str] = None

class InteractionResponse(InteractionBase):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
