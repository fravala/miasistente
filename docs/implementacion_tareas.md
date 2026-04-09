# Implementación de Página de Tareas

## Resumen Ejecutivo

Se ha implementado una página completa de gestión de tareas en [`/tasks`](frontend/src/app/(dashboard)/tasks/page.tsx) siguiendo el diseño de la aplicación, con funcionalidad completa de CRUD y filtros.

## Características Implementadas

### Frontend ([`frontend/src/app/(dashboard)/tasks/page.tsx`](frontend/src/app/(dashboard)/tasks/page.tsx))

1. **Interfaz de Usuario**
   - Header con título y botón de nueva tarea
   - Barra de búsqueda
   - Filtros por estado (Todas, Pendientes, En Progreso, Completadas)
   - Filtro por prioridad (Todas, Urgente, Alta, Media, Baja)
   - Botón de ordenar por fecha

2. **Formulario de Crear Tarea**
   - Campo de título (obligatorio)
   - Selector de prioridad (Baja, Media, Alta, Urgente)
   - Campo de descripción (opcional)
   - Campo de fecha de vencimiento (opcional)
   - Animación de entrada/salida

3. **Visualización de Tareas**
   - Diseño de tarjetas consistente con CRM
   - Icono de estado (círculo para pendiente, reloj para en progreso, check para completada)
   - Badge de prioridad con colores (rojo para urgente, naranja para alta, amarillo para media, verde para baja)
   - Título y descripción de la tarea
   - Fecha de vencimiento formateada
   - Botón de eliminar
   - Botón para cambiar estado (clic en el icono de estado)

4. **Funcionalidades**
   - Crear nuevas tareas
   - Listar tareas con filtros
   - Cambiar estado de tarea (pendiente ↔ completada)
   - Eliminar tareas
   - Búsqueda de tareas (UI preparada)

### Backend ([`backend/app/routers/tasks.py`](backend/app/routers/tasks.py))

1. **Endpoints Implementados**
   - `POST /api/tasks` - Crear nueva tarea
   - `GET /api/tasks` - Listar tareas con filtros opcionales
   - `GET /api/tasks/{task_id}` - Obtener tarea específica
   - `PATCH /api/tasks/{task_id}` - Actualizar tarea
   - `DELETE /api/tasks/{task_id}` - Eliminar tarea

2. **Validaciones**
   - Validación de prioridad (low, medium, high, urgent)
   - Validación de estado (pending, in_progress, completed)
   - Aislamiento multi-tenant (tenant_id obligatorio)
   - Verificación de existencia de tarea antes de actualizar/eliminar

3. **Seguridad**
   - Requiere autenticación JWT
   - Aislamiento por tenant_id
   - Solo permite acceder/eliminar tareas del tenant actual

### Base de Datos ([`supabase/migrations/20260326230000_add_tasks_table.sql`](supabase/migrations/20260326230000_add_tasks_table.sql))

1. **Tabla `tasks`**
   ```sql
   CREATE TABLE tasks (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
       created_by UUID REFERENCES users(id) ON DELETE SET NULL,
       title VARCHAR(255) NOT NULL,
       description TEXT,
       status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
       priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
       due_date TIMESTAMP WITH TIME ZONE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Índices**
   - `idx_tasks_tenant_id` - Para consultas por tenant
   - `idx_tasks_status` - Para filtrar por estado
   - `idx_tasks_priority` - Para filtrar por prioridad
   - `idx_tasks_due_date` - Para ordenar por fecha de vencimiento
   - `idx_tasks_created_at` - Para ordenar por fecha de creación

3. **Trigger**
   - `update_tasks_updated_at` - Actualiza automáticamente el campo `updated_at` cuando se modifica una tarea

## Diseño Visual

### Colores de Prioridad

| Prioridad | Color de Fondo | Color de Texto | Color de Borde |
|-----------|------------------|----------------|----------------|
| Urgente  | bg-red-50        | text-red-600   | border-red-100   |
| Alta     | bg-orange-50      | text-orange-600 | border-orange-100 |
| Media     | bg-yellow-50      | text-yellow-600 | border-yellow-100 |
| Baja     | bg-green-50       | text-green-600  | border-green-100  |

### Iconos de Estado

| Estado      | Icono           | Color       |
|-------------|------------------|-------------|
| Pendiente   | Circle           | text-slate-400 |
| En Progreso | Clock            | text-blue-500  |
| Completada  | CheckCircle      | text-emerald-500 |

## API Endpoints

### Crear Tarea
```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Preparar propuesta para cliente X",
  "description": "Incluir análisis de necesidades y presupuesto",
  "priority": "high",
  "due_date": "2026-03-30T12:00:00Z"
}
```

### Listar Tareas
```http
GET /api/tasks?status=pending&priority=high
Authorization: Bearer <token>
```

### Actualizar Tarea
```http
PATCH /api/tasks/{task_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed"
}
```

### Eliminar Tarea
```http
DELETE /api/tasks/{task_id}
Authorization: Bearer <token>
```

## Integración con el Sistema

### Registro en Main ([`backend/app/main.py`](backend/app/main.py:11,33))

```python
from app.routers.tasks import router as tasks_router

