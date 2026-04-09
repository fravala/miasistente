# Implementación de Tags en Tareas

## Resumen

Se implementó la funcionalidad de tags/etiquetas en el sistema de tareas, permitiendo a los usuarios categorizar tareas con etiquetas personalizadas como `#ventas`, `#soporte`, `#urgente`, etc.

## Cambios Realizados

### 1. Base de Datos

**Archivo**: `supabase/migrations/20260328030000_add_tag_to_tasks.sql`

```sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tag VARCHAR(100);

COMMENT ON COLUMN tasks.tag IS 'Optional tag/label for categorizing tasks (e.g., #sales, #support, #urgent)';
```

**Instrucciones para aplicar la migración**:
1. Ir al panel de Supabase
2. Navegar a SQL Editor
3. Ejecutar el siguiente SQL:
```sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tag VARCHAR(100);

COMMENT ON COLUMN tasks.tag IS 'Optional tag/label for categorizing tasks (e.g., #sales, #support, #urgent)';
```

### 2. Backend

**Archivo**: `backend/app/routers/tasks.py`

#### Cambios en los Schemas

**TaskBase** (línea 16):
```python
class TaskBase(BaseModel):
    title: str = Field(..., description="Título de la tarea")
    description: Optional[str] = Field(None, description="Descripción detallada de la tarea")
    status: Optional[TaskStatus] = Field("pending", description="Estado de la tarea")
    priority: Optional[TaskPriority] = Field("medium", description="Prioridad de la tarea")
    due_date: Optional[str] = Field(None, description="Fecha de vencimiento (formato ISO 8601)")
    tag: Optional[str] = Field(None, description="Etiqueta o tag para categorizar la tarea (e.g., #sales, #support, #urgent)")
```

**TaskCreate** (línea 26):
```python
class TaskCreate(TaskBase):
    pass  # Hereda todos los campos de TaskBase, incluyendo tag
```

**TaskUpdate** (línea 30):
```python
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[str] = None
    tag: Optional[str] = None  # Campo opcional para actualizar tag
```

**TaskResponse** (línea 38):
```python
class TaskResponse(TaskBase):
    id: str
    tenant_id: str
    created_by: str
    created_at: str
    updated_at: str
    # Hereda todos los campos de TaskBase, incluyendo tag
```

#### Validación del Tag

**Función `create_task`** (líneas 47-52):
```python
# Validar tag (opcional)
valid_tags = ["#sales", "#support", "#urgent"]
if task.tag and task.tag not in valid_tags:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"tag debe ser uno de: {', '.join(valid_tags)}"
    )
```

### 3. Frontend

**Archivo**: `frontend/src/app/(dashboard)/tasks/page.tsx`

#### Interfaz Task

```typescript
interface Task {
    id: string;
    title: string;
    description: string | null;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "medium" | "high" | "urgent";
    due_date: string | null;
    tag: string | null;  // NUEVO CAMPO
    created_at: string;
    updated_at: string;
}
```

#### Estado para Crear Tarea

```typescript
const [newTag, setNewTag] = useState("");
```

#### Estado para Editar Tarea

```typescript
const [editTag, setEditTag] = useState<string>("");
```

#### Formulario de Crear Tarea (líneas 568-577)

```typescript
<div className="mb-4">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Etiqueta / Tag (opcional)</label>
    <input 
      type="text"
      placeholder="#ventas, #soporte, #urgente"
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium placeholder:text-slate-400"
      value={newTag}
      onChange={(e) => setNewTag(e.target.value)}
    />
</div>
```

#### Función handleAddTask (líneas 105-110)

```typescript
body: JSON.stringify({
    title: newTitle,
    description: newDescription || null,
    priority: newPriority,
    due_date: newDueDate || null,
    tag: newTag || null  // NUEVO CAMPO
})
```

#### Función handleOpenTaskModal (línea 195)

```typescript
const handleOpenTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date || "");
    setEditTag(task.tag || "");  // NUEVO CAMPO
    setShowTaskModal(true);
};
```

#### Modal de Editar Tarea (líneas 800-812)

