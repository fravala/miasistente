from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.db import get_db
from app.assistant_router import get_current_user
from app.schemas.settings import TenantAISettingsUpdate, TenantAISettingsResponse

router = APIRouter()

@router.get("/ai", response_model=TenantAISettingsResponse)
async def get_ai_settings(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    # Only allow fetching your own tenant data
    tenant_id = current_user.tenant_id
    
    response = supabase.table("tenants") \
        .select("ai_provider, ai_model, ai_api_key, ai_company_rules") \
        .eq("id", tenant_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant_data = response.data[0]
    
    return TenantAISettingsResponse(
        ai_provider=tenant_data.get("ai_provider") or "openai",
        ai_model=tenant_data.get("ai_model"),
        has_api_key=bool(tenant_data.get("ai_api_key")),
        ai_company_rules=tenant_data.get("ai_company_rules")
    )

@router.put("/ai", response_model=TenantAISettingsResponse)
async def update_ai_settings(
    settings: TenantAISettingsUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    if current_user.role not in ["super_admin", "tenant_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update settings")

    tenant_id = current_user.tenant_id
    
    update_data = {
        "ai_provider": settings.ai_provider,
        "ai_model": settings.ai_model
    }
    
    if settings.ai_api_key:
        update_data["ai_api_key"] = settings.ai_api_key
        
    if settings.ai_company_rules is not None:
        update_data["ai_company_rules"] = settings.ai_company_rules

    try:
        response = supabase.table("tenants").update(update_data).eq("id", tenant_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="No se encontró el tenant o no hay cambios que aplicar.")

        updated_tenant = response.data[0]
        
        return TenantAISettingsResponse(
            ai_provider=updated_tenant.get("ai_provider") or "openai",
            ai_model=updated_tenant.get("ai_model"),
            has_api_key=bool(updated_tenant.get("ai_api_key")),
            ai_company_rules=updated_tenant.get("ai_company_rules")
        )
    except Exception as e:
        print(f"ERROR ACTUALIZANDO IA: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en servidor al guardar: {str(e)}")
