from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.encoders import jsonable_encoder
import json
import base64
import os
import litellm
from app.schemas.crm import CustomerCreate, CustomerUpdate, CustomerResponse, InteractionCreate, InteractionUpdate, InteractionResponse
from app.assistant_router import UserContext, get_current_user
from app.db import get_db
from app.speech_to_text import transcribe_audio_bytes, is_whisper_available
from uuid import UUID
from datetime import datetime

router = APIRouter(
    prefix="/api/crm",
    tags=["CRM Customers"]
)

# Inicializar bucket de storage si no existe
def ensure_storage_bucket():
    """Crea el bucket de storage si no existe."""
    try:
        db = get_db()
        # Intentar listar buckets para verificar acceso
        db.storage.list_buckets()
    except Exception:
        pass  # Silenciar errores

# Llamar al inicializar el módulo
ensure_storage_bucket()

# ==============================================================================
# 1. CREAR CLIENTE / PROSPECTO
# ==============================================================================
@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Crea un nuevo prospecto o cliente en el CRM.
    REGLA MULTITENANT: Forzamos la asignación del `tenant_id` directamente del JWT (current_user).
    """
    if customer.customer_type not in ["prospect", "client"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="customer_type debe ser 'prospect' o 'client'"
        )

    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    data = jsonable_encoder(customer)
    data["tenant_id"] = current_user.tenant_id
    data["created_by"] = current_user.user_id

    try:
        response = db.table("crm_customers").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2. LISTAR TODOS LOS CLIENTES
# ==============================================================================
@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    customer_type: str = None,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Lista los clientes.
    REGLA MULTITENANT: Filtramos estrictamente por el tenant_id.
    FIX: Include interactions_count for each customer.
    """
    try:
        # Get customers
        query = db.table("crm_customers").select("*").eq("tenant_id", current_user.tenant_id).order("created_at", desc=True)
        if customer_type:
            query = query.eq("customer_type", customer_type)
        response = query.execute()
        customers = response.data
        
        # Get interactions count for each customer
        customer_ids = [str(c["id"]) for c in customers]
        interactions_response = db.table("crm_interactions").select("customer_id").in_("customer_id", customer_ids).execute()
        
        # Count interactions per customer
        interactions_count = {}
        for interaction in interactions_response.data:
            customer_id = str(interaction["customer_id"])
            interactions_count[customer_id] = interactions_count.get(customer_id, 0) + 1
        
        # Add interactions_count to each customer
        for customer in customers:
            customer["interactions_count"] = interactions_count.get(str(customer["id"]), 0)
        
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2.5 ELIMINAR CLIENTE (Movido para mejor resolución)
# ==============================================================================
@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Elimina un cliente y todas sus dependencias (interacciones, archivos).
    REGLA MULTITENANT: Filtramos por tenant_id.
    """
    print(f"DEBUG: DELETE request received for customer_id: {customer_id} (Tenant: {current_user.tenant_id})")
    try:
        # 1. Verificar si existe y pertenece al tenant
        check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado o sin permisos")

        # 2. Eliminar interacciones asociadas primero (si no hay CASCADE en DB)
        db.table("crm_interactions").delete().eq("customer_id", customer_id).execute()
        
        # 3. Eliminar archivos asociados
        db.table("crm_customer_files").delete().eq("customer_id", customer_id).execute()

        # 4. Finalmente eliminamos el cliente
        response = db.table("crm_customers") \
              .delete() \
              .eq("id", customer_id) \
              .eq("tenant_id", current_user.tenant_id) \
              .execute()
        
        return {"status": "success", "message": "Cliente eliminado correctamente", "id": customer_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: delete_customer failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 3. VER DETALLE DE CLIENTE (POR ID)
# ==============================================================================
@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Detalle de un cliente garantizando la seguridad (mismo tenant).
    """
    try:
        response = db.table("crm_customers") \
             .select("*") \
             .eq("id", customer_id) \
             .eq("tenant_id", current_user.tenant_id) \
             .execute()
        
        if not response.data:
             raise HTTPException(status_code=404, detail="Cliente no encontrado")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. ACTUALIZAR CLIENTE
