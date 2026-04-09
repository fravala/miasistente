# Implementación de Vista Kanban para Tareas

## Descripción General

Se ha implementado una vista Kanban para la gestión de tareas con funcionalidad completa de arrastrar y soltar (drag & drop). Esta implementación permite a los usuarios visualizar y organizar las tareas en tres columnas según su estado: Pendientes, En Progreso y Completadas.

## Características Implementadas

### 1. Vista Dual (Grid y Kanban)

**Selector de Vista**:
- Botón de cuadrícula (LayoutGrid) para la vista tradicional de tarjetas
- Botón de columnas (Columns) para la vista Kanban
- Alternancia fluida entre ambas vistas sin perder datos

**Estado de Vista**:
```typescript
const [viewMode, setViewMode] = useState<ViewMode>("grid");
```

### 2. Vista Kanban

**Estructura de Columnas**:
- **Pendientes** (bg-slate-50, border-slate-300)
- **En Progreso** (bg-blue-50, border-blue-300)
- **Completadas** (bg-emerald-50, border-emerald-300)

**Componente KanbanColumn**:
- Muestra el título de la columna con icono de estado
- Contador de tareas en cada columna
- Área de drop para arrastrar tareas
- Scroll vertical cuando hay muchas tareas
- Mensaje "No hay tareas" cuando la columna está vacía

**Tarjetas de Tareas en Kanban**:
- Draggable (arrastrable)
- Título de la tarea
- Descripción (si existe)
- Prioridad con color correspondiente
- Fecha de vencimiento
- Botón de eliminar
- Efecto visual al arrastrar (opacity y scale)

### 3. Funcionalidad de Arrastrar y Soltar (Drag & Drop)

**Eventos Implementados**:

1. **handleDragStart**:
   ```typescript
   const handleDragStart = (e: React.DragEvent, task: Task) => {
     setDraggedTask(task);
     e.dataTransfer.effectAllowed = "move";
     e.dataTransfer.setData("text/plain", task.id);
   };
   ```
   - Guarda la tarea arrastrada en el estado
   - Configura el efecto de arrastre como "move"
   - Almacena el ID de la tarea

2. **handleDragOver**:
   ```typescript
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = "move";
   };
   ```
   - Permite que la tarea se pueda soltar en la columna
   - Configura el efecto de drop como "move"

3. **handleDrop**:
   ```typescript
   const handleDrop = async (e: React.DragEvent, newStatus: Task["status"]) => {
     e.preventDefault();
     if (!draggedTask) return;
     await handleStatusChange(draggedTask.id, newStatus);
     setDraggedTask(null);
   };
   ```
   - Actualiza el estado de la tarea al estado de la columna
   - Limpia el estado de la tarea arrastrada

4. **handleDragEnd**:
   ```typescript
   const handleDragEnd = () => {
     setDraggedTask(null);
   };
   ```
   - Limpia el estado de la tarea arrastrada cuando se termina el arrastre

**Estados de Arrastre**:
- `draggedTask`: Estado que mantiene la tarea actualmente arrastrada
- Efecto visual: La tarea arrastrada se vuelve semi-transparente y se reduce ligeramente

### 4. Organización de Tareas por Estado

**Función tasksByStatus**:
```typescript
const tasksByStatus = {
  pending: tasks.filter(t => t.status === "pending"),
  in_progress: tasks.filter(t => t.status === "in_progress"),
  completed: tasks.filter(t => t.status === "completed")
};
```

Organiza las tareas en tres grupos según su estado para facilitar la visualización en el Kanban.

### 5. Iconos Importados

Se agregaron dos nuevos iconos de lucide-react:
- `LayoutGrid`: Icono para vista de cuadrícula
- `Columns`: Icono para vista Kanban

## Archivos Modificados

- `frontend/src/app/(dashboard)/tasks/page.tsx` - Implementación completa de vista Kanban

## Cambios en el Código

### 1. Nuevas Importaciones

```typescript
import { Search, Plus, CheckCircle, Circle, AlertCircle, Clock, Calendar, Flag, Trash2, Edit2, Filter, ArrowDownUp, LayoutGrid, Columns } from "lucide-react";
import { useState, useEffect, useRef } from "react";
```

### 2. Nuevos Estados

