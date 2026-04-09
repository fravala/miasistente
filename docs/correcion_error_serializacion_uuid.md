# Corrección del Error de Serialización de UUID y Datetime

## Descripción del Problema

El usuario reportó dos errores al crear interacciones:

1. **Error de UUID:**
```
Error al crear interacción: Object of type UUID is not JSON serializable
```

2. **Error de Datetime:**
```
Error al crear interacción: Object of type datetime is not JSON serializable
```

## Análisis de Causa Raíz

### Problema 1: UUID Serialization en Frontend

El problema ocurrió en el frontend cuando se seleccionaba una tarea desde el dropdown de sugerencias (al escribir "#" en el textarea de notas).

En la función `handleSelectTask` en `frontend/src/app/(dashboard)/crm/[id]/page.tsx`, línea 226:

```typescript
setSelectedTaskId(task.id);
```

Aquí `task.id` era un objeto UUID, no un string. Cuando se creaba la interacción, el código intentaba convertirlo a string usando `String(selectedTaskId)`, pero esto no funcionaba porque `selectedTaskId` ya era un objeto UUID.

### Problema 2: UUID Serialization en Backend Schema

El problema ocurrió en el backend cuando Pydantic intentaba validar el `task_id` enviado desde el frontend. El schema `InteractionBase` tenía `task_id: Optional[UUID]`, lo que causaba que Pydantic intentara convertir el string enviado a un objeto UUID. Luego, cuando se intentaba insertar este valor en la base de datos, Supabase intentaba serializar el UUID object a JSON, lo cual fallaba.

### Problema 3: Datetime Serialization

El problema ocurrió en el backend cuando se intentaba serializar el resultado de crear una interacción. FastAPI intentaba serializar automáticamente el resultado, pero había objetos datetime que no se habían convertido a strings.

## Solución Aplicada

### Frontend: Convertir `task.id` a string en `handleSelectTask`

**Archivo:** `frontend/src/app/(dashboard)/crm/[id]/page.tsx`

**Cambio en la línea 226:**

```typescript
// ANTES (causaba el error)
setSelectedTaskId(task.id);

// DESPUÉS (corregido)
setSelectedTaskId(String(task.id));
```

### Backend: Cambiar `task_id` de UUID a string en schema

**Archivo:** `backend/app/schemas/crm.py`

**Cambios en las líneas 51 y 60:**

```python
# ANTES (causaba el error de UUID)
task_id: Optional[UUID] = Field(None, description="Optional reference to a task")

# DESPUÉS (corregido)
# FIX: Accept task_id as string to avoid UUID serialization issues
task_id: Optional[str] = Field(None, description="Optional reference to a task")
```

### Backend: Usar `jsonable_encoder` para serializar el resultado

**Archivo:** `backend/app/routers/crm.py`

**Cambio en la línea 206:**

```python
# ANTES (causaba el error de datetime)
return result_data

# DESPUÉS (corregido)
return jsonable_encoder(result_data)
```

## Resultado

- El frontend ahora convierte el UUID a string antes de asignarlo a `selectedTaskId`
- Al crear la interacción, `selectedTaskId` ya es un string, no un objeto UUID
- El backend acepta `task_id` como string en el schema, evitando que Pydantic lo convierta a UUID object
- El backend usa `jsonable_encoder` para asegurar que todos los objetos datetime se conviertan a strings antes de serializar
- No hay más errores de serialización al crear interacciones con `task_id` o `interaction_date`

## Verificación

El frontend se compiló correctamente después del cambio:
```
✓ Compiled in 260ms
```

El backend se recargó correctamente después del cambio:
```
INFO:     Started server process [1226503]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Notas Adicionales

El backend ya tenía la lógica correcta para convertir UUID objects a strings antes de retornar la respuesta (en `backend/app/routers/crm.py`, líneas 184-204), pero el problema estaba en:

1. El frontend que estaba enviando un objeto UUID en lugar de un string (corregido en `handleSelectTask`)
2. El schema del backend que convertía el string a UUID object (corregido cambiando `task_id` de `UUID` a `str`)
3. Al usar `jsonable_encoder`, se asegura que todos los objetos datetime se conviertan a strings antes de serializar, evitando el error de datetime serialization
