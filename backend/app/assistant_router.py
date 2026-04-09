import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
import jwt
from app.db import get_db

# ==============================================================================
# 0. CONFIGURACIÓN BASE Y MODELOS
# ==============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-prod")
ALGORITHM = "HS256"

class UserContext(BaseModel):
    user_id: str
    tenant_id: str
    role: str

# Dependencia simulada del cliente de BD (usualmente supabase-py o asyncpg)
def get_db_client():
    # Retorna tu cliente de BD. Ej: supabase.create_client(URL, KEY)
    return "db_client_instance" 

# ==============================================================================
# 1. AUTENTICACIÓN: Validación de JWT y Extracción de Tenant
# ==============================================================================
def get_current_user(authorization: str = Header(None)) -> UserContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado o formato inválido (Esperado: Bearer <token>)"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Decodificar el JWT usando nuestra clave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        role: str = payload.get("role")
        
        if user_id is None or tenant_id is None:
            raise HTTPException(status_code=401, detail="Token no contiene credenciales de Tenant válidas")
        
        return UserContext(user_id=user_id, tenant_id=tenant_id, role=role)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token ha expirado")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==============================================================================
# 2. RESOLUCIÓN DE MÓDULOS ACTIVOS DEL TENANT
# ==============================================================================
def get_tenant_active_modules(
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
) -> List[str]:
    """
    Consulta a la BD cuáles son los módulos que este tenant ha pagado/activado.
    """
    # Ejemplo conceptual usando el cliente de Supabase (Python):
    # response = db.table("tenant_modules").select("module_name").eq("tenant_id", current_user.tenant_id).eq("is_active", True).execute()
    # active_modules = [row['module_name'] for row in response.data]
    
    active_modules = ["core", "crm"]  # Simulado
    
    # IMPORTANTE: Siempre incluimos el 'core' que todos tienen por defecto
    if "core" not in active_modules:
        active_modules.append("core")
        
    return active_modules

# ==============================================================================
# 3. REGISTRO GLOBAL DE SKILLS (JSON SCHEMAS)
# ==============================================================================
# Aquí definimos las herramientas (Function Calling) asociadas a cada módulo
MODULE_TOOLS_REGISTRY: Dict[str, List[Dict[str, Any]]] = {
    "core": [],
    "crm": [
        {
            "type": "function",
            "function": {
                "name": "create_crm_customer",
                "description": "Crea un nuevo cliente o prospecto en el CRM.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "first_name": {"type": "string", "description": "Nombre del cliente"},
                        "last_name": {"type": "string", "description": "Apellido del cliente"},
                        "email": {"type": "string"},
                        "customer_type": {"type": "string", "enum": ["client", "prospect"]}
                    },
                    "required": ["first_name", "customer_type"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_crm_customers",
                "description": "Busca clientes o prospectos en el CRM por nombre o email.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Término de búsqueda"}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_crm_customer",
                "description": "Actualiza la información de un cliente o prospecto existente en el CRM. Requiere el ID del cliente.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "El ID UUID del cliente a modificar"},
                        "first_name": {"type": "string"},
                        "last_name": {"type": "string"},
                        "email": {"type": "string"},
                        "company": {"type": "string", "description": "Compañía o empresa del cliente"},
                        "phone": {"type": "string"},
                        "status": {"type": "string"}
                    },
                    "required": ["customer_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "add_crm_interaction",
                "description": "Añade una iteración, actividad, actualización o historial (meeting, call, email, note, sale) a un prospecto. Requiere ID del cliente.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "El ID UUID del prospecto"},
                        "interaction_type": {"type": "string", "description": "Tipo de evento, debes usar uno de: 'meeting', 'call', 'email', 'note', 'sale'"},
                        "description": {"type": "string", "description": "Detalles del historial o evento reportado (qué se dijo, acordó, envió, etc)"}
                    },
                    "required": ["customer_id", "interaction_type", "description"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_customer_interactions",
                "description": "Obtiene el historial completo de interacciones con un cliente específico. Muestra fechas, tipos y detalles de todas las interacciones.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "El ID UUID del cliente del cual se quieren obtener las interacciones"}
                    },
                    "required": ["customer_id"]
                }
            }
        }
    ],
    "inventory": [
         {
            "type": "function",
            "function": {
                "name": "check_product_stock",
                "description": "Consulta la disponibilidad y precio de un producto en el inventario.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_name": {"type": "string"}
                    },
                    "required": ["product_name"]
                }
            }
        }
    ],
    "knowledge_base": [
         {
            "type": "function",
            "function": {
                "name": "search_obsidian_notes",
                "description": "Busca información en las notas de conocimiento de la empresa (Wiki/Reglamentos).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query_text": {"type": "string", "description": "Pregunta o texto a buscar en el conocimiento"}
                    },
                    "required": ["query_text"]
                }
            }
        }
    ]
}

