from pydantic import BaseModel
from typing import Optional

class TenantAISettingsUpdate(BaseModel):
    ai_provider: str
    ai_model: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_company_rules: Optional[str] = None

class TenantAISettingsResponse(BaseModel):
    ai_provider: str
    ai_model: Optional[str] = None
    has_api_key: bool # Nunca devolvemos la key, solo un booleano para indicar si ya está guardada
    ai_company_rules: Optional[str] = None