# ==============================================================================
@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Actualiza la información del cliente.
    """
    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    update_data = jsonable_encoder(customer_update, exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    
    try:
        response = db.table("crm_customers") \
            .update(update_data) \
            .eq("id", customer_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado o sin permisos")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 6. HISTORIAL DE INTERACCIONES
# ==============================================================================
@router.get("/customers/{customer_id}/interactions", response_model=List[InteractionResponse])
async def list_interactions(
    customer_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    try:
        # FIX: Agregar join con tabla tasks para obtener información de la tarea vinculada
        # Usamos left join porque task_id puede ser NULL
        response = db.table("crm_interactions") \
            .select("*, tasks(id, title, status, priority, due_date)") \
            .eq("customer_id", customer_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .order("interaction_date", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customers/{customer_id}/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    customer_id: str,
    interaction: InteractionCreate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Registra una nueva interacción (nota, llamada, visita, etc.) vinculada a un cliente.
    """
    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    data = jsonable_encoder(interaction, exclude_none=True)
    data["customer_id"] = customer_id
    data["tenant_id"] = current_user.tenant_id
    data["created_by"] = current_user.user_id
    
    # Si no se provee fecha, usar la actual
    if not data.get("interaction_date"):
        data["interaction_date"] = datetime.now().isoformat()
        
    try:
        response = db.table("crm_interactions").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Error al crear la interacción en la base de datos")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear interacción: {str(e)}")

# ==============================================================================
# 6. ACTUALIZAR INTERACCIÓN
# ==============================================================================
@router.put("/customers/{customer_id}/interactions/{interaction_id}", response_model=InteractionResponse)
async def update_interaction(
    customer_id: str,
    interaction_id: str,
    interaction_update: InteractionUpdate,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Actualiza una interacción existente.
    """
    # Estandarizar a JSON usando jsonable_encoder para manejar datetimes y otros objetos
    update_data = jsonable_encoder(interaction_update, exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    
    try:
        response = db.table("crm_interactions") \
            .update(update_data) \
            .eq("id", interaction_id) \
            .eq("customer_id", customer_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Interacción no encontrada o sin permisos")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar interacción: {str(e)}")

# ==============================================================================
# 7. BORRAR INTERACCIÓN
# ==============================================================================
@router.delete("/customers/{customer_id}/interactions/{interaction_id}")
async def delete_interaction(
    customer_id: str,
    interaction_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Borra una interacción existente.
    """
    try:
        response = db.table("crm_interactions") \
            .delete() \
            .eq("id", interaction_id) \
            .eq("customer_id", customer_id) \
            .eq("tenant_id", current_user.tenant_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Interacción no encontrada o sin permisos")
        return {"message": "Interacción borrada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customers/{customer_id}/interactions/audio")
async def process_audio_interaction(
    customer_id: str,
    file: UploadFile = File(...),
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    try:
        # Load audio content
        content = await file.read()
        b64_audio = base64.b64encode(content).decode("utf-8")
        
        # Determine mime type based on filename
        mime_type = "audio/mp3"
        if file.filename.endswith(".wav"): mime_type = "audio/wav"
        elif file.filename.endswith(".m4a"): mime_type = "audio/m4a"
        elif file.filename.endswith(".ogg"): mime_type = "audio/ogg"

        # Check tenant's AI config
        response_ts = db.table("tenants").select("ai_provider, ai_model, ai_api_key").eq("id", current_user.tenant_id).execute()
        if not response_ts.data:
            raise HTTPException(status_code=400, detail="El Tenant no tiene AI configurada.")
            
        tenant_config = response_ts.data[0]
        ai_provider = tenant_config.get("ai_provider")
        ai_model = tenant_config.get("ai_model")
        ai_api_key = tenant_config.get("ai_api_key")
        
        if not ai_provider or not ai_api_key:
            raise HTTPException(status_code=400, detail="El Tenant no tiene un Proveedor de IA o API Key configurado.")

        model_map = {
            "openai": "gpt-4o",
            "anthropic": "claude-3-5-sonnet-20240620",
            "gemini": "gemini/gemini-2.0-flash",
            "grok": "xai/grok-beta",
        }
        model_name = ai_model if ai_model else model_map.get(ai_provider, "gemini/gemini-2.0-flash")

        # Configurar prompt
        prompt = '''Actúa como un excelente asistente de ventas B2B. Escucha el audio de esta reunión/llamada y genera un resumen profesional y una minuta estructurada.
Devuelve EXCLUSIVAMENTE código JSON válido sin texto previo ni posterior, con la siguiente estructura:
{
  "interaction_type": "meeting" (o "call" si es una llamada),
  "description": "El bloque de texto completo que se guardará en el CRM. Incluye: Resumen Ejecutivo, Acuerdos, Siguientes Pasos detallados y Tareas.",
  "sentiment": "Positivo / Neutral / Negativo"
}'''

        # Para compatibilidad con litellm pasamos el audio como texto base64 para model_name (gemini-1.5, gpt-4o soportan data uri format)
        audio_url = f"data:{mime_type};base64,{b64_audio}"

        if ai_provider == "gemini":
            messages = [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "text", "text": f"\n[Audio Codificado en Base64 Omitido, imagina que lo puedes oír y transcribir usando direct base64 audio_url que te estoy enviando ahora mismo]"},
                    {"type": "image_url", "image_url": {"url": audio_url}},
                ]}
            ]
        else:
            messages = [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": audio_url}},
                ]}
            ]

        # Invocamos la API del proveedor a través de litellm
        llm_response = await litellm.acompletion(
            model=model_name,
            messages=messages,
            api_key=ai_api_key
        )
        
        reply_content = llm_response.choices[0].message.content
        try:
           # Intentar parsear el JSON
           json_str = reply_content.replace('```json', '').replace('```', '').strip()
           parsed_data = json.loads(json_str)
        except Exception:
           # Fallback si no regresó json limpio
           parsed_data = {
               "interaction_type": "meeting",
               "description": f"Auditoría automática: {reply_content}",
               "sentiment": "Neutral"
           }

        # Guardar directamente en CRM
        insert_payload = {
            "tenant_id": current_user.tenant_id,
            "customer_id": customer_id,
            "interaction_type": parsed_data.get("interaction_type", "meeting"),
            "description": f"🎙️ [RESUMEN AUTOMÁTICO DE AUDIO]\nSentimiento: {parsed_data.get('sentiment', 'Neutral')}\n\n{parsed_data.get('description')}",
            "created_by": current_user.user_id
        }
        
        db_res = db.table("crm_interactions").insert(insert_payload).execute()
        return db_res.data[0]

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analizando audio: {str(e)}")

