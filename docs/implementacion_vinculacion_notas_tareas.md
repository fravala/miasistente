# Implementación de Vinculación de Notas con Tareas

## Descripción

Se implementó la funcionalidad para vincular notas (y otras interacciones) con tareas existentes. Esto permite hacer un seguimiento más completo de los clientes al relacionar las interacciones con tareas específicas.

## Problema

El usuario necesitaba poder hacer referencia a una tarea existente al crear una nota (u otra interacción) en la página de detalles del cliente. Esto permite mantener un mejor seguimiento de las actividades relacionadas con tareas específicas.

## Solución

### 1. Base de Datos

**Archivo**: `supabase/migrations/20260328020000_add_task_id_to_interactions.sql`

Se agregó el campo `task_id` a la tabla `crm_interactions`:

```sql
-- Add task_id column to crm_interactions
ALTER TABLE crm_interactions
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for task_id
CREATE INDEX IF NOT EXISTS idx_crm_interactions_task_id 
ON crm_interactions(task_id);

-- Add comment to explain purpose
COMMENT ON COLUMN crm_interactions.task_id IS 
'Optional reference to a task. Allows linking customer interactions to specific tasks for better tracking and context.';
```

### 2. Backend - Schemas

**Archivo**: [`backend/app/schemas/crm.py`](../backend/app/schemas/crm.py:47-69)

Se agregó el campo `task_id` a los esquemas de interacciones:

```python
# ==============================================================================
# MODELOS PARA INTERACCIONES (HISTORIAL)
# ==============================================================================
class InteractionBase(BaseModel):
    interaction_type: str = Field(..., description="Ej: meeting, call, email, note, sale")
    description: str
    interaction_date: Optional[datetime] = None
    task_id: Optional[UUID] = Field(None, description="Optional reference to a task")

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    interaction_type: Optional[str] = None
    description: Optional[str] = None
    interaction_date: Optional[datetime] = None
    task_id: Optional[UUID] = None

class InteractionResponse(InteractionBase):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
```

**Cambios realizados**:
- Línea 50: Agregado campo `task_id` a `InteractionBase`
- Línea 59: Agregado campo `task_id` a `InteractionUpdate`

### 3. Backend - Router

**Archivo**: [`backend/app/routers/crm.py`](../backend/app/routers/crm.py:139-154)

Se modificó el endpoint para listar interacciones para incluir información de la tarea vinculada:

```python
# ==============================================================================
# 5. HISTORIAL DE INTERACCIONES
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
```

**Cambios realizados**:
- Línea 147: Modificado select para incluir join con tabla `tasks`
- Línea 148: Se usa left join implícito porque `task_id` puede ser NULL

### 4. Frontend - Estados

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:45-52)

Se agregaron los estados necesarios para el selector de tareas:

```typescript
// States for new interaction
const [showAddForm, setShowAddForm] = useState(false);
const [newInteractionType, setNewInteractionType] = useState("note");
const [newDescription, setNewDescription] = useState("");
const [newInteractionDate, setNewInteractionDate] = useState<string>("");
const [selectedTaskId, setSelectedTaskId] = useState<string>("");
const [tasks, setTasks] = useState<any[]>([]);
const [loadingTasks, setLoadingTasks] = useState(false);
const [addingInteraction, setAddingInteraction] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const fileForNoteRef = useRef<HTMLInputElement>(null);
```

**Cambios realizados**:
- Línea 49: Agregado estado `selectedTaskId`
- Línea 50: Agregado estado `tasks`
- Línea 51: Agregado estado `loadingTasks`

### 5. Frontend - Interface

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:19-32)

Se modificó el interface `Interaction` para incluir información de la tarea:

```typescript
interface Interaction {
  id: string;
  interaction_type: string;
  description: string;
  interaction_date: string;
  created_at: string;
  task_id: string | null;
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
  } | null;
}
```

**Cambios realizados**:
- Línea 24: Agregado campo `task_id`
- Línea 29: Agregado campo `tasks` con información de la tarea

### 6. Frontend - Cargar Tareas

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:74-114)

Se modificó el `useEffect` para cargar las tareas al cargar la página:

```typescript
useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
 
    try {
      // Fetch customer details
      const custResp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
 
      if (custResp.ok) {
        const custData = await custResp.json();
        setCustomer(custData);
      }
 
      // Fetch customer interactions
      const intResp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
 
      if (intResp.ok) {
        const intData = await intResp.json();
        setInteractions(intData);
      }

      // Fetch tasks for the task selector
      const tasksResp = await fetch(`http://127.0.0.1:8000/api/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (tasksResp.ok) {
        const tasksData = await tasksResp.json();
        setTasks(tasksData);
      }

      // Fetch customer files
      const filesResp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/files`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (filesResp.ok) {
        const filesData = await filesResp.json();
        setFiles(filesData);
      }

    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  };
 
  if (customerId) {
    fetchData();
  }
}, [customerId, router]);
```

**Cambios realizados**:
- Líneas 106-114: Agregado código para cargar tareas desde el endpoint `/api/tasks`

### 7. Frontend - Selector de Tareas

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:734-762)

