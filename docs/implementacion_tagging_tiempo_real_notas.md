# Implementación de Tagging en Tiempo Real en Notas

## Resumen

Se implementó la funcionalidad de autocompletado con "#" en el textarea de notas, permitiendo a los usuarios mencionar tareas mientras escriben notas de clientes, similar a las menciones en Slack o GitHub.

## Cambios Realizados

### 1. Frontend

**Archivo**: `frontend/src/app/(dashboard)/crm/[id]/page.tsx`

#### Estados para Control de Sugerencias (líneas 63-67)

```typescript
// States for task mention autocomplete
const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
const [mentionQuery, setMentionQuery] = useState("");
const [mentionStartPos, setMentionStartPos] = useState(0);
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

**Descripción de Estados**:
- `showTaskSuggestions`: Controla si se muestra la lista de sugerencias
- `filteredTasks`: Almacena las tareas filtradas según la búsqueda
- `mentionQuery`: Almacena el texto después del símbolo "#"
- `mentionStartPos`: Almacena la posición donde comienza la mención
- `textareaRef`: Referencia al textarea para manipular el cursor

#### Función handleDescriptionChange (líneas 179-203)

```typescript
const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  const cursorPosition = e.target.selectionStart;
  
  // Find the last # symbol before the cursor
  const textBeforeCursor = value.substring(0, cursorPosition);
  const lastHashIndex = textBeforeCursor.lastIndexOf('#');
  
  if (lastHashIndex !== -1) {
    // Extract the text after the last #
    const query = textBeforeCursor.substring(lastHashIndex + 1);
    
    // Only show suggestions if there's no space after the #
    const lastSpaceIndex = query.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      setMentionQuery(query);
      setMentionStartPos(lastHashIndex);
      
      // Filter tasks based on query
      const filtered = tasks.filter((task: any) => 
        task.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTasks(filtered);
      setShowTaskSuggestions(true);
    } else {
      setShowTaskSuggestions(false);
    }
  } else {
    setShowTaskSuggestions(false);
  }
  
  setNewDescription(value);
};
```

**Lógica**:
1. Obtiene el texto y la posición del cursor
2. Busca el último símbolo "#" antes del cursor
3. Si encuentra "#", extrae el texto después del "#"
4. Solo muestra sugerencias si no hay espacio después del "#"
5. Filtra las tareas según la búsqueda (case-insensitive)
6. Muestra la lista de sugerencias

#### Función handleSelectTask (líneas 205-222)

```typescript
const handleSelectTask = (task: any) => {
  const textBeforeMention = newDescription.substring(0, mentionStartPos);
  const textAfterMention = newDescription.substring(mentionStartPos + mentionQuery.length + 1);
  
  // Replace the mention with the task title
  const newDescriptionWithTask = `${textBeforeMention}#${task.title} ${textAfterMention}`;
  setNewDescription(newDescriptionWithTask);
  setShowTaskSuggestions(false);
  
  // Also set the task_id
  setSelectedTaskId(task.id);
  
  // Focus back on textarea
  if (textareaRef.current) {
    const newCursorPosition = mentionStartPos + task.title.length + 2; // +2 for # and space
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
  }
};
```

**Lógica**:
1. Extrae el texto antes y después de la mención
2. Reemplaza la mención con el título de la tarea
3. Oculta la lista de sugerencias
4. Establece el `task_id` de la tarea seleccionada
5. Mueve el cursor después de la tarea insertada

#### Modificación del Textarea (líneas 826-858)

```typescript
<div className="mb-4 relative">
  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Detalles / Resumen</label>
  <textarea 
    ref={textareaRef}
    rows={3}
    placeholder="Describe qué sucedió, acuerdos, siguiente paso... Usa # para mencionar tareas"
    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium resize-none placeholder:text-slate-300"
    value={newDescription}
    onChange={handleDescriptionChange}
  />
  
  {/* Task Suggestions Dropdown */}
  {showTaskSuggestions && filteredTasks.length > 0 && (
    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
      {filteredTasks.map((task: any) => (
        <button
          key={task.id}
          type="button"
          onClick={() => handleSelectTask(task)}
          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-3"
        >
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-sm">{task.title}</div>
            <div className="text-xs text-slate-500 mt-1">
              {task.status === 'completed' ? '✓ Completada' : task.status === 'in_progress' ? '🔄 En Progreso' : '⏳ Pendiente'}
            </div>
          </div>
          <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
            task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' :
            task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-slate-50 text-slate-600 border-slate-100'
          }`}>
            {task.priority}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
```

**Características**:
- Textarea con referencia `textareaRef` para manipular el cursor
- Placeholder actualizado indicando cómo usar las menciones
- Dropdown de sugerencias con posición absoluta y z-index alto
- Cada sugerencia muestra:
  - Título de la tarea
  - Estado (Completada/En Progreso/Pendiente)
  - Prioridad con color codificado
- Hover effect en las sugerencias
- Scroll vertical si hay muchas sugerencias

## Características Implementadas

1. **Detección de "#"**: El sistema detecta automáticamente cuando el usuario escribe "#"

2. **Filtrado en Tiempo Real**: Las tareas se filtran mientras el usuario escribe después del "#"

3. **Búsqueda Case-Insensitive**: La búsqueda de tareas no distingue entre mayúsculas y minúsculas

4. **Sugerencias Visuales**: Cada sugerencia muestra:
   - Título de la tarea
   - Estado con icono
   - Prioridad con color codificado

5. **Selección de Tarea**: Al hacer clic en una sugerencia:
   - El título de la tarea se inserta en el texto
   - El `task_id` se establece automáticamente
   - El cursor se posiciona después de la tarea insertada

6. **Placeholder Informativo**: El placeholder indica cómo usar las menciones

## Estilos Visuales

### Dropdown de Sugerencias
- **Posición**: Absoluta debajo del textarea
- **z-index**: 50 para aparecer sobre otros elementos
- **Fondo**: Blanco con borde gris
- **Sombra**: Sombra suave para profundidad
- **Altura máxima**: 60px con scroll vertical

### Sugerencias Individuales
- **Hover**: Fondo gris claro al pasar el mouse
- **Borde**: Borde inferior gris (excepto el último)
- **Layout**: Flexbox con espacio entre elementos

### Prioridades
- **Urgente**: `bg-red-50 text-red-600 border-red-100`
- **Alta**: `bg-orange-50 text-orange-600 border-orange-100`
- **Media**: `bg-blue-50 text-blue-600 border-blue-100`
- **Baja**: `bg-slate-50 text-slate-600 border-slate-100`

## Uso

### Mencionar una Tarea

1. Ir a la página de detalles de un cliente
2. Hacer clic en "Nueva Nota"
3. En el textarea de "Detalles / Resumen", escribir "#"
4. Comenzar a escribir el título de la tarea
5. Las sugerencias aparecerán automáticamente
6. Hacer clic en la tarea deseada
7. La tarea se insertará en el texto y el `task_id` se establecerá

### Ejemplo

```
Texto antes: "Discutimos el presupuesto para el proyecto #"
Usuario escribe: "pres"
Sugerencias aparecen:
  - Preparar propuesta para cliente X (🔄 En Progreso) [Media]
  - Presentar presupuesto a equipo (⏳ Pendiente) [Alta]

Usuario hace clic en "Preparar propuesta para cliente X"

Resultado: "Discutimos el presupuesto para el proyecto #Preparar propuesta para cliente X "
```

## Comportamiento

### Cuándo se Muestran las Sugerencias

1. El usuario escribe "#"
2. No hay espacio después del "#"
3. Hay tareas que coinciden con la búsqueda

### Cuándo se Ocultan las Sugerencias

1. El usuario escribe un espacio después del "#"
2. El usuario borra el último "#"
3. El usuario selecciona una tarea

### Filtrado de Tareas

- La búsqueda es case-insensitive
- Busca coincidencias parciales en el título de la tarea
- Muestra todas las tareas que coinciden

## Integración con Funcionalidad Existente

La funcionalidad de tagging en tiempo real se integra con:
- **Selector de tareas**: El `task_id` se establece automáticamente al seleccionar una tarea
- **Tooltip de tareas**: Si hay una tarea vinculada, se muestra el tooltip con el estado
- **Campo task_id**: El `task_id` se guarda en la base de datos al crear la interacción

## Archivos Modificados

1. `frontend/src/app/(dashboard)/crm/[id]/page.tsx` - Implementación de tagging en tiempo real

## Archivos Creados

1. `docs/implementacion_tagging_tiempo_real_notas.md` - Esta documentación

## Próximos Pasos

1. Probar la funcionalidad de tagging en tiempo real
2. Verificar que las sugerencias aparecen correctamente
3. Verificar que la selección de tareas funciona
4. Verificar que el `task_id` se establece correctamente
5. Verificar que el cursor se posiciona correctamente
6. Considerar agregar soporte para múltiples menciones en una misma nota
7. Considerar agregar soporte para mencionar clientes con "@"

## Notas

- La funcionalidad es similar a las menciones en Slack o GitHub
- Solo se muestra una sugerencia a la vez (la última "#")
- El `task_id` se establece automáticamente al seleccionar una tarea
- El cursor se posiciona automáticamente después de la tarea insertada
- La búsqueda es case-insensitive para mejor experiencia de usuario
- Las sugerencias tienen un z-index alto para aparecer sobre otros elementos

## Ventajas

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden mencionar tareas rápidamente sin tener que buscar en el selector
2. **Eficiencia**: No es necesario navegar a la página de tareas para buscar
3. **Contexto**: Las sugerencias muestran el estado y prioridad de las tareas
4. **Integración**: Se integra perfectamente con la funcionalidad existente de vincular notas con tareas
5. **Intuitivo**: El uso de "#" es familiar para usuarios de Slack, GitHub, etc.