# ==============================================================================
# 4. ROUTER DINÁMICO DE SKILLS PARA EL ASISTENTE
# ==============================================================================
def build_assistant_tools_for_tenant(active_modules: List[str]) -> List[Dict[str, Any]]:
    """
    Construye de forma dinámica el arreglo 'tools' para enviarle al LLM (OpenAI/Gemini)
    basado estrictamente en los módulos a los que el Tenant tiene acceso.
    """
    assistant_tools = []
    
    for module in active_modules:
        # Si el módulo pagado existe en nuestro registro de herramientas, lo inyectamos
        if module in MODULE_TOOLS_REGISTRY:
            assistant_tools.extend(MODULE_TOOLS_REGISTRY[module])
            
    return assistant_tools

# ==============================================================================
# EJEMPLO DE ENDPOINT EN FASTAPI PARA CHATEAR CON LA IA
# ==============================================================================
from fastapi import APIRouter
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None

@router.post("/chat")
async def chat_with_assistant(
    request: ChatRequest,
    current_user: UserContext = Depends(get_current_user),
    active_modules: List[str] = Depends(get_tenant_active_modules),
    db: Any = Depends(get_db)
):
    # 1. Obtener los tools permitidos (Inyección Dinámica de Skills)
    allowed_tools = build_assistant_tools_for_tenant(active_modules)
    
    # 2. Obtener la configuración del LLM del Tenant
    response = db.table("tenants").select("company_name, ai_provider, ai_model, ai_api_key, ai_company_rules").eq("id", current_user.tenant_id).execute()
    tenant_settings = response.data[0] if response.data else {}
    
    company_name = tenant_settings.get("company_name") or "Tu Empresa"
    ai_provider = tenant_settings.get("ai_provider") or "openai"
    ai_model = tenant_settings.get("ai_model")
    ai_api_key = tenant_settings.get("ai_api_key")
    ai_company_rules = tenant_settings.get("ai_company_rules") or ""
    
    if not ai_api_key:
        return {
            "status": "error",
            "reply": "Por favor, configura la Clave de API en los Ajustes del Sistema para activar tu Asistente."
        }
    
    import litellm
    
    # Map provider to a default capable model string for litellm
    model_map = {
        "openai": "gpt-4o-mini",
        "anthropic": "anthropic/claude-3-5-sonnet-20240620",
        "gemini": "gemini/gemini-2.0-flash", # Updated to a more standard version
        "grok": "xai/grok-beta",
        "openrouter": "openrouter/google/gemma-2-9b-it:free",
    }
    
    # PRIORIDAD: 1. Modelo específico guardado, 2. Mapa por defecto del proveedor
    base_model = ai_model if ai_model else model_map.get(ai_provider, "gpt-4o-mini")
    
    # Asegurar que el modelo tenga el prefijo del proveedor para que litellm sepa qué API llamar
    # Si ya contiene un '/', asumimos que ya tiene el prefijo de provider (ej: 'openai/gpt-4o')
    # O si es de los modelos estándar que litellm identifica solos.
    model_name = base_model
    if ai_provider == "openrouter" and not base_model.startswith("openrouter/"):
        model_name = f"openrouter/{base_model}"
    elif ai_provider == "gemini" and not base_model.startswith("gemini/"):
        model_name = f"gemini/{base_model}"
    elif ai_provider == "anthropic" and not base_model.startswith("anthropic/"):
        model_name = f"anthropic/{base_model}"
    elif ai_provider == "grok" and not base_model.startswith("xai/"):
         model_name = f"xai/{base_model}"
    
    # Limpiar tools vacío para litellm porque si enviamos un arreglo vacío, algunos providers fallan
    litellm_tools = allowed_tools if len(allowed_tools) > 0 else None

    # COntrolador del prompt dinámico
    system_prompt = f"Eres el sistema de IA integrado en el ERP de '{company_name}'. Eres muy profesional, amable y siempre respondes en español."
    if ai_company_rules:
        system_prompt += f"\n\nDIRECTRICES ESPECÍFICAS DE {company_name.upper()}:\n{ai_company_rules}"
    
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    if request.history:
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})
        # Verificamos si el último mensaje del history es diferente del request.message
        if messages[-1]["content"] != request.message:
            messages.append({"role": "user", "content": request.message})
    else:
        messages.append({"role": "user", "content": request.message})
    
    try:
        # Algunos providers como Gemini fallan rotundamente con 404 si el esquema de tools 
        # contiene tipos o enums que no soportan completamente en su API v1beta actual.
        # Por seguridad de la prueba, intentaremos conectar sin tools si falla la primera vez.
        
        try:
            response = await litellm.acompletion(
                model=model_name,
                messages=messages,
                tools=litellm_tools,
                api_key=ai_api_key
            )
        except Exception as first_error:
            if ai_provider == "gemini" and "404" in str(first_error):
                # Fallback sin tools para Gemini
                response = await litellm.acompletion(
                    model=model_name,
                    messages=messages,
                    api_key=ai_api_key
                )
            else:
                raise first_error
        
        if not hasattr(response, 'choices') or len(response.choices) == 0:
            return {
                "status": "error",
                "reply": "El motor de IA bloqueó la respuesta o no pudo generarla debido a sus filtros de seguridad internos."
            }
            
        reply_content = response.choices[0].message.content
        
        # En caso de que el modelo devuelva un tool_call, lo ejecutamos de forma aislada
        tool_calls = response.choices[0].message.tool_calls
        if tool_calls:
            import json
            tool_messages = []
            
            # Anexamos la respuesta parcial del LLM (que contiene los tool_calls solicitados)
            # para mantener el hilo conversacional coherente
            assistant_msg = response.choices[0].message
            # Asegurarse de quitar campos que causan errores en litellm
            msg_dict = assistant_msg.model_dump(exclude_none=True)
            tool_messages.append(msg_dict)
            
            # Ejecutamos cada función a nivel Backend inyectando el TENANT_ID por seguridad
            for t in tool_calls:
                args = json.loads(t.function.arguments)
                tool_name = t.function.name
                
                result_data = None
                
                if tool_name == "get_my_user_info":
                    result_data = {
                        "id": current_user.user_id,
                        "role": current_user.role,
                        "tenant_id": current_user.tenant_id
                    }
                elif tool_name == "search_crm_customers":
                    query_text = args.get("query", "").strip()
                    
                    # AISLAMIENTO ESTRICTO MULTI-TENANT
                    # Jamás confiamos en el LLM para proveer el tenant_id. Lo quemamos en la consulta:
                    
                    # FIX: Búsqueda mejorada que busca en múltiples campos simultáneamente
                    # Dividir el query en palabras para búsqueda más flexible
                    search_terms = query_text.split()
                    
                    all_results = []
                    seen_ids = set()
                    
                    # Buscar cada término en múltiples campos (first_name, last_name, email)
                    for term in search_terms:
                        if not term:
                            continue
                            
                        # Buscar en first_name
                        db_res = db.table("crm_customers") \
                            .select("id, first_name, last_name, email, company, status") \
                            .eq("tenant_id", current_user.tenant_id) \
                            .ilike("first_name", f"%{term}%") \
                            .execute()
                        
                        for result in db_res.data:
                            if result["id"] not in seen_ids:
                                all_results.append(result)
                                seen_ids.add(result["id"])
                        
                        # Buscar en last_name
                        db_res = db.table("crm_customers") \
                            .select("id, first_name, last_name, email, company, status") \
                            .eq("tenant_id", current_user.tenant_id) \
                            .ilike("last_name", f"%{term}%") \
                            .execute()
                        
                        for result in db_res.data:
                            if result["id"] not in seen_ids:
                                all_results.append(result)
                                seen_ids.add(result["id"])
                        
                        # Buscar en email
                        db_res = db.table("crm_customers") \
                            .select("id, first_name, last_name, email, company, status") \
                            .eq("tenant_id", current_user.tenant_id) \
                            .ilike("email", f"%{term}%") \
                            .execute()
                        
                        for result in db_res.data:
                            if result["id"] not in seen_ids:
                                all_results.append(result)
                                seen_ids.add(result["id"])
                    
                    result_data = all_results
                    
                elif tool_name == "create_crm_customer":
                    # AISLAMIENTO ESTRICTO MULTI-TENANT: Forzamos la llave tenant_id desde la sesion segura
                    insert_payload = {
                        "tenant_id": current_user.tenant_id,
                        "first_name": args.get("first_name"),
                        "last_name": args.get("last_name", ""),
                        "email": args.get("email", ""),
                        "customer_type": args.get("customer_type", "prospect")
                    }
                    db_res = db.table("crm_customers").insert(insert_payload).execute()
                    result_data = db_res.data
                elif tool_name == "update_crm_customer":
                    customer_id = args.get("customer_id")
                    if not customer_id:
                        result_data = {"error": "Se requiere el customer_id para actualizar."}
                    else:
                        update_payload = {}
                        for key in ["first_name", "last_name", "email", "company", "phone", "status"]:
                            if key in args:
                                update_payload[key] = args[key]
                        
                        if update_payload:
                            # AISLAMIENTO ESTRICTO MULTI-TENANT: Solo dejamos actualizar si el tenant_id coincide
                            db_res = db.table("crm_customers") \
                                .update(update_payload) \
                                .eq("id", customer_id) \
                                .eq("tenant_id", current_user.tenant_id) \
                                .execute()
                            result_data = db_res.data
                        else:
                            result_data = {"error": "No se enviaron campos válidos para actualizar."}
                elif tool_name == "add_crm_interaction":
                    customer_id = args.get("customer_id")
                    interaction_type = args.get("interaction_type")
                    description = args.get("description")
                    if not customer_id or not interaction_type or not description:
                        result_data = {"error": "Se requieren customer_id, interaction_type y description."}
                    else:
                        insert_payload = {
                            "tenant_id": current_user.tenant_id,
                            "customer_id": customer_id,
                            "interaction_type": interaction_type,
                            "description": description,
                            "created_by": current_user.user_id
                        }
                        # AISLAMIENTO ESTRICTO MULTI-TENANT
                        # OJO: Supabase nos validará en la foreign key. O idealmente verificamos que el prospecto sea nuestro:
                        db_res = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
                        if not db_res.data:
                            result_data = {"error": "El cliente no existe o no tienes permiso para interactuar con él."}
                        else:
                            db_inter_res = db.table("crm_interactions").insert(insert_payload).execute()
                            result_data = db_inter_res.data
                elif tool_name == "get_customer_interactions":
                    customer_id = args.get("customer_id")
                    if not customer_id:
                        result_data = {"error": "Se requiere el customer_id para obtener las interacciones."}
                    else:
                        # AISLAMIENTO ESTRICTO MULTI-TENANT: Obtener interacciones solo del tenant actual
                        db_res = db.table("crm_interactions") \
                            .select("*") \
                            .eq("customer_id", customer_id) \
                            .eq("tenant_id", current_user.tenant_id) \
                            .order("interaction_date", desc=True) \
                            .execute()
                        result_data = db_res.data
                else:
                    result_data = {"error": f"La herramienta {tool_name} aún no está conectada a la Base de Datos"}
                
                # Devolvemos el resultado protegido al LLM (usando jsonable_encoder para manejar datetimes)
                tool_messages.append({
                    "role": "tool",
                    "tool_call_id": t.id,
                    "name": tool_name,
                    "content": json.dumps(jsonable_encoder(result_data))
                })
            
            # Volvemos a invocar a Gemini, pero ahora con los resultados precisos
            final_messages = messages + tool_messages
            
            second_response = await litellm.acompletion(
                model=model_name,
                messages=final_messages,
                tools=litellm_tools,
                api_key=ai_api_key
            )
            
            if hasattr(second_response, 'choices') and len(second_response.choices) > 0:
                reply_content = second_response.choices[0].message.content
            else:
                reply_content = "El Asistente ejecutó la herramienta, pero no devolvió un mensaje final."

        # Preparar la respuesta base
        response_data = {
            "status": "success",
            "tenant_id": current_user.tenant_id,
            "ai_provider_used": ai_provider,
            "model_used": model_name,
            "reply": reply_content or "No hubo respuesta válida del Asistente."
        }

        # Añadir información de tool_calls si se ejecutaron herramientas
        if tool_calls:
            tool_descriptions = {
                "search_crm_customers": "Buscando clientes",
                "create_crm_customer": "Creando cliente",
                "update_crm_customer": "Actualizando cliente",
                "add_crm_interaction": "Añadiendo interacción",
                "get_customer_interactions": "Consultando historial de interacciones",
                "check_product_stock": "Consultando inventario",
                "search_obsidian_notes": "Buscando en base de conocimiento"
            }
            
            response_data["tool_calls_info"] = [
                {
                    "name": t.function.name,
                    "description": tool_descriptions.get(t.function.name, f"Ejecutando {t.function.name}")
                }
                for t in tool_calls
            ]

        return response_data
    except Exception as e:
        return {
            "status": "error",
            "reply": f"Ha ocurrido un error al conectar con el motor de IA ({ai_provider}): {str(e)}"
        }

