# Solución Avanzada para Error en Creación de Tareas

## Problema Actual

El endpoint `POST /api/tasks` está devolviendo un error500 cuando se intenta crear una tarea, a pesar de que:
- El endpoint `GET /api/tasks` funciona correctamente
- La tabla `tasks` existe en la base de datos (confirmado por el usuario)
- El usuario ha ejecutado la migración en Supabase

## Causas Posibles

### 1. Políticas de RLS (Row Level Security) Bloqueando

Supabase tiene políticas de seguridad a nivel de fila (RLS) que pueden estar bloqueando la inserción de datos en la tabla `tasks`.

**Síntomas**:
- `GET /api/tasks` funciona (devuelve array vacío o existente)
- `POST /api/tasks` falla con error500
- Los logs muestran: "Error al crear tarea: ..." pero no el detalle exacto

**Solución**: Crear políticas de RLS para permitir a los usuarios del tenant crear tareas.

### 2. Campos Obligatorios Faltantes

La tabla `tasks` puede tener restricciones que no se están cumpliendo.

**Solución**: Verificar que todos los campos obligatorios se están enviando correctamente.

### 3. Problema con Tipos de Datos

Puede haber un problema con el tipo de dato de algún campo (ej. `due_date` como string en lugar de datetime).

**Solución**: Verificar que los tipos de datos coinciden con el esquema de la tabla.

## Pasos para Solucionar

### Paso 1: Verificar Políticas de RLS en Supabase

1. Ve a https://supabase.com/dashboard/project/nsikrlhxyxswzotcighh/database/rls
2. Busca la tabla `tasks`
3. Verifica si hay políticas de RLS habilitadas
4. Si hay políticas, verifica que permiten INSERT

Si no hay políticas o están bloqueando, crea las siguientes políticas:

```sql
-- Política para permitir a los usuarios del tenant ver sus tareas
CREATE POLICY "Users can view their own tenant tasks" ON tasks
    FOR SELECT
    USING (tenant_id = auth.uid());

-- Política para permitir a los usuarios del tenant crear tareas
CREATE POLICY "Users can create tasks for their tenant" ON tasks
    FOR INSERT
    WITH CHECK (tenant_id = auth.uid());

-- Política para permitir a los usuarios del tenant actualizar tareas
CREATE POLICY "Users can update their own tenant tasks" ON tasks
    FOR UPDATE
    USING (tenant_id = auth.uid());

-- Política para permitir a los usuarios del tenant eliminar tareas
CREATE POLICY "Users can delete their own tenant tasks" ON tasks
    FOR DELETE
    USING (tenant_id = auth.uid());

-- Habilitar RLS en la tabla
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### Paso 2: Verificar Estructura de la Tabla

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
```

Verifica que:
- `due_date` es de tipo `TIMESTAMP WITH TIME ZONE` (no string)
- `priority` es de tipo `VARCHAR` con CHECK constraint
- `status` es de tipo `VARCHAR` con CHECK constraint
- `tenant_id` es de tipo `UUID` y no es nullable

### Paso 3: Verificar Datos del Usuario

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT 
    u.id,
    u.email,
    u.tenant_id,
    u.role
FROM users u
WHERE u.email = 'admin@miasistente.com';
```

Verifica que el `tenant_id` del usuario es correcto.

### Paso 4: Probar con Debug Logs

He agregado print statements en [`backend/app/routers/tasks.py`](backend/app/routers/tasks.py:76-77) para depuración. Ahora cuando intentes crear una tarea, verás en los logs del backend:

```
DEBUG: Creando tarea con datos: {...}
DEBUG: Respuesta de Supabase: {...}
```

Esto te mostrará exactamente qué datos se están enviando y qué respuesta está devolviendo Supabase.

### Paso 5: Verificar Logs del Backend

Después de intentar crear una tarea, ejecuta:

```bash
cd backend && tail -n 50 backend.log
```

Busca líneas que contengan "DEBUG" para ver los datos que se están enviando.

## Solución Temporal

Si necesitas crear tareas urgentemente y el problema persiste, puedes:

### Opción A: Deshabilitar RLS Temporalmente

```sql
-- Deshabilitar RLS temporalmente para pruebas
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
```

**ADVERTENCIA**: Esto solo debe usarse temporalmente para pruebas. En producción, debes crear las políticas de RLS apropiadas.

### Opción B: Usar el Cliente de Supabase Directamente

En lugar de usar el router de FastAPI, puedes crear tareas directamente desde el SQL Editor de Supabase:

```sql
INSERT INTO tasks (tenant_id, created_by, title, description, status, priority, due_date)
VALUES (
    'TU_TENANT_ID',
    'TU_USER_ID',
    'Tarea de prueba',
    'Descripción de prueba',
    'pending',
    'medium',
    NULL
);
```

## Próximos Pasos

1. Ver los logs de debug cuando intentes crear una tarea
2. Si hay un error con RLS, crear las políticas sugeridas
3. Si el problema persiste, considerar deshabilitar RLS temporalmente
4. Verificar que el `tenant_id` del usuario coincide con el de la tabla `tenants`

## Documentación de Referencia

- [Supabase RLS Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/database/troubleshooting)

## Conclusión

El error500 al crear tareas probablemente está relacionado con políticas de RLS en Supabase que están bloqueando la inserción. Sigue los pasos de depuración para identificar la causa exacta y aplicar la solución correspondiente.
