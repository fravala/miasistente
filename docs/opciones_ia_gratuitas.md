# Opciones de IA Gratuitas con Límites Más Extensos

## Resumen Ejecutivo

Este documento compara las opciones de IA gratuitas disponibles que son compatibles con LiteLLM y que ofrecen límites más generosos que Gemini (20 solicitudes/día).

## Opciones Disponibles

### 1. OpenAI (GPT-4o-mini)

**Estado**: ✅ Recomendado para desarrollo

**Límites Gratuitos**:
- **$5 de crédito gratuito** para nuevos usuarios
- Aproximadamente **1,000 - 2,000 solicitudes** con GPT-4o-mini
- **Sin límite diario** específico, se consume el crédito

**Ventajas**:
- Modelo muy capaz y rápido
- Excelente soporte para function calling
- Amplia documentación y comunidad
- Compatible con LiteLLM: `openai/gpt-4o-mini`

**Desventajas**:
- El crédito se agota eventualmente
- Requiere tarjeta de crédito para registrarse

**Costo después del crédito**:
- $0.15 por 1M tokens de entrada
- $0.60 por 1M tokens de salida

**Cómo usarlo**:
```python
import litellm

response = litellm.completion(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hola"}],
    api_key="tu-api-key"
)
```

---

### 2. Anthropic (Claude 3.5 Sonnet)

**Estado**: ✅ Excelente opción para producción

**Límites Gratuitos**:
- **$5 de crédito gratuito** para nuevos usuarios
- Aproximadamente **500 - 1,000 solicitudes** con Claude 3.5 Sonnet
- **Sin límite diario** específico, se consume el crédito

**Ventajas**:
- Modelo muy inteligente y preciso
- Excelente para tareas complejas
- Buen soporte para function calling
- Compatible con LiteLLM: `anthropic/claude-3-5-sonnet-20240620`

**Desventajas**:
- El crédito se agota eventualmente
- Requiere tarjeta de crédito para registrarse
- Más lento que GPT-4o-mini

**Costo después del crédito**:
- $3 por 1M tokens de entrada
- $15 por 1M tokens de salida

**Cómo usarlo**:
```python
import litellm

response = litellm.completion(
    model="anthropic/claude-3-5-sonnet-20240620",
    messages=[{"role": "user", "content": "Hola"}],
    api_key="tu-api-key"
)
```

---

### 3. Grok (xAI)

**Estado**: ⚠️ Limitado pero gratuito

**Límites Gratuitos**:
- **Acceso gratuito** para usuarios de X (Twitter) Premium
- **Sin límite diario** específico documentado
- Aproximadamente **100 - 500 solicitudes** por mes

**Ventajas**:
- Modelo moderno y capaz
- Integración con X
- Compatible con LiteLLM: `xai/grok-beta`

**Desventajas**:
- Requiere suscripción a X Premium ($16/mes)
- Menos documentación que OpenAI/Anthropic
- Limitaciones en function calling

**Costo después del período gratuito**:
- Precios no completamente documentados
- Probablemente similar a GPT-4

**Cómo usarlo**:
```python
import litellm

response = litellm.completion(
    model="xai/grok-beta",
    messages=[{"role": "user", "content": "Hola"}],
    api_key="tu-api-key"
)
```

---

### 4. Hugging Face (Modelos Open Source)

**Estado**: ✅ Totalmente gratuito (self-hosted)

**Límites Gratuitos**:
- **Ilimitado** si se ejecuta localmente
- **Limitado** si se usa la API gratuita de Hugging Face (aprox. 1,000 solicitudes/mes)

**Ventajas**:
- Totalmente gratuito si se ejecuta localmente
- Muchos modelos disponibles (Llama, Mistral, etc.)
- Comunidad muy activa
- Compatible con LiteLLM: `huggingface/<model-name>`

**Desventajas**:
- Requiere recursos computacionales si se ejecuta localmente
- Modelos menos capaces que GPT-4/Claude
- Configuración más compleja

**Modelos recomendados**:
- `mistralai/Mistral-7B-Instruct-v0.3`
- `meta-llama/Meta-Llama-3-8B-Instruct`
- `NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO`

**Cómo usarlo**:
```python
import litellm

# Usando API de Hugging Face
response = litellm.completion(
    model="huggingface/mistralai/Mistral-7B-Instruct-v0.3",
    messages=[{"role": "user", "content": "Hola"}],
    api_key="hf_tu-api-key"
)

# O ejecutando localmente con Ollama
response = litellm.completion(
    model="ollama/llama3",
    messages=[{"role": "user", "content": "Hola"}]
)
```

---

### 5. Ollama (Modelos Open Source Locales)

**Estado**: ✅ Totalmente gratuito (self-hosted)

**Límites Gratuitos**:
- **Ilimitado** (se ejecuta en tu máquina)

**Ventajas**:
- Totalmente gratuito
- Privacidad total (los datos no salen de tu máquina)
- Muchos modelos disponibles
- Fácil de instalar y usar
- Compatible con LiteLLM: `ollama/<model-name>`

**Desventajas**:
- Requiere recursos computacionales (RAM/CPU/GPU)
- Modelos menos capaces que GPT-4/Claude
- Más lento que APIs en la nube

**Modelos recomendados**:
- `ollama/llama3` (8B parameters)
- `ollama/mistral` (7B parameters)
- `ollama/phi3` (3.8B parameters - muy rápido)

**Cómo instalar y usarlo**:

1. Instalar Ollama:
```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Descargar desde https://ollama.com/download
```

2. Descargar un modelo:
```bash
ollama pull llama3
```

