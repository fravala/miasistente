# Implementación de Tagging en Tiempo Real con Links Clickeables

## Resumen

Se implementó la funcionalidad de autocompletado con "#" en el textarea de notas, permitiendo a los usuarios mencionar tareas mientras escriben notas de clientes. Las menciones se crean como links Markdown clickeables que navegan a la página de tareas.

## Cambios Realizados

### 1. Instalación de Dependencias

**Comando**:
```bash
cd frontend && npm install react-markdown
cd frontend && npm install -D @tailwindcss/typography
```

**Paquetes instalados**:
- `react-markdown` - Para renderizar Markdown con links clickeables
- `@tailwindcss/typography` - Para estilos de Markdown con Tailwind CSS

### 2. Configuración de Tailwind CSS

**Archivo**: `frontend/postcss.config.mjs`

**Cambio**:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "@tailwindcss/typography": {}, // NUEVO
  },
};

export default config;
```

### 3. Estilos de Markdown

**Archivo**: `frontend/src/app/globals.css`

**Cambio**: Se agregaron estilos de `prose` para Markdown:
```css
@import "tailwindcss/theme";

@layer base {
  h1 {
    @apply text-2xl font-bold text-slate-800 mt-6 mb-4;
  }
  h2 {
    @apply text-xl font-bold text-slate-800 mt-5 mb-3;
  }
  h3 {
    @apply text-lg font-semibold text-slate-800 mt-4 mb-2;
  }
  p {
    @apply text-slate-600 leading-relaxed mb-3;
  }
  a {
    @apply text-cyan-600 hover:text-cyan-700 underline font-medium transition-colors;
  }
  ul {
    @apply list-disc list-inside space-y-2 ml-4;
  }
  ol {
    @apply list-decimal list-inside space-y-2 ml-4;
  }
  li {
    @apply text-slate-600 leading-relaxed;
  }
  strong {
    @apply font-semibold text-slate-800;
  }
  code {
    @apply bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-sm font-mono;
  }
  blockquote {
    @apply border-l-4 border-slate-200 pl-4 italic text-slate-600 my-4;
  }
}
```

### 4. Frontend - Página de Detalles de Cliente

**Archivo**: `frontend/src/app/(dashboard)/crm/[id]/page.tsx`

#### Import de ReactMarkdown (línea 6)
```typescript
import ReactMarkdown from 'react-markdown';
```

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

#### Función handleDescriptionChange (líneas 179-212)
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

#### Función handleSelectTask (líneas 214-231)
```typescript
const handleSelectTask = (task: any) => {
  const textBeforeMention = newDescription.substring(0, mentionStartPos);
  const textAfterMention = newDescription.substring(mentionStartPos + mentionQuery.length + 1);
  
  // Replace the mention with a clickable link to the task (Markdown format)
  const taskLink = `[${task.title}](/tasks)`;
  const newDescriptionWithTask = `${textBeforeMention}${taskLink} ${textAfterMention}`;
  setNewDescription(newDescriptionWithTask);
  setShowTaskSuggestions(false);
  
  // Also set the task_id
  setSelectedTaskId(task.id);
  
  // Focus back on textarea
  if (textareaRef.current) {
    const newCursorPosition = mentionStartPos + taskLink.length + 1; // +1 for space
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
  }
};
```

**Lógica**:
1. Extrae el texto antes y después de la mención
2. Reemplaza la mención con un link Markdown a la tarea: `[${task.title}](/tasks)`
3. Oculta la lista de sugerencias
4. Establece el `task_id` de la tarea seleccionada
5. Mueve el cursor después de la tarea insertada

#### Modificación del Textarea (líneas 850-883)
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

#### Visualización de Descripción con ReactMarkdown (líneas 1072-1076)
```typescript
) : (
  <div className="text-sm text-slate-600 font-medium leading-relaxed prose prose-sm max-w-none">
    <ReactMarkdown>{interaction.description}</ReactMarkdown>
  </div>
)
```

**Características**:
- Usa `ReactMarkdown` para renderizar Markdown
- Clases `prose prose-sm max-w-none` para estilos de Markdown con Tailwind CSS
- Los links Markdown se renderizan como links clickeables
- Los links navegan a `/tasks`

## Características Implementadas

### 1. Detección Automática de "#"
- El sistema detecta automáticamente cuando escribes "#"
- Muestra sugerencias de tareas en tiempo real
- Filtra las tareas según lo que escribes después del "#"

### 2. Dropdown de Sugerencias
- Aparece automáticamente debajo del textarea
- Muestra el título, estado y prioridad de cada tarea
- Colores codificados por prioridad:
  - 🔴 Urgente: rojo
  - 🟠 Alta: naranja
  - 🟡 Media: azul
  - 🟢 Baja: gris

### 3. Selección de Tarea
- Al hacer clic en una sugerencia:
  - El título de la tarea se inserta como link Markdown: `[${task.title}](/tasks)`
  - El `task_id` se establece automáticamente
  - El cursor se posiciona después de la tarea insertada
  - El link navega a la página de tareas

### 4. Links Clickeables
- Las menciones de tareas se crean como links Markdown
- Los links se renderizan con `ReactMarkdown`
- Al hacer clic en un link, navega a `/tasks`
- Los links tienen el estilo de `prose` de Tailwind CSS

### 5. Búsqueda Case-Insensitive
- La búsqueda de tareas no distingue mayúsculas/minúsculas
- Busca coincidencias parciales en el título

### 6. Estilos de Markdown
- Los estilos de Markdown se aplican con `@tailwindcss/typography`
- Clases `prose` para estilos consistentes
- Estilos personalizados en `globals.css`:
  - Títulos: `h1`, `h2`, `h3`
  - Párrafos: `p`
  - Links: `a` (color cyan, hover effect)
  - Listas: `ul`, `ol`
  - Elementos de lista: `li`
  - Texto fuerte: `strong`
  - Código: `code`
  - Citas: `blockquote`

## Uso

### Mencionar una Tarea

1. Ve a la página de detalles de un cliente
2. Haz clic en "Nueva Nota"
3. En el textarea de "Detalles / Resumen", escribe "#"
4. Comienza a escribir el título de la tarea
5. Las sugerencias aparecerán automáticamente
6. Haz clic en la tarea deseada
7. La tarea se insertará como link Markdown en el texto
8. El `task_id` se establecerá automáticamente

### Ejemplo

```
Texto: "Discutimos el presupuesto para el proyecto #"
Escribes: "pres"
Sugerencias aparecen:
  - Preparar propuesta para cliente X (🔄 En Progreso) [Media]
  - Presentar presupuesto a equipo (⏳ Pendiente) [Alta]

