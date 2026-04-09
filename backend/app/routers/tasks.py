from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi.encoders import jsonable_encoder
from app.db import get_db
from app.assistant_router import get_current_user, UserContext

# ==============================================================================
# ROUTER
# ==============================================================================
router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# ==============================================================================
# SCHEMAS
# ==============================================================================
class TaskBase(BaseModel):
    title: str = Field(..., description="Título de la tarea")
    description: Optional[str] = Field(None, description="Descripción detallada de la tarea")
    status: str = Field(default="pending", description="Estado de la tarea: pending, in_progress, completed")
    priority: str = Field(..., description="Prioridad: low, medium, high, urgent")
    due_date: Optional[datetime] = Field(None, description="Fecha de vencimiento de la tarea")
    tag: Optional[str] = Field(None, description="Etiqueta o tag para categorizar la tarea (e.g., #sales, #support, #urgent)")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    tag: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    tenant_id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

# ==============================================================================
# ENDPOINTS
# ==============================================================================
@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Crea una nueva tarea para el tenant actual.
    """
    # Validar prioridad (estos son críticos para UI)
    valid_priorities = ["low", "medium", "high", "urgent"]
    if task.priority not in valid_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"priority debe ser uno de: {', '.join(valid_priorities)}"
        )
    
    # Validar estado (crítico para UI)
    valid_statuses = ["pending", "in_progress", "completed"]
    if task.status and task.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"status debe ser uno de: {', '.join(valid_statuses)}"
        )
    
    # Eliminamos validación rígida de tags para permitir flexibilidad (e.g., #ventas, #seguimiento)
    
    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    data = jsonable_encoder(task)
    data["tenant_id"] = current_user.tenant_id
    data["created_by"] = current_user.user_id
    
    # DEBUG: Imprimir datos para depuración
    print(f"DEBUG: Creando tarea con datos: {data}")
    
    try:
        response = db.table("tasks").insert(data).execute()
        print(f"DEBUG: Respuesta de Supabase: {response}")
        return response.data[0]
    except Exception as e:
        print(f"DEBUG: Error al crear tarea: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear tarea: {str(e)}"
        )


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Lista todas las tareas del tenant actual con filtros opcionales.
    """
    try:
        query = db.table("tasks").select("*").eq("tenant_id", current_user.tenant_id).order("created_at", desc=True)
        
        # Aplicar filtro de estado si se proporciona
        if status_filter:
            valid_statuses = ["pending", "in_progress", "completed"]
            if status_filter not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"status debe ser uno de: {', '.join(valid_statuses)}"
                )
            query = query.eq("status", status_filter)
        
        # Aplicar filtro de prioridad si se proporciona
        if priority_filter:
            valid_priorities = ["low", "medium", "high", "urgent"]
            if priority_filter not in valid_priorities:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"priority debe ser uno de: {', '.join(valid_priorities)}"
                )
            query = query.eq("priority", priority_filter)
        
        response = query.execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar tareas: {str(e)}"
        )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Obtiene una tarea específica por ID.
    """
    try:
        response = db.table("tasks") \
            .select("*") \
            .eq("id", task_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener tarea: {str(e)}"
        )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Actualiza una tarea existente.
    """
    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    update_data = jsonable_encoder(task_update, exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron campos para actualizar"
        )

    # Validar prioridad si se proporciona
    if "priority" in update_data:
        valid_priorities = ["low", "medium", "high", "urgent"]
        if update_data["priority"] not in valid_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"priority debe ser uno de: {', '.join(valid_priorities)}"
            )
    
    # Validar estado si se proporciona
    if "status" in update_data:
        valid_statuses = ["pending", "in_progress", "completed"]
        if update_data["status"] not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"status debe ser uno de: {', '.join(valid_statuses)}"
            )

    try:
        response = db.table("tasks") \
            .update(update_data) \
            .eq("id", task_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar tarea: {str(e)}"
        )


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Elimina una tarea existente.
    """
    try:
        response = db.table("tasks") \
            .delete() \
            .eq("id", task_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        return {"message": "Tarea eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar tarea: {str(e)}"
        )