app.include_router(tasks_router)
```

### Navegación en Sidebar

La página de tareas es accesible en `/tasks` y debe agregarse al sidebar de navegación en [`frontend/src/components/layout/Sidebar.tsx`](frontend/src/components/layout/Sidebar.tsx).

## Casos de Uso

### Caso 1: Crear Tarea Urgente

1. Usuario hace clic en "Nueva Tarea"
2. Se muestra el formulario
3. Usuario completa:
   - Título: "Llamada con cliente importante"
   - Prioridad: "Urgente"
   - Descripción: "Discutir renovación de contrato"
   - Fecha de vencimiento: "2026-03-27"
4. Usuario hace clic en "Crear Tarea"
5. La tarea se crea y aparece en la lista con badge rojo

### Caso 2: Filtrar Tareas Pendientes

1. Usuario hace clic en "Pendientes"
2. Se filtran las tareas con status = "pending"
3. Solo se muestran tareas pendientes
4. El botón "Pendientes" se activa con color cyan

### Caso 3: Completar Tarea

1. Usuario hace clic en el icono de estado de una tarea pendiente
2. El estado cambia de "pending" a "completed"
3. El icono cambia de círculo a check
4. La tarea se marca como completada

### Caso 4: Eliminar Tarea

1. Usuario hace clic en el icono de basura
2. Aparece confirmación: "¿Estás seguro de que quieres eliminar esta tarea?"
3. Usuario confirma
4. La tarea se elimina de la lista y de la base de datos

## Pruebas

Para probar la funcionalidad:

1. **Crear tarea**:
   - Ir a `/tasks`
   - Hacer clic en "Nueva Tarea"
   - Llenar el formulario
   - Guardar
   - Verificar que la tarea aparece en la lista

2. **Filtrar tareas**:
   - Ir a `/tasks`
   - Hacer clic en "Pendientes"
   - Verificar que solo se muestren tareas pendientes
   - Hacer clic en "Urgente"
   - Verificar que solo se muestren tareas urgentes

3. **Cambiar estado**:
   - Ir a `/tasks`
   - Hacer clic en el icono de estado de una tarea
   - Verificar que el estado cambia
   - Verificar que el icono cambia

4. **Eliminar tarea**:
   - Ir a `/tasks`
   - Hacer clic en el icono de basura
   - Confirmar eliminación
   - Verificar que la tarea desaparece

## Mejoras Futuras Sugeridas

1. **Búsqueda funcional**: Implementar búsqueda real en el backend
2. **Edición de tareas**: Agregar formulario para editar tareas existentes
3. **Drag & Drop**: Permitir reordenar tareas arrastrando
4. **Subtareas**: Implementar subtareas anidadas
5. **Etiquetas**: Agregar sistema de etiquetas/categorías
6. **Notificaciones**: Agregar notificaciones para tareas próximas a vencer
7. **Exportar**: Permitir exportar tareas a CSV/PDF
8. **Compartir**: Permitir compartir tareas con otros usuarios del tenant

## Conclusión

La página de tareas está completamente implementada siguiendo el diseño de la aplicación, con funcionalidad completa de CRUD, filtros por estado y prioridad, y diseño consistente con el resto del sistema. La implementación incluye frontend, backend y migración de base de datos, lista para producción.