Haces clic en "Preparar propuesta para cliente X"

Resultado: "Discutimos el presupuesto para el proyecto [Preparar propuesta para cliente X](/tasks) "
```

### Ver Link en la Nota

1. La nota se guarda en la base de datos
2. La descripción se renderiza con `ReactMarkdown`
3. El link Markdown se convierte en un link clickeable
4. Al hacer clic en el link, navega a `/tasks`

## Archivos Modificados

1. **`frontend/package.json`** - Dependencias agregadas:
   - `react-markdown`
   - `@tailwindcss/typography`

2. **`frontend/postcss.config.mjs`** - Plugin de typography agregado

3. **`frontend/src/app/globals.css`** - Estilos de prose agregados

4. **`frontend/src/app/(dashboard)/crm/[id]/page.tsx`** - Implementación completa de tagging en tiempo real:
   - Import de `ReactMarkdown` (línea 6)
   - Estados para sugerencias (líneas 63-67)
   - Función `handleDescriptionChange` (líneas 179-212)
   - Función `handleSelectTask` (líneas 214-231)
   - Textarea modificado con ref y onChange (líneas 850-883)
   - Dropdown de sugerencias (líneas 857-882)
   - Visualización con `ReactMarkdown` (líneas 1072-1076)

## Archivos Creados

1. **`docs/implementacion_tagging_links_clickeables.md`** - Esta documentación

## Ventajas

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden mencionar tareas rápidamente sin tener que buscar en el selector
2. **Eficiencia**: No es necesario navegar a la página de tareas para buscar
3. **Contexto**: Las sugerencias muestran el estado y prioridad de las tareas
4. **Links Clickeables**: Las menciones son links clickeables que navegan a la página de tareas
5. **Integración**: Se integra perfectamente con la funcionalidad existente de vincular notas con tareas
6. **Intuitivo**: El uso de "#" es familiar para usuarios de Slack, GitHub, etc.
7. **Markdown**: Soporte completo para Markdown con estilos consistentes
8. **Estilos Personalizados**: Estilos de Markdown personalizados con Tailwind CSS

## Notas

- La funcionalidad es similar a las menciones en Slack o GitHub
- Solo se muestra una sugerencia a la vez (la última "#")
- El `task_id` se establece automáticamente al seleccionar una tarea
- El cursor se posiciona automáticamente después de la tarea insertada
- La búsqueda es case-insensitive para mejor experiencia de usuario
- Las sugerencias tienen un z-index alto para aparecer sobre otros elementos
- Los links Markdown se renderizan con estilos de `prose` de Tailwind CSS
- Los links navegan a `/tasks` para ver todas las tareas

## Próximos Pasos

1. Probar la funcionalidad de tagging en tiempo real
2. Verificar que las sugerencias aparecen correctamente
3. Verificar que la selección de tareas funciona
4. Verificar que los links se renderizan correctamente
5. Verificar que los links son clickeables
6. Verificar que el `task_id` se establece correctamente
7. Considerar agregar soporte para múltiples menciones en una misma nota
8. Considerar agregar soporte para mencionar clientes con "@"