```typescript
const [viewMode, setViewMode] = useState<ViewMode>("grid");
const [draggedTask, setDraggedTask] = useState<Task | null>(null);
```

### 3. Nuevos Handlers de Drag & Drop

```typescript
const handleDragStart = (e: React.DragEvent, task: Task) => { ... };
const handleDragOver = (e: React.DragEvent) => { ... };
const handleDrop = async (e: React.DragEvent, newStatus: Task["status"]) => { ... };
const handleDragEnd = () => { ... };
```

### 4. Nuevo Componente KanbanColumn

```typescript
const KanbanColumn = ({ status, title, tasks: columnTasks, bgColor, borderColor }: { 
  status: Task["status"]; 
  title: string; 
  tasks: Task[]; 
  bgColor: string; 
  borderColor: string; 
}) => ( ... );
```

### 5. Selector de Vista en el Header

```typescript
<div className="flex items-center gap-2 bg-white shadow-sm border border-slate-100 rounded-xl p-1">
  <button onClick={() => setViewMode("grid")} ...>
    <LayoutGrid size={18} />
  </button>
  <button onClick={() => setViewMode("kanban")} ...>
    <Columns size={18} />
  </button>
</div>
```

### 6. Renderizado Condicional de Vistas

```typescript
{viewMode === "kanban" ? (
  /* Kanban View */
  <div className="flex gap-4 overflow-x-auto pb-4">
    <KanbanColumn status="pending" ... />
    <KanbanColumn status="in_progress" ... />
    <KanbanColumn status="completed" ... />
  </div>
) : (
  /* Grid View */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {tasks.map((task) => { ... })}
  </div>
)}
```

## Funcionalidades Mantenidas

Todas las funcionalidades existentes se mantienen sin cambios:

1. **Crear tareas**: Formulario completo con título, descripción, prioridad y fecha de vencimiento
2. **Eliminar tareas**: Botón de eliminar en cada tarjeta
3. **Cambiar estado**: Click en el icono de estado en vista de cuadrícula
4. **Filtros**: Filtros por estado y prioridad funcionan en ambas vistas
5. **Búsqueda**: Barra de búsqueda (placeholder, funcionalidad por implementar)

## Beneficios de la Implementación

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden ver y organizar las tareas de forma más visual e intuitiva
2. **Productividad**: El arrastrar y soltar facilita el cambio de estado de las tareas
3. **Flexibilidad**: Los usuarios pueden alternar entre vista de cuadrícula y Kanban según sus preferencias
4. **Feedback Visual**: Efectos visuales claros durante el arrastre para indicar qué tarea se está moviendo
5. **Sin Dependencias Externas**: Implementado usando solo la API de Drag and Drop de HTML5

## Pruebas Recomendadas

1. **Alternar Vistas**:
   - Probar cambiar entre vista de cuadrícula y Kanban
   - Verificar que las tareas se muestran correctamente en ambas vistas

2. **Arrastrar y Soltar**:
   - Arrastrar una tarea de "Pendientes" a "En Progreso"
   - Arrastrar una tarea de "En Progreso" a "Completadas"
   - Arrastrar una tarea de "Completadas" de vuelta a "Pendientes"
   - Verificar que el estado se actualiza correctamente en el backend

3. **Crear Tareas**:
   - Crear una nueva tarea y verificar que aparece en la columna correcta
   - Verificar que la tarea se puede arrastrar inmediatamente

4. **Eliminar Tareas**:
   - Eliminar una tarea desde la vista Kanban
   - Verificar que desaparece de la columna

5. **Filtros**:
   - Aplicar filtros de estado y prioridad
   - Verificar que las columnas del Kanban se actualizan correctamente

6. **Responsive Design**:
   - Probar en diferentes tamaños de pantalla
   - Verificar que las columnas se ajustan correctamente

## Notas Técnicas

- **API de Drag and Drop**: Se utiliza la API nativa de HTML5, no requiere librerías externas
- **Estado Reactivo**: El estado de las tareas se mantiene sincronizado entre ambas vistas
- **Actualización en Tiempo Real**: Los cambios de estado se actualizan inmediatamente en la interfaz
- **Optimización**: Las tarjetas de tareas tienen efectos de transición suaves para mejorar la experiencia de usuario

## Fecha

2026-03-27