3. Usar con LiteLLM:
```python
import litellm

response = litellm.completion(
    model="ollama/llama3",
    messages=[{"role": "user", "content": "Hola"}]
)
```

---

### 6. Together AI

**Estado**: ✅ Buen balance entre costo y calidad

**Límites Gratuitos**:
- **$25 de crédito gratuito** para nuevos usuarios
- Aproximadamente **5,000 - 10,000 solicitudes** con modelos más económicos
- **Sin límite diario** específico, se consume el crédito

**Ventajas**:
- Crédito gratuito generoso
- Muchos modelos disponibles (open source y propietarios)
- Precios competitivos
- Compatible con LiteLLM: `together_ai/<model-name>`

**Desventajas**:
- El crédito se agota eventualmente
- Menos conocido que OpenAI/Anthropic

**Costo después del crédito**:
- $0.10 - $1.00 por 1M tokens (dependiendo del modelo)

**Cómo usarlo**:
```python
import litellm

response = litellm.completion(
    model="together_ai/meta-llama/Meta-Llama-3-8B-Instruct-Turbo",
    messages=[{"role": "user", "content": "Hola"}],
    api_key="tu-api-key"
)
```

---

## Comparación de Límites Gratuitos

| Proveedor | Crédito Gratuito | Solicitudes Aprox. | Límite Diario | Requiere Tarjeta |
|-----------|------------------|---------------------|---------------|------------------|
| **Gemini** | $0 | 20/día | 20 | ❌ No |
| **OpenAI** | $5 | 1,000 - 2,000 | ❌ No | ✅ Sí |
| **Anthropic** | $5 | 500 - 1,000 | ❌ No | ✅ Sí |
| **Grok** | $0 (con X Premium) | 100 - 500/mes | ❌ No | ❌ No (pero requiere X Premium) |
| **Hugging Face** | $0 (API) | 1,000/mes | ❌ No | ❌ No |
| **Ollama** | $0 (local) | **Ilimitado** | ❌ No | ❌ No |
| **Together AI** | $25 | 5,000 - 10,000 | ❌ No | ✅ Sí |

---

## Recomendaciones

### Para Desarrollo y Pruebas

**Opción 1: OpenAI (GPT-4o-mini)** - Mejor balance
- Crédito gratuito de $5
- Modelo muy capaz
- Excelente soporte para function calling
- Fácil de configurar

**Opción 2: Ollama (Llama3)** - Totalmente gratuito
- Sin costos
- Ilimitado
- Privacidad total
- Requiere recursos computacionales

### Para Producción

**Opción 1: Anthropic (Claude 3.5 Sonnet)** - Mejor calidad
- Modelo muy inteligente
- Excelente para tareas complejas
- Precios razonables

**Opción 2: OpenAI (GPT-4o-mini)** - Mejor costo/beneficio
- Muy rápido y capaz
- Precios competitivos
- Amplia adopción

### Para Proyectos con Presupuesto Limitado

**Opción 1: Together AI** - Mejor crédito gratuito
- $25 de crédito gratuito
- Muchos modelos disponibles
- Precios competitivos

**Opción 2: Ollama** - Sin costos
- Totalmente gratuito
- Ilimitado
- Privacidad total

---

## Configuración en el Proyecto

El proyecto ya tiene soporte para múltiples proveedores en [`backend/app/assistant_router.py`](backend/app/assistant_router.py:259-266):

```python
model_map = {
    "openai": "gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20240620",
    "gemini": "gemini/gemini-2.5-flash",
    "grok": "xai/grok-beta",
}
```

### Para cambiar a OpenAI:

1. Obtener una API key de OpenAI: https://platform.openai.com/api-keys
2. Actualizar la configuración del tenant en la base de datos:
   ```python
   # En backend/app/routers/settings.py
   updated_tenant = db.table("tenant_settings").update({
       "ai_provider": "openai",
       "ai_api_key": "sk-..."
   }).eq("tenant_id", tenant_id).execute()
   ```

### Para cambiar a Ollama:

1. Instalar Ollama:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. Descargar un modelo:
   ```bash
   ollama pull llama3
   ```

3. Agregar Ollama al model_map en [`backend/app/assistant_router.py`](backend/app/assistant_router.py:259-266):
   ```python
   model_map = {
       "openai": "gpt-4o-mini",
       "anthropic": "anthropic/claude-3-5-sonnet-20240620",
       "gemini": "gemini/gemini-2.5-flash",
       "grok": "xai/grok-beta",
       "ollama": "ollama/llama3",  # AGREGAR ESTA LÍNEA
   }
   ```

4. Actualizar la configuración del tenant:
   ```python
   # En backend/app/routers/settings.py
   updated_tenant = db.table("tenant_settings").update({
       "ai_provider": "ollama",
       "ai_api_key": None  # Ollama no requiere API key
   }).eq("tenant_id", tenant_id).execute()
   ```

---

## Conclusión

**Para tu caso específico**, recomiendo:

1. **Corto plazo**: Usar **OpenAI (GPT-4o-mini)** con el crédito gratuito de $5
   - Te dará aproximadamente 1,000 - 2,000 solicitudes
   - Excelente para desarrollo y pruebas
   - Fácil de configurar

2. **Mediano plazo**: Considerar **Ollama (Llama3)** para desarrollo local
   - Totalmente gratuito
   - Ilimitado
   - Perfecto para desarrollo sin costos

3. **Largo plazo**: Evaluar **Anthropic (Claude 3.5 Sonnet)** para producción
   - Mejor calidad
   - Excelente para tareas complejas
   - Precios razonables

Cualquiera de estas opciones te dará **mucho más que las 20 solicitudes diarias** de Gemini.
