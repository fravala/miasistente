# Implementación de Modal de Detalles de Tarea

## Descripción General

Se ha implementado un modal de detalles de tarea con funcionalidad completa de edición. Este modal permite a los usuarios ver y editar todos los detalles de una tarea, incluyendo título, descripción, estado, prioridad y fecha de vencimiento.

## Características Implementadas

### 1. Apertura del Modal

**Trigger**: El modal se abre al hacer clic en cualquier tarjeta de tarea en las vistas de cuadrícula o Kanban.

**Función handleOpenTaskModal**:
```typescript
const handleOpenTaskModal = (task: Task) => {
  setSelectedTask(task);
  setEditTitle(task.title);
  setEditDescription(task.description || "");
  setEditPriority(task.priority);
  setEditStatus(task.status);
  setEditDueDate(task.due_date || "");
  setShowTaskModal(true);
};
```

**Funcionalidad**:
- Guarda la tarea seleccionada en el estado
- Inicializa los campos de edición con los valores actuales de la tarea
- Muestra el modal

### 2. Cierre del Modal

**Función handleCloseTaskModal**:
```typescript
const handleCloseTaskModal = () => {
  setShowTaskModal(false);
  setSelectedTask(null);
};
```

**Triggers**:
- Botón X en la esquina superior derecha del modal
- Botón "Cancelar" en el pie del modal

### 3. Estructura del Modal

**Header del Modal**:
- Icono de estado de la tarea
- Título "Detalles de la Tarea"
- Botón X para cerrar

**Cuerpo del Modal**:
- **Título**: Campo de texto editable
- **Descripción**: Área de texto editable con 4 filas
- **Estado**: Selector desplegable con opciones:
  - ⏳ Pendiente
  - 🔄 En Progreso
  - ✅ Completada
- **Prioridad**: Selector desplegable con opciones:
  - 🟢 Baja
  - 🟡 Media
  - 🟠 Alta
  - 🔴 Urgente
- **Fecha de Vencimiento**: Selector de fecha
- **Información Meta**: Sección con información de solo lectura:
  - Fecha de creación
  - Última actualización

**Pie del Modal**:
- Botón "Eliminar" (izquierda)
- Botón "Cancelar" (derecha)
- Botón "Guardar Cambios" (derecha, primario)

### 4. Actualización de Tareas

**Función handleUpdateTask**:
```typescript
const handleUpdateTask = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedTask || !editTitle.trim()) return;

  setUpdatingTask(true);
  const token = localStorage.getItem("token");
  
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription || null,
        priority: editPriority,
        status: editStatus,
        due_date: editDueDate || null
      })
    });

    if (resp.ok) {
      const updatedTask = await resp.json();
      setTasks(prevTasks => prevTasks.map(t => t.id === selectedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask);
      alert("Tarea actualizada exitosamente");
    } else {
      const errorData = await resp.json();
      console.error("Failed to update task:", errorData);
      alert(`Error al actualizar tarea: ${errorData.detail || "Error desconocido"}`);
    }
  } catch (err) {
    console.error("Error updating task:", err);
    alert("Error de red al actualizar tarea");
  } finally {
    setUpdatingTask(false);
  }
};
```

**Funcionalidad**:
- Envía una petición PATCH al backend con todos los campos actualizados
- Actualiza el estado de las tareas con la tarea actualizada
- Muestra alerta de éxito o error
- Muestra estado de carga mientras se actualiza

### 5. Eliminación de Tarea desde el Modal

**Funcionalidad**:
- Botón "Eliminar" en el pie del modal
- Confirma la acción antes de eliminar
- Cierra el modal después de eliminar
- Actualiza el estado de tareas

### 6. Estados Nuevos

```typescript
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [showTaskModal, setShowTaskModal] = useState(false);
const [editTitle, setEditTitle] = useState("");
const [editDescription, setEditDescription] = useState("");
const [editPriority, setEditPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
const [editStatus, setEditStatus] = useState<"pending" | "in_progress" | "completed">("pending");
const [editDueDate, setEditDueDate] = useState<string>("");
const [updatingTask, setUpdatingTask] = useState(false);
```

### 7. Nueva Función de Formato de Fecha y Hora

**Función formatDateTime**:
```typescript
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "Sin fecha";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", { 
    month: "short", 
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};
```

**Uso**: Muestra la fecha y hora de creación y última actualización en el modal.

### 8. Modificaciones en Componentes Existentes

**KanbanColumn**:
- Agregado `onClick={() => handleOpenTaskModal(task)}` a las tarjetas de tareas
- Modificado el botón de eliminar para usar `e.stopPropagation()` y evitar abrir el modal

**Vista de Cuadrícula**:
- Agregado `onClick={() => handleOpenTaskModal(task)}` a las tarjetas de tareas
- Modificado el botón de estado para usar `e.stopPropagation()` y evitar abrir el modal
- Modificado el botón de eliminar para usar `e.stopPropagation()` y evitar abrir el modal

**handleStatusChange**:
- Actualizada para actualizar también `selectedTask` si está abierta la tarea que se está modificando:
  ```typescript
  if (selectedTask?.id === taskId) {
    setSelectedTask(updatedTask);
  }
  ```