```typescript
{/* Tag */}
<div>
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Etiqueta / Tag (opcional)</label>
    <input
      type="text"
      placeholder="#ventas, #soporte, #urgente"
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium placeholder:text-slate-400"
      value={editTag}
      onChange={(e) => setEditTag(e.target.value)}
    />
</div>
```

#### Función handleUpdateTask (líneas 217-223)

```typescript
body: JSON.stringify({
    title: editTitle,
    description: editDescription || null,
    priority: editPriority,
    status: editStatus,
    due_date: editDueDate || null,
    tag: editTag || null  // NUEVO CAMPO
})
```

#### Visualización en Tarjeta de Tarea - Grid View (líneas 699-705)

```typescript
{task.tag && (
    <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-200">
            #{task.tag}
        </span>
    </div>
)}
```

#### Visualización en Tarjeta de Tarea - Kanban View (líneas 402-408)

```typescript
{task.tag && (
    <div className="mt-2">
        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-200">
            #{task.tag}
        </span>
    </div>
)}
```

## Características Implementadas

1. **Campo Tag en Base de Datos**: Campo opcional `tag` de tipo VARCHAR(100) en la tabla `tasks`

2. **Creación de Tareas con Tag**: Los usuarios pueden agregar un tag al crear una nueva tarea

3. **Edición de Tareas con Tag**: Los usuarios pueden modificar el tag de una tarea existente desde el modal de detalles

4. **Visualización de Tags**: Los tags se muestran en:
   - Vista de cuadrícula (Grid View)
   - Vista Kanban
   - Modal de detalles de tarea

5. **Validación de Tags**: El backend valida que el tag sea uno de los permitidos: `#sales`, `#support`, `#urgent`

## Estilos Visuales

Los tags se muestran con el siguiente estilo:
- **Color de fondo**: `bg-purple-100`
- **Color de texto**: `text-purple-600`
- **Borde**: `border-purple-200`
- **Formato**: Badge/píldora redondeada
- **Prefijo**: Se muestra con el símbolo `#` (ej. `#ventas`)

## Uso

### Crear una Tarea con Tag

1. Hacer clic en el botón "Crear Tarea"
2. Llenar los campos de la tarea
3. En el campo "Etiqueta / Tag (opcional)", ingresar el tag deseado (ej. `#ventas`)
4. Hacer clic en "Crear Tarea"

### Editar el Tag de una Tarea

1. Hacer clic en una tarea para abrir el modal de detalles
2. Modificar el campo "Etiqueta / Tag"
3. Hacer clic en "Guardar Cambios"

### Ver Tags

Los tags se muestran automáticamente en:
- Tarjetas de tareas en la vista de cuadrícula
- Tarjetas de tareas en la vista Kanban
- Modal de detalles de tarea

## Validaciones

El backend valida que el tag sea uno de los siguientes:
- `#sales`
- `#support`
- `#urgent`

Si se intenta crear o actualizar una tarea con un tag no válido, se devuelve un error HTTP 400.

## Archivos Modificados

1. `supabase/migrations/20260328030000_add_tag_to_tasks.sql` - Migración de base de datos
2. `backend/app/routers/tasks.py` - Schemas y validación de tags
3. `frontend/src/app/(dashboard)/tasks/page.tsx` - Interfaz de usuario

## Archivos Creados

1. `backend/apply_tag_migration.py` - Script para verificar conexión y mostrar SQL de migración
2. `docs/implementacion_tags_tareas.md` - Esta documentación

## Próximos Pasos

1. Aplicar la migración de base de datos en el panel de Supabase
2. Probar la creación de tareas con tags
3. Probar la edición de tags en tareas existentes
4. Probar la visualización de tags en ambas vistas (Grid y Kanban)
5. Considerar agregar más tags predefinidos según las necesidades del negocio
6. Considerar agregar filtrado por tag en la lista de tareas

## Notas

- El campo `tag` es opcional, por lo que las tareas pueden existir sin tag
- Los tags se muestran con el prefijo `#` para mayor claridad
- La validación de tags se realiza en el backend para asegurar consistencia
- Los tags se muestran con un color púrpura (`purple`) para diferenciarlos de otros elementos de la interfaz
