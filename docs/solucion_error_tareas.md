# Solución de Error en Página de Tareas

## Problema Identificado

Al acceder a la página `/tasks`, aparece el error:
```
Failed to load tasks {}
```

## Causa Raíz

El error ocurre porque **la tabla `tasks` no existe en la base de datos de Supabase**. La migración [`supabase/migrations/20260326230000_add_tasks_table.sql`](supabase/migrations/20260326230000_add_tasks_table.sql) se ha creado pero **no se ha ejecutado en la base de datos**.

## Solución

### Paso 1: Ejecutar la Migración en Supabase

Necesitas ejecutar el archivo de migración en tu base de datos de Supabase:

```bash
# Opción 1: Usando psql directamente
psql -h db.nsikrlhxyxswzotcighh.supabase.co -U postgres -d postgres -f supabase/migrations/20260326230000_add_tasks_table.sql

# Opción 2: Usando el SQL Editor de Supabase
# 1. Ve a https://supabase.com/dashboard/project/nsikrlhxyxswzotcighh/database/editor
# 2. Copia el contenido de supabase/migrations/20260326230000_add_tasks_table.sql
# 3. Pégalo en el SQL Editor
# 4. Ejecuta el SQL (Ctrl+Enter o clic en "Run")
```

### Paso 2: Verificar que la Tabla se Creó

Después de ejecutar la migración, verifica que la tabla `tasks` existe:

```sql
-- Ejecutar esto en el SQL Editor para verificar
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks';
```

Deberías ver una fila con el nombre `tasks`.

### Paso 3: Probar la Página de Tareas

Una vez que la tabla exista, la página `/tasks` debería funcionar correctamente:

1. Ve a `http://localhost:3000/tasks`
2. Verifica que no aparezca el error
3. Deberías ver el mensaje "No hay tareas registradas aún. ¡Crea tu primera tarea!"
4. Intenta crear una tarea nueva

## Corrección Adicional

Se ha corregido el manejo de errores en [`backend/app/routers/tasks.py`](backend/app/routers/tasks.py:120-127) para agregar un bloque `except` que faltaba en la función `list_tasks`. Esto proporcionará mensajes de error más claros si hay problemas en el futuro.

## Verificación

Para verificar que todo funciona correctamente:

1. **Crear una tarea**:
   - Haz clic en "Nueva Tarea"
   - Llena el formulario
   - Haz clic en "Crear Tarea"
   - La tarea debería aparecer en la lista

2. **Filtrar tareas**:
   - Haz clic en "Pendientes"
   - Solo deberías ver tareas con status = "pending"
   - Haz clic en "Urgente"
   - Solo deberías ver tareas con priority = "urgent"

3. **Cambiar estado**:
   - Haz clic en el icono de estado de una tarea
   - El estado debería cambiar de "pending" a "completed"
   - El icono debería cambiar de círculo a check

4. **Eliminar tarea**:
   - Haz clic en el icono de basura
   - Confirma la eliminación
   - La tarea debería desaparecer de la lista

## Troubleshooting

Si después de ejecutar la migración sigues teniendo problemas:

### Problema: Error 500 al acceder a `/api/tasks`

**Solución**: Verifica los logs del backend:
```bash
cd backend && tail -f backend.log
```

Busca errores relacionados con la tabla `tasks`.

### Problema: La tabla no se crea

**Solución**: Verifica que tienes los permisos necesarios en Supabase:
1. Ve a Settings > Database
2. Verifica que tienes permisos de escritura
3. Asegúrate de estar en el proyecto correcto

### Problema: Error de RLS (Row Level Security)

**Solución**: Si obtienes un error de RLS, necesitas crear políticas para la tabla `tasks`:

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

## Conclusión

El error en la página de tareas se debe a que la tabla `tasks` no existe en la base de datos. Ejecuta la migración en Supabase y la página debería funcionar correctamente.

## Script de Prueba

He creado [`test_tasks_endpoint.py`](test_tasks_endpoint.py) para verificar el endpoint `/api/tasks`. Para usarlo:

1. Inicia sesión en la aplicación para obtener un token válido
2. Copia el token del localStorage del navegador (F12 > Application > Local Storage)
3. Reemplaza `TU_TOKEN_AQUI` en el script con tu token
4. Ejecuta el script:
   ```bash
   python test_tasks_endpoint.py
   ```

Esto te mostrará exactamente qué está devolviendo el backend cuando se accede a `/api/tasks`.
