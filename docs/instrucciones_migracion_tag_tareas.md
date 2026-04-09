# Instrucciones para Aplicar Migraciones de Base de Datos

## Resumen

Este documento contiene las instrucciones para aplicar las migraciones pendientes de base de datos necesarias para las funcionalidades de tagging en tareas y vinculación de interacciones con tareas.

## Migración 1: Agregar Campo `tag` a la Tabla `tasks`

Esta migración agrega el campo `tag` a la tabla `tasks` para permitir etiquetar/categorizar tareas (ej. #sales, #support, #urgent).

### Pasos para Aplicar la Migración

#### Opción 1: Usar el SQL Editor de Supabase

1. Abre el panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva consulta
5. Ejecuta el siguiente SQL:

```sql
-- Agregar campo tag a la tabla de tareas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tag VARCHAR(100);

-- Agregar comentario al campo
COMMENT ON COLUMN tasks.tag IS 'Optional tag/label for categorizing tasks (e.g., #sales, #support, #urgent)';
```

#### Opción 2: Usar la CLI de Supabase

Si tienes la CLI de Supabase instalada:

```bash
# Crear nueva migración
supabase migration new add_tag_to_tasks

# Editar el archivo de migración generado
# Agregar el SQL anterior al archivo

# Aplicar la migración
supabase db push
```

### Verificación

Después de aplicar la migración, verifica que el campo se haya agregado correctamente:

```sql
-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

Deberías ver una fila con:
- `column_name`: `tag`
- `data_type`: `character varying`
- `is_nullable`: `YES`

## Migración 2: Agregar Campo `task_id` a la Tabla `crm_interactions`

Esta migración agrega el campo `task_id` a la tabla `crm_interactions` para permitir vincular interacciones con tareas.

### Pasos para Aplicar la Migración

#### Opción 1: Usar el SQL Editor de Supabase

1. Abre el panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva consulta
5. Ejecuta el siguiente SQL:

```sql
-- Add task_id field to crm_interactions table
-- This allows linking interactions to tasks

ALTER TABLE crm_interactions ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_interactions_task_id ON crm_interactions(task_id);

-- Add comment to the column
COMMENT ON COLUMN crm_interactions.task_id IS 'Optional reference to a task that this interaction is related to';
```

#### Opción 2: Usar la CLI de Supabase

Si tienes la CLI de Supabase instalada:

```bash
# La migración ya existe en el archivo:
# supabase/migrations/20260328042500_add_task_id_to_crm_interactions.sql

# Aplicar la migración
supabase db push
```

### Verificación

Después de aplicar la migración, verifica que el campo se haya agregado correctamente:

```sql
-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'crm_interactions'
ORDER BY ordinal_position;
```

Deberías ver una fila con:
- `column_name`: `task_id`
- `data_type`: `uuid`
- `is_nullable`: `YES`

## Notas Importantes

### Migración 1 (Tag en Tareas)
- El campo `tag` es opcional (nullable), por lo que las tareas existentes no se verán afectadas
- El campo tiene una longitud máxima de 100 caracteres
- Este campo es compatible con la funcionalidad de tagging en tiempo real implementada en el frontend

### Migración 2 (task_id en Interacciones)
- El campo `task_id` es opcional (nullable), por lo que las interacciones existentes no se verán afectadas
- El campo tiene una restricción de clave foránea que referencia la tabla `tasks`
- Si se elimina una tarea, el campo `task_id` se establece en NULL (ON DELETE SET NULL)
- Este campo es necesario para la funcionalidad de vincular notas con tareas

## Implementación Frontend

El frontend ya está configurado para:
- Mostrar el campo `tag` en el formulario de crear tarea
- Mostrar el campo `tag` en el modal de editar tarea
- Mostrar el `tag` en las tarjetas de tareas (grid view y kanban view)
- Permitir tagging en tiempo real con "#" en las notas
- Mostrar el selector de tareas en el formulario de crear interacción
- Mostrar el tooltip con estatus de tarea en las interacciones
- Renderizar Markdown con links clickeables

## Troubleshooting

### Error: "column tasks.tag does not exist"

Este error indica que la Migración 1 no se ha aplicado correctamente. Sigue los pasos anteriores para aplicar la migración.

### Error: "column crm_interactions.task_id does not exist"

Este error indica que la Migración 2 no se ha aplicado correctamente. Sigue los pasos anteriores para aplicar la migración.

### Error: "value too long for type character varying(100)"

Este error indica que el tag excede los 100 caracteres permitidos. Reduce la longitud del tag o aumenta el límite en la migración.

### Error: "Failed to add interaction" (500 Internal Server Error)

Este error indica que el campo `task_id` no existe en la tabla `crm_interactions`. Aplica la Migración 2 para resolver este problema.

## Pruebas

Después de aplicar ambas migraciones, prueba las siguientes funcionalidades:

### Pruebas de Tagging en Tareas
1. Crear una tarea con un tag
2. Editar una tarea para agregar un tag
3. Ver que el tag se muestra en las tarjetas de tareas

### Pruebas de Vinculación de Interacciones con Tareas
1. Crear una interacción y seleccionar una tarea
2. Ver que la tarea vinculada se muestra en la interacción
3. Ver el tooltip con estatus de tarea
4. Usar "#" en las notas para mencionar tareas
5. Verificar que los links de Markdown funcionan correctamente

## Documentación Relacionada

- [Implementación de Tags en Tareas](./implementacion_tags_tareas.md)
- [Implementación de Tagging en Tiempo Real con Links](./implementacion_tagging_tiempo_real_links.md)
- [Implementación de Vinculación de Notas con Tareas](./implementacion_vinculacion_notas_tareas.md)