Se agregó un selector de tareas en el formulario de creación de interacciones:

```typescript
<div className="w-full sm:w-1/3">
   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha (opcional)</label>
   <input
     type="datetime-local"
     className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
     value={newInteractionDate}
     onChange={(e) => setNewInteractionDate(e.target.value)}
   />
</div>
<div className="w-full sm:w-1/3">
   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tarea Relacionada (opcional)</label>
   <select
     className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium appearance-none"
     value={selectedTaskId}
     onChange={(e) => setSelectedTaskId(e.target.value)}
   >
     <option value="">Sin tarea relacionada</option>
     {tasks.map((task: any) => (
       <option key={task.id} value={task.id}>
         {task.title} ({task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'})
       </option>
     ))}
   </select>
</div>
```

**Cambios realizados**:
- Líneas 743-762: Agregado selector de tareas con todas las tareas disponibles

### 8. Frontend - Crear Interacción

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:210-223)

Se modificó la función `handleAddInteraction` para incluir el `task_id`:

```typescript
// Crear la nota/interacción
const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    interaction_type: newInteractionType,
    description: descriptionWithFile,
    interaction_date: newInteractionDate || null,
    task_id: selectedTaskId || null
  })
});
```

**Cambios realizados**:
- Línea 213: Agregado campo `task_id` al body de la petición

### 9. Frontend - Reset de Estado

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:217-223)

Se agregó el reset del `selectedTaskId` después de crear una interacción:

```typescript
if (resp.ok) {
  const newInteraction = await resp.json();
  setInteractions([newInteraction, ...interactions]);
  setNewDescription("");
  setShowAddForm(false);
  setSelectedFile(null);
  setSelectedTaskId("");
  if (fileForNoteRef.current) fileForNoteRef.current.value = "";
} else {
  console.error("Failed to add interaction");
}
```

**Cambios realizados**:
- Línea 222: Agregado `setSelectedTaskId("")` para resetear el estado

### 10. Frontend - Tooltip con Estatus de Tarea

**Archivo**: [`frontend/src/app/(dashboard)/crm/[id]/page.tsx`](../frontend/src/app/(dashboard)/crm/[id]/page.tsx:850-920)

Se agregó un tooltip con el estatus de la tarea cuando se muestra una interacción:

