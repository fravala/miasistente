# Implementación de OpenRouter como Provider de IA

## Descripción General

Se ha agregado OpenRouter como un nuevo provider de inteligencia artificial en el sistema, permitiendo a los usuarios acceder a múltiples modelos de IA gratuitos a través de una API unificada.

## Características de OpenRouter

OpenRouter es un servicio que proporciona acceso a múltiples modelos de IA a través de una API unificada, incluyendo muchos modelos gratuitos. Esto permite a los usuarios:

1. **Acceso a Modelos Gratuitos**: Utilizar modelos de IA sin costo
2. **API Unificada**: Usar una sola API para acceder a múltiples modelos
3. **Flexibilidad**: Cambiar entre diferentes modelos fácilmente

## Modelos Gratuitos Disponibles

OpenRouter ofrece varios modelos gratuitos, incluyendo:

- **Google Gemma 2**: `google/gemma-2-9b-it:free`
- **Meta Llama 3**: `meta-llama/llama-3-8b-instruct:free`
- **Microsoft WizardLM**: `microsoft/wizardlm-2-8x22b:free`
- **Nous Hermes**: `nousresearch/hermes-3-llama-3.1-8b:free`
- **Qwen**: `qwen/qwen-2-7b-instruct:free`

## Implementación

### 1. Configuración en el Backend

**Archivo**: [`backend/app/assistant_router.py`](backend/app/assistant_router.py:258-264)

**Cambio en model_map**:
```python
model_map = {
    "openai": "gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20240620",
    "gemini": "gemini/gemini-2.5-flash",
    "grok": "xai/grok-beta",
    "openrouter": "openrouter/google/gemma-2-9b-it:free",  # NUEVO
}
```

**Modelo Predeterminado**: Se ha configurado `google/gemma-2-9b-it:free` como el modelo predeterminado para OpenRouter, que es un modelo gratuito de Google.

### 2. Configuración en el Frontend

**Archivo**: [`frontend/src/app/(dashboard)/settings/page.tsx`](frontend/src/app/(dashboard)/settings/page.tsx:121-131)

**Cambio en la lista de providers**:
```typescript
{['openai', 'anthropic', 'gemini', 'grok', 'openrouter'].map(p => (
  <button 
    key={p}
    onClick={() => setProvider(p)}
    className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all text-left uppercase tracking-wider ${provider === p ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
  >
    {p === 'openrouter' ? 'OpenRouter' : p}
  </button>
))}
```

**Visualización**: El provider `openrouter` se muestra como "OpenRouter" en lugar de "openrouter" para mejor legibilidad.

## Cómo Usar OpenRouter

### 1. Obtener API Key de OpenRouter

1. Ve a [https://openrouter.ai/](https://openrouter.ai/)
2. Regístrate o inicia sesión
3. Ve a la sección de API Keys
4. Crea una nueva API key
5. Copia la API key

### 2. Configurar en el Sistema

1. Navega a la página de Configuración (`/settings`)
2. Selecciona "OpenRouter" como el proveedor de IA
3. Pega tu API key de OpenRouter en el campo "Clave de API"
4. Haz clic en "Guardar Preferencias"

### 3. Usar el Asistente de IA

Una vez configurado, el asistente de IA usará automáticamente el modelo de OpenRouter seleccionado para responder a tus preguntas y ejecutar comandos.

## Cambio de Modelos

Para cambiar entre diferentes modelos de OpenRouter, puedes modificar el `model_map` en el backend:

```python
model_map = {
    "openrouter": "openrouter/meta-llama/llama-3-8b-instruct:free",  # Cambiar a otro modelo
}
```

Algunos modelos gratuitos disponibles:

- `openrouter/google/gemma-2-9b-it:free`
- `openrouter/meta-llama/llama-3-8b-instruct:free`
- `openrouter/microsoft/wizardlm-2-8x22b:free`
- `openrouter/nousresearch/hermes-3-llama-3.1-8b:free`
- `openrouter/qwen/qwen-2-7b-instruct:free`

## Archivos Modificados

- [`backend/app/assistant_router.py`](backend/app/assistant_router.py:258-264) - Agregado OpenRouter al model_map
- [`frontend/src/app/(dashboard)/settings/page.tsx`](frontend/src/app/(dashboard)/settings/page.tsx:121-131) - Agregado OpenRouter a la lista de providers

## Beneficios de la Implementación

1. **Costo Cero**: Los usuarios pueden usar modelos de IA gratuitos sin pagar
2. **Variedad de Modelos**: Acceso a múltiples modelos de diferentes proveedores
3. **Fácil Configuración**: Solo requiere una API key de OpenRouter
4. **API Unificada**: Usa la misma interfaz que otros providers
5. **Flexibilidad**: Fácil cambiar entre diferentes modelos

## Pruebas Recomendadas

1. **Configuración**:
   - Seleccionar OpenRouter como provider
   - Ingresar una API key válida de OpenRouter
   - Guardar la configuración
   - Verificar que se muestra "Ya configurada"

2. **Uso del Asistente**:
   - Abrir el asistente de IA
   - Hacer una pregunta
   - Verificar que el asistente responde correctamente
   - Verificar que usa el modelo de OpenRouter

3. **Cambio de Modelo**:
   - Modificar el modelo en el backend
   - Reiniciar el servidor
   - Probar el asistente con el nuevo modelo

4. **Validación**:
   - Intentar usar el asistente sin API key
   - Verificar que se muestra un error apropiado
   - Intentar usar una API key inválida
   - Verificar que se muestra un error apropiado

## Notas Técnicas

- **LiteLLM**: OpenRouter es compatible con LiteLLM usando el formato `openrouter/model-name`
- **Modelos Gratuitos**: Los modelos gratuitos de OpenRouter tienen el sufijo `:free`
- **API Key**: La API key de OpenRouter funciona para todos los modelos disponibles en la plataforma
- **Fallback**: Si el modelo predeterminado no funciona, se puede cambiar a otro modelo gratuito

## Comparación con Otros Providers

| Provider | Costo | Modelos Disponibles | API Key |
|-----------|---------|---------------------|----------|
| OpenAI | Pago | GPT-4, GPT-3.5, etc. | Requerida |
| Anthropic | Pago | Claude 3.5, Claude 3, etc. | Requerida |
| Gemini | Pago | Gemini 2.5 Flash, etc. | Requerida |
| Grok | Pago | Grok Beta | Requerida |
| **OpenRouter** | **Gratuito** | **Múltiples modelos gratuitos** | **Requerida** |

## Fecha

2026-03-27