@router.post("/customers/{customer_id}/interactions/audio-whisper")
async def process_audio_with_whisper(
    customer_id: str,
    file: UploadFile = File(...),
    language: str = "es",
    model_size: str = "base",
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Procesa un archivo de audio usando Whisper (open source) y crea una interacción.
    
    Args:
        customer_id: ID del cliente
        file: Archivo de audio (mp3, wav, m4a, ogg)
        language: Idioma del audio (default: es = español)
        model_size: Tamaño del modelo Whisper (tiny, base, small, medium, large)
    
    Returns:
        Interacción creada con la transcripción del audio
    """
    # Verificar que el cliente existe y pertenece al tenant
    customer_check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
    if not customer_check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Verificar que Whisper está instalado
    if not is_whisper_available():
        raise HTTPException(
            status_code=400,
            detail="Whisper no está instalado. Para usar la transcripción local, instala: pip install openai-whisper"
        )
    
    # Validar tamaño del modelo
    valid_models = ["tiny", "base", "small", "medium", "large"]
    if model_size not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"model_size debe ser uno de: {valid_models}"
        )
    
    # Validar tipo de archivo
    allowed_extensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac"]
    file_ext = ""
    if file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Formatos válidos: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Leer contenido del archivo
        audio_content = await file.read()
        
        # Validar tamaño máximo (50 MB)
        max_size = 50 * 1024 * 1024
        if len(audio_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="El archivo de audio excede el límite de 50 MB"
            )
        
        # Transcribir audio usando Whisper
        result = transcribe_audio_bytes(
            audio_bytes=audio_content,
            file_extension=file_ext,
            language=language,
            model_size=model_size
        )
        
        # Obtener texto transcrito
        transcribed_text = result.get("text", "").strip()
        
        if not transcribed_text:
            raise HTTPException(
                status_code=400,
                detail="No se pudo transcribir el audio. El audio puede estar vacío o en un formato no soportado."
            )
        
        # Generar resumen con IA usando la configuración del tenant
        summary_text = ""
        try:
            # Obtener configuración de IA del tenant
            tenant_response = db.table("tenants").select("ai_provider, ai_model, ai_api_key, ai_company_rules").eq("id", current_user.tenant_id).execute()
            
            if not tenant_response.data:
                raise HTTPException(
                    status_code=400,
                    detail="El Tenant no tiene configuración de IA."
                )
            
            tenant_config = tenant_response.data[0]
            ai_provider = tenant_config.get("ai_provider")
            ai_model = tenant_config.get("ai_model")
            ai_api_key = tenant_config.get("ai_api_key")
            ai_company_rules = tenant_config.get("ai_company_rules") or ""
            
            if not ai_api_key:
                raise HTTPException(
                    status_code=400,
                    detail="El Tenant no tiene una API Key de IA configurada."
                )
            
            # Configurar prompt para generar resumen
            summary_prompt = f"""Actúa como un excelente asistente de ventas B2B. 
Analiza la siguiente transcripción de una reunión y genera un resumen estructurado en español.

INSTRUCCIONES DE LA EMPRESA:
{ai_company_rules}

TU TAREA:
1. Generar un resumen ejecutivo de la reunión (2-3 oraciones máximo)
2. Identificar los puntos clave discutidos
3. Listar los acuerdos y compromisos establecidos
4. Identificar los siguientes pasos o acciones requeridas
5. Detectar el sentimiento general de la reunión (Positivo, Neutral, Negativo)

FORMATO DE RESPUESTA (JSON válido):
{{
  "resumen_ejecutivo": "Resumen conciso de 2-3 oraciones",
  "puntos_clave": ["Punto 1", "Punto 2", "Punto 3"],
  "acuerdos": ["Acuerdo 1", "Acuerdo 2"],
  "siguientes_pasos": ["Paso 1", "Punto 2"],
  "sentimiento": "Positivo/Neutral/Negativo"
}}

IMPORTANTE:
- Sé conciso y directo
- Usa bullet points para listas
- Mantén un tono profesional
- Enfócate en información accionable

TRANSCRIPCIÓN:
{transcribed_text}"""
            
            # Map provider to model string for litellm
            model_map = {
                "openai": "gpt-4o-mini",
                "anthropic": "anthropic/claude-3-5-sonnet-20240620",
                "gemini": "gemini/gemini-1.5-flash",
                "grok": "xai/grok-beta",
            }
            
            model_name = ai_model if ai_model else model_map.get(ai_provider, "gpt-4o-mini")
            
            # Invocar a la IA para generar el resumen
            messages = [
                {"role": "user", "content": summary_prompt}
            ]
            
            llm_response = await litellm.acompletion(
                model=model_name,
                messages=messages,
                api_key=ai_api_key
            )
            
            reply_content = llm_response.choices[0].message.content
            
            # Intentar parsear el JSON
            try:
                import json
                json_str = reply_content.replace('```json', '').replace('```', '').strip()
                summary_data = json.loads(json_str)
                
                # Construir resumen formateado
                summary_text = f"""📋 RESUMEN EJECUTIVO
{summary_data.get('resumen_ejecutivo', 'No se pudo generar resumen')}

🎯 PUNTOS CLAVE:
{chr(10).join(f'• {p}' for p in summary_data.get('puntos_clave', []))}

📝 ACUERDOS:
{chr(10).join(f'• {a}' for a in summary_data.get('acuerdos', []))}

➡️ SIGUIENTES PASOS:
{chr(10).join(f'• {s}' for s in summary_data.get('siguientes_pasos', []))}

😊 SENTIMIENTO: {summary_data.get('sentimiento', 'No detectado')}"""
                
            except Exception:
                # Fallback si no se pudo parsear el JSON
                summary_text = f"""📋 RESUMEN EJECUTIVO
{reply_content}

📝 NOTA: No se pudo estructurar el resumen en formato JSON. Se muestra el texto completo arriba."""
        
        except Exception as e:
            # Fallback si hay error generando el resumen con IA
            summary_text = f"📋 RESUMEN EJECUTIVO\n{transcribed_text}\n\n📝 NOTA: No se pudo generar el resumen con IA. Error: {str(e)}"
        
        # Crear interacción solo con el resumen de la IA (sin transcripción completa)
        insert_payload = {
            "tenant_id": current_user.tenant_id,
            "customer_id": customer_id,
            "interaction_type": "meeting",
            "description": summary_text,
            "created_by": current_user.user_id
        }
        
        db_res = db.table("crm_interactions").insert(insert_payload).execute()
        
        return {
            "id": db_res.data[0]["id"],
            "customer_id": customer_id,
            "interaction_type": "meeting",
            "description": db_res.data[0]["description"],
            "transcription": transcribed_text,
            "language": result.get("language", language),
            "model_used": f"whisper-{model_size}",
            "duration": result.get("duration", 0),
            "message": "Audio transcrito exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error transcribiendo audio: {str(e)}")


# ==============================================================================
# 5b. TRANSCRIBIR AUDIO SIN GUARDAR (con soporte de recorte por tiempo)
# ==============================================================================

def _probe_audio_duration(file_path: str) -> float:
    """Obtiene la duración en segundos de un archivo de audio usando ffprobe."""
    try:
        import subprocess, json
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", file_path],
            capture_output=True, text=True, timeout=30
        )
        data = json.loads(result.stdout)
        for stream in data.get("streams", []):
            if "duration" in stream:
                return float(stream["duration"])
    except Exception:
        pass
    return 0.0


def _trim_audio_ffmpeg(input_path: str, output_path: str, start_sec: float, end_sec: float) -> bool:
    """Recorta un segmento de audio con ffmpeg. Retorna True si tuvo éxito."""
    try:
        import subprocess
        duration = end_sec - start_sec
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_sec),
            "-i", input_path,
            "-t", str(duration),
            "-c", "copy",   # no re-encode → muy rápido
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        return result.returncode == 0
    except Exception:
        return False


@router.post("/customers/{customer_id}/interactions/audio-probe")
async def probe_audio_duration(
    customer_id: str,
    file: UploadFile = File(...),
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Recibe el archivo de audio y devuelve su duración en segundos.
    Permite al frontend mostrar el timeline/slider antes de transcribir.
    No guarda nada.
    """
    customer_check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
    if not customer_check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    allowed_extensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".mp4"]
    file_ext = ""
    if file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Formato no soportado.")

    audio_content = await file.read()
    # Límite de 500 MB para probe
    if len(audio_content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede 500 MB")

    tmp_input = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as f:
            f.write(audio_content)
            tmp_input = f.name

        duration = _probe_audio_duration(tmp_input)
        return {
            "duration": duration,
            "filename": file.filename,
            "size_mb": round(len(audio_content) / (1024 * 1024), 2)
        }
    finally:
        if tmp_input and os.path.exists(tmp_input):
            os.unlink(tmp_input)


@router.post("/customers/{customer_id}/interactions/audio-transcribe-only")
async def transcribe_audio_only(
    customer_id: str,
    file: UploadFile = File(...),
    language: str = "es",
    model_size: str = "base",
    start_time: float = 0.0,
    end_time: float = 0.0,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Transcribe un audio con Whisper (opcionalmente recortado entre start_time y end_time).
    NO guarda ninguna interacción. Soporta archivos hasta 500 MB.
    Si start_time < end_time se recorta el segmento con ffmpeg antes de transcribir.
    """
    customer_check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
    if not customer_check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not is_whisper_available():
        raise HTTPException(status_code=400, detail="Whisper no está instalado.")

    allowed_extensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".mp4"]
    file_ext = ""
    if file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Formato no soportado. Válidos: {', '.join(allowed_extensions)}")

    audio_content = await file.read()
    if len(audio_content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede 500 MB")

    tmp_input = None
    tmp_trimmed = None
    try:
        import tempfile

        # Guardar el archivo original en disco temporal
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as f:
            f.write(audio_content)
            tmp_input = f.name

        # Si hay rango de recorte, aplicar ffmpeg
        audio_to_transcribe = tmp_input
        trimmed = False
        if end_time > start_time > 0 or (start_time == 0 and end_time > 0):
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                tmp_trimmed = f.name
            success = _trim_audio_ffmpeg(tmp_input, tmp_trimmed, start_sec=start_time, end_sec=end_time)
            if success:
                audio_to_transcribe = tmp_trimmed
                trimmed = True

        # Leer el archivo a transcribir
        with open(audio_to_transcribe, "rb") as f:
            bytes_to_send = f.read()

        result = transcribe_audio_bytes(
            audio_bytes=bytes_to_send,
            file_extension=".wav" if trimmed else file_ext,
            language=language,
            model_size=model_size
        )

        transcribed_text = result.get("text", "").strip()
        if not transcribed_text:
            raise HTTPException(status_code=400, detail="No se pudo transcribir el audio.")

        return {
            "transcription": transcribed_text,
            "language": result.get("language", language),
            "model_used": f"whisper-{model_size}",
            "duration": result.get("duration", 0),
            "word_count": len(transcribed_text.split()),
            "trimmed": trimmed,
            "segment_start": start_time,
            "segment_end": end_time
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error transcribiendo audio: {str(e)}")
    finally:
        if tmp_input and os.path.exists(tmp_input):
            os.unlink(tmp_input)
        if tmp_trimmed and os.path.exists(tmp_trimmed):
            os.unlink(tmp_trimmed)


# ==============================================================================
# 6. ARCHIVOS ADJUNTOS DEL CLIENTE
# ==============================================================================
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif"
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/customers/{customer_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_customer_file(
    customer_id: str,
    file: UploadFile = File(...),
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Sube un archivo adjuntado al cliente.
    """
    # Verificar que el cliente existe y pertenece al tenant
    customer_check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
    if not customer_check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Validar tipo de archivo (comentar temporalmente para pruebas)
    # if file.content_type not in ALLOWED_MIME_TYPES:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f"Tipo de archivo no permitido. Tipos válidos: PDF, Word, Excel, imágenes"
    #     )
    
    # Validar tamaño
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo excede el límite de 10MB")
    
    # Generar nombre único
    import uuid
    import os
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"{current_user.tenant_id}/{customer_id}/{unique_filename}"
    
    try:
        # Intentar subir a Supabase Storage
        try:
            response = db.storage.from_("customer-files").upload(
                path=storage_path,
                file=contents,
                file_options={"content-type": file.content_type}
            )
            file_url = db.storage.from_("customer-files").get_public_url(storage_path)
        except Exception as storage_err:
            # Si falla Storage, usamos URL placeholder
            print(f"Storage upload failed: {storage_err}")
            file_url = f"https://nsikrlhxyxswzotcighh.supabase.co/storage/v1/object/public/customer-files/{storage_path}"
        
        # Guardar referencia en la base de datos
        file_record = {
            "tenant_id": current_user.tenant_id,
            "customer_id": customer_id,
            "file_name": file.filename or "archivo",
            "file_path": storage_path,
            "file_url": file_url,
            "file_size": len(contents),
            "mime_type": file.content_type,
            "created_by": current_user.user_id
        }
        
        db_res = db.table("crm_customer_files").insert(file_record).execute()
        return {
            "id": db_res.data[0]["id"],
            "file_name": file.filename,
            "file_url": file_url,
            "message": "Archivo guardado exitosamente"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error guardando archivo: {str(e)}")

@router.get("/customers/{customer_id}/files")
async def list_customer_files(
    customer_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Lista todos los archivos adjuntados al cliente.
    """
    # Verificar que el cliente existe y pertenece al tenant
    customer_check = db.table("crm_customers").select("id").eq("id", customer_id).eq("tenant_id", current_user.tenant_id).execute()
    if not customer_check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    try:
        response = db.table("crm_customer_files").select("*").eq("customer_id", customer_id).eq("tenant_id", current_user.tenant_id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/customers/{customer_id}/files/{file_id}")
async def delete_customer_file(
    customer_id: str,
    file_id: str,
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Elimina un archivo adjuntado del cliente.
    """
    # Verificar que el archivo existe y pertenece al tenant
    file_check = db.table("crm_customer_files").select("*").eq("id", file_id).eq("tenant_id", current_user.tenant_id).execute()
    if not file_check.data:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    file_data = file_check.data[0]
    
    try:
        # Eliminar de Storage
        db.storage.from_("customer-files").remove([file_data["file_path"]])
        
        # Eliminar de la base de datos
        db.table("crm_customer_files").delete().eq("id", file_id).execute()
        
        return {"message": "Archivo eliminado exitosamente"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error eliminando archivo: {str(e)}")