```typescript
<div className="flex items-center justify-between mb-2">
  <h4 className="text-sm font-bold text-slate-800 capitalize flex items-center gap-2">
     {interaction.interaction_type}
  </h4>
  {interaction.tasks && (
    <div className="relative group">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
        <Briefcase size={12} />
        <span>Tarea</span>
      </div>
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-20">
        <div className="font-bold text-cyan-400 mb-1">{interaction.tasks.title}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Estado:</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              interaction.tasks.status === 'completed' ? 'bg-green-500 text-white' :
              interaction.tasks.status === 'in_progress' ? 'bg-amber-500 text-white' :
              'bg-slate-500 text-white'
            }`}>
              {interaction.tasks.status === 'completed' ? 'Completada' : 
               interaction.tasks.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
            </span>
          </div>
          {interaction.tasks.priority && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Prioridad:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                interaction.tasks.priority === 'urgent' ? 'bg-red-500 text-white' :
                interaction.tasks.priority === 'high' ? 'bg-orange-500 text-white' :
                interaction.tasks.priority === 'medium' ? 'bg-blue-500 text-white' :
                'bg-slate-400 text-white'
              }`}>
                {interaction.tasks.priority === 'urgent' ? 'Urgente' : 
                 interaction.tasks.priority === 'high' ? 'Alta' :
                 interaction.tasks.priority === 'medium' ? 'Media' : 'Baja'}
              </span>
            </div>
          )}
          {interaction.tasks.due_date && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Fecha límite:</span>
              <span className="text-slate-200">
                {new Date(interaction.tasks.due_date).toLocaleDateString([], { dateStyle: 'medium' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
```

**Cambios realizados**:
- Líneas 854-920: Agregado tooltip con información detallada de la tarea
- El tooltip muestra: título, estado, prioridad y fecha límite de la tarea
- El tooltip aparece al hacer hover sobre el badge de tarea

## Funcionalidades Implementadas

### 1. Selector de Tareas
- ✅ Selector de tareas en el formulario de creación de interacciones
- ✅ Opción "Sin tarea relacionada" para no vincular ninguna tarea
- ✅ Muestra título y estado de cada tarea en el selector

### 2. Vinculación de Interacciones con Tareas
- ✅ Al crear una interacción, se puede seleccionar una tarea existente
- ✅ El `task_id` se guarda en la base de datos
- ✅ Las interacciones incluyen información de la tarea vinculada

### 3. Tooltip con Estatus de Tarea
- ✅ Badge de tarea en cada interacción que tiene una tarea vinculada
- ✅ Tooltip con información detallada de la tarea:
  - Título de la tarea
  - Estado (Completada, En Progreso, Pendiente)
  - Prioridad (Urgente, Alta, Media, Baja)
  - Fecha límite
- ✅ Colores distintivos para cada estado y prioridad

## Colores Utilizados

### Estados de Tarea
- **Completada**: `bg-green-500 text-white`
- **En Progreso**: `bg-amber-500 text-white`
- **Pendiente**: `bg-slate-500 text-white`

### Prioridades de Tarea
- **Urgente**: `bg-red-500 text-white`
- **Alta**: `bg-orange-500 text-white`
- **Media**: `bg-blue-500 text-white`
- **Baja**: `bg-slate-400 text-white`

## UX/UI Mejoras

### 1. Tooltip Interactivo
- El tooltip aparece al hacer hover sobre el badge de tarea
- Transición suave de opacidad (0 a 1)
- El tooltip tiene `pointer-events-none` por defecto y `pointer-events-auto` al hacer hover
- Z-index alto (20) para que el tooltip aparezca sobre otros elementos

### 2. Badge de Tarea
- Diseño atractivo con icono de maletín (Briefcase)
- Color de fondo cyan-50 con texto cyan-600
- Borde cyan-200
- Padding y border-radius para mejor apariencia

### 3. Selector de Tareas
- Diseño consistente con otros campos del formulario
- Muestra título y estado de cada tarea
- Opción "Sin tarea relacionada" como primera opción

## Pruebas Recomendadas

### Prueba 1: Crear Nota sin Tarea
1. Abrir la página de detalles de un cliente
2. Hacer clic en "Agregar Nota"
3. Dejar "Sin tarea relacionada" seleccionado
4. Escribir una descripción
5. Hacer clic en "Guardar Registro"
6. Verificar que la nota se crea sin error

**Resultado esperado**: ✅ La nota se crea correctamente sin ninguna tarea vinculada

### Prueba 2: Crear Nota con Tarea
1. Abrir la página de detalles de un cliente
2. Hacer clic en "Agregar Nota"
3. Seleccionar una tarea del selector
4. Escribir una descripción
5. Hacer clic en "Guardar Registro"
6. Verificar que la nota se crea sin error

**Resultado esperado**: ✅ La nota se crea correctamente con la tarea vinculada

### Prueba 3: Ver Tooltip de Tarea
1. Abrir la página de detalles de un cliente
2. Crear una nota con una tarea vinculada
3. Hacer hover sobre el badge de tarea
4. Verificar que el tooltip se muestra con la información correcta

**Resultado esperado**: ✅ El tooltip se muestra con título, estado, prioridad y fecha límite de la tarea

### Prueba 4: Ver Lista de Interacciones
1. Abrir la página de detalles de un cliente
2. Crear varias notas con diferentes tareas vinculadas
3. Verificar que todas las interacciones se muestran correctamente

**Resultado esperado**: ✅ Todas las interacciones se muestran correctamente con sus tareas vinculadas

## Beneficios

### 1. Mejor Seguimiento de Clientes
- Permite relacionar las interacciones con tareas específicas
- Facilita el seguimiento de actividades relacionadas con tareas
- Mejora la organización y contexto del historial del cliente

### 2. Mejor Contexto de Interacciones
- Al ver una interacción, se puede ver inmediatamente la tarea relacionada
- El tooltip proporciona información detallada de la tarea sin necesidad de navegar
- Ahorra tiempo al no tener que buscar la tarea en otra parte de la aplicación

### 3. Mejor Gestión de Tareas
- Permite ver qué tareas están relacionadas con qué interacciones
- Facilita la planificación y seguimiento de actividades
- Mejora la priorización y asignación de recursos

## Archivos Modificados

1. **`supabase/migrations/20260328020000_add_task_id_to_interactions.sql`** - Migración de base de datos
2. **`backend/app/schemas/crm.py`** - Esquemas de interacciones
3. **`backend/app/routers/crm.py`** - Router de CRM
4. **`frontend/src/app/(dashboard)/crm/[id]/page.tsx`** - Página de detalles de cliente

## Documentación Relacionada

- [`plans/mejoras_seguimiento_crm.md`](../plans/mejoras_seguimiento_crm.md) - Plan detallado de mejoras para seguimiento de clientes
- [`docs/implementacion_navegacion_detalles_cliente.md`](implementacion_navegacion_detalles_cliente.md) - Implementación de navegación a detalles de cliente

## Próximos Pasos

1. **Probar funcionalidad completa** - Verificar que todas las funcionalidades funcionan correctamente
2. **Agregar edición de tareas desde el tooltip** - Permitir editar tareas directamente desde el tooltip
3. **Agregar navegación a la tarea desde el tooltip** - Permitir navegar a la página de detalles de la tarea
4. **Agregar filtros en el selector de tareas** - Filtrar tareas por estado o prioridad
5. **Mejorar el diseño del tooltip** - Hacer el tooltip más atractivo y funcional

## Conclusión

La implementación de vinculación de notas con tareas permite un mejor seguimiento de los clientes al relacionar las interacciones con tareas específicas. El tooltip con información detallada de la tarea mejora la experiencia de usuario al proporcionar contexto inmediato sin necesidad de navegar a otra parte de la aplicación.

La implementación es limpia, mantenible y sigue las mejores prácticas de UX/UI, con transiciones suaves, colores distintivos y un diseño consistente con el resto de la aplicación.
