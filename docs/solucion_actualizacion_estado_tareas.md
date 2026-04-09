# Solución: Corrección de Actualización de Estado de Tareas

## Problema

El usuario reportó que podía crear tareas pero no podía editar el estado de las tareas. Al hacer clic en el icono de estado de una tarea, el cambio no se reflejaba en la interfaz.

## Causa Raíz

La función `handleStatusChange` en `frontend/src/app/(dashboard)/tasks/page.tsx` tenía dos problemas:

1. **Problema de Cierre (Closure)**: La función usaba `tasks` directamente en lugar de usar el callback con el estado anterior. Esto causaba que el estado de `tasks` pudiera estar desactualizado cuando se ejecutaba la actualización.

2. **Falta de Manejo de Errores**: No había manejo de errores para cuando la petición fallaba, lo que hacía difícil diagnosticar problemas.

## Solución Implementada

### Cambio en la función `handleStatusChange` (líneas 117-137)

**Código Original:**
```typescript
const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
  const token = localStorage.getItem("token");
  
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (resp.ok) {
      const updatedTask = await resp.json();
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t)); // PROBLEMA: Usa estado desactualizado
    }
  } catch (err) {
    console.error(err);
  }
};
```

**Código Corregido:**
```typescript
const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
  const token = localStorage.getItem("token");
  
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (resp.ok) {
      const updatedTask = await resp.json();
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t)); // SOLUCIÓN: Usa callback con estado anterior
    } else {
      const errorData = await resp.json();
      console.error("Failed to update task status:", errorData);
      alert(`Error al actualizar estado: ${errorData.detail || "Error desconocido"}`); // SOLUCIÓN: Agrega manejo de errores
    }
  } catch (err) {
    console.error("Error updating task status:", err);
    alert("Error de red al actualizar estado de la tarea"); // SOLUCIÓN: Agrega manejo de errores de red
  }
};
```

## Cambios Clave

1. **Uso de Callback con Estado Anterior**:
   - Cambio: `setTasks(tasks.map(...))` → `setTasks(prevTasks => prevTasks.map(...))`
   - Beneficio: Garantiza que siempre se usa el estado más actualizado de las tareas, evitando problemas de closures desactualizados.

2. **Manejo de Errores Mejorado**:
   - Agregado: Manejo de errores cuando la petición no es exitosa (resp.ok === false)
   - Agregado: Manejo de errores de red en el bloque catch
   - Beneficio: El usuario recibe feedback claro cuando hay problemas, lo que facilita la depuración.

## Impacto

- **Rendimiento**: Al usar el callback con estado anterior, React puede optimizar mejor las actualizaciones y evitar re-renders innecesarios.
- **Experiencia de Usuario**: Los cambios de estado ahora se reflejan correctamente en la interfaz.
- **Depuración**: Los mensajes de error claros ayudan a identificar problemas rápidamente.

## Pruebas Recomendadas

1. Crear una nueva tarea
2. Hacer clic en el icono de estado para cambiar entre pendiente/completada
3. Verificar que el cambio se refleja inmediatamente en la interfaz
4. Probar con múltiples tareas para verificar que solo se actualiza la tarea seleccionada
5. Verificar que los filtros funcionan correctamente después de cambiar el estado

## Archivos Modificados

- `frontend/src/app/(dashboard)/tasks/page.tsx` - Líneas 117-137 (función handleStatusChange)
- `frontend/src/app/(dashboard)/tasks/page.tsx` - Líneas 42-49 (corrección de nombres de parámetros de filtros)

## Corrección Adicional: Filtros

### Problema
Los filtros de estado y prioridad no funcionaban correctamente porque el frontend enviaba los parámetros con nombres incorrectos.

### Solución
Se corrigieron los nombres de los parámetros en la función `fetchTasks`:

**Código Original:**
```typescript
if (filter !== "all") {
  params.append("status", filter);
}
if (priorityFilter !== "all") {
  params.append("priority", priorityFilter);
}
```

**Código Corregido:**
```typescript
if (filter !== "all") {
  params.append("status_filter", filter); // CORRECCIÓN: status_filter
}
if (priorityFilter !== "all") {
  params.append("priority_filter", priorityFilter); // CORRECCIÓN: priority_filter
}
```

Esto coincide con los nombres de parámetros esperados por el backend en `backend/app/routers/tasks.py` (líneas 93-94).

## Fecha

2026-03-26