**handleDeleteTask**:
- Actualizada para cerrar el modal si se elimina la tarea que está abierta:
  ```typescript
  if (selectedTask?.id === taskId) {
    setShowTaskModal(false);
    setSelectedTask(null);
  }
  ```

### 9. Iconos Importados

Se agregó un nuevo icono de lucide-react:
- `X`: Icono para cerrar el modal

## Archivos Modificados

- `frontend/src/app/(dashboard)/tasks/page.tsx` - Implementación completa del modal de detalles

## Cambios en el Código

### 1. Nuevas Importaciones

```typescript
import { Search, Plus, CheckCircle, Circle, AlertCircle, Clock, Calendar, Flag, Trash2, Edit2, Filter, ArrowDownUp, LayoutGrid, Columns, X } from "lucide-react";
```

### 2. Nuevos Estados

```typescript
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [showTaskModal, setShowTaskModal] = useState(false);
const [editTitle, setEditTitle] = useState("");
const [editDescription, setEditDescription] = useState("");
const [editPriority, setEditPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
const [editStatus, setEditStatus] = useState<"pending" | "in_progress" | "completed">("pending");
const [editDueDate, setEditDueDate] = useState<string>("");
const [updatingTask, setUpdatingTask] = useState(false);
```

### 3. Nuevas Funciones

```typescript
const handleOpenTaskModal = (task: Task) => { ... };
const handleCloseTaskModal = () => { ... };
const handleUpdateTask = async (e: React.FormEvent) => { ... };
const formatDateTime = (dateString: string | null) => { ... };
```

### 4. Modal en el JSX

```typescript
{showTaskModal && selectedTask && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
      {/* Modal Header */}
      {/* Modal Body */}
      {/* Modal Footer */}
    </div>
  </div>
)}
```

## Funcionalidades Mantenidas

Todas las funcionalidades existentes se mantienen sin cambios:

1. **Vista Kanban**: Arrastrar y soltar, columnas de estado
2. **Vista de Cuadrícula**: Tarjetas de tareas con iconos de estado
3. **Crear Tareas**: Formulario completo para crear nuevas tareas
4. **Eliminar Tareas**: Botón de eliminar en cada tarjeta
5. **Cambiar Estado**: Click en icono de estado o arrastrar en Kanban
6. **Filtros**: Filtros por estado y prioridad
7. **Selector de Vista**: Alternar entre vista de cuadrícula y Kanban

## Beneficios de la Implementación

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden ver y editar todos los detalles de una tarea en un modal dedicado
2. **Eficiencia**: No es necesario navegar a una página separada para editar una tarea
3. **Contexto**: El modal muestra información meta (fecha de creación, última actualización) que no está visible en las tarjetas
4. **Flexibilidad**: Los usuarios pueden editar cualquier campo de la tarea desde el modal
5. **Feedback Visual**: El modal tiene animaciones de entrada y salida para una experiencia fluida

## Pruebas Recomendadas

1. **Abrir Modal**:
   - Hacer clic en una tarjeta en vista de cuadrícula
   - Hacer clic en una tarjeta en vista Kanban
   - Verificar que el modal se abre con los datos correctos

2. **Editar Tarea**:
   - Cambiar el título
   - Cambiar la descripción
   - Cambiar el estado
   - Cambiar la prioridad
   - Cambiar la fecha de vencimiento
   - Hacer clic en "Guardar Cambios"
   - Verificar que los cambios se guardan y se reflejan en la interfaz

3. **Eliminar Tarea**:
   - Hacer clic en "Eliminar" en el modal
   - Confirmar la acción
   - Verificar que la tarea se elimina y el modal se cierra

4. **Cerrar Modal**:
   - Hacer clic en el botón X
   - Hacer clic en "Cancelar"
   - Verificar que el modal se cierra sin guardar cambios

5. **Validación**:
   - Intentar guardar con el título vacío
   - Verificar que el botón "Guardar Cambios" está deshabilitado

6. **Sincronización**:
   - Abrir una tarea
   - Cambiar su estado desde el modal
   - Verificar que el estado se actualiza en la tarjeta
   - Cambiar el estado de otra tarea mientras el modal está abierto
   - Verificar que la tarea en el modal no se ve afectada

7. **Responsive Design**:
   - Probar el modal en diferentes tamaños de pantalla
   - Verificar que el modal se ajusta correctamente

## Notas Técnicas

- **Backdrop Blur**: El modal usa `backdrop-blur-sm` para desenfocar el contenido detrás
- **Animaciones**: El modal usa animaciones de entrada (`fade-in`, `zoom-in-95`) para una experiencia fluida
- **Scroll**: El modal tiene `max-h-[90vh] overflow-y-auto` para permitir scroll cuando el contenido es largo
- **Stop Propagation**: Los botones dentro de las tarjetas usan `e.stopPropagation()` para evitar abrir el modal al hacer clic en ellos
- **Estado de Carga**: El botón "Guardar Cambios" muestra "Guardando..." mientras se actualiza la tarea

## Fecha

2026-03-27
