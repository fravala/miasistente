# Implementación de Funcionalidad de Eliminar Clientes en CRM

## Descripción General

Se ha implementado la funcionalidad de eliminar clientes/prospectos directamente desde la lista de CRM. Esto permite a los usuarios eliminar clientes sin necesidad de navegar a la página de detalles.

## Características Implementadas

### 1. Botón de Eliminar en Tarjeta

**Ubicación**: Cada tarjeta de cliente en la lista de CRM ahora tiene un botón de eliminar junto con los botones de editar, teléfono y correo.

**Icono**: Se usa el icono `Trash2` de lucide-react para representar la acción de eliminar.

**Estilo**:
- Color: Rojo en hover (`hover:text-red-500`)
- Fondo: Gris claro en hover (`hover:bg-red-50`)
- Tooltip: "Eliminar" al pasar el mouse sobre el botón

### 2. Función handleDeleteCustomer

**Implementación**:
```typescript
const handleDeleteCustomer = async (customerId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;
  
  const token = localStorage.getItem("token");
  
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (resp.ok) {
      setCustomers(customers.filter(c => c.id !== customerId));
      alert("Cliente eliminado exitosamente");
    } else {
      const errorData = await resp.json();
      console.error("Failed to delete customer:", errorData);
      alert(`Error al eliminar cliente: ${errorData.detail || "Error desconocido"}`);
    }
  } catch (err) {
    console.error("Error deleting customer:", err);
    alert("Error de red al eliminar cliente");
  }
};
```

**Características**:
- **Confirmación**: Muestra un diálogo de confirmación antes de eliminar
- **Petición DELETE**: Envía una petición DELETE al endpoint del cliente
- **Actualización de Estado**: Actualiza la lista de clientes eliminando el cliente eliminado
- **Manejo de Errores**: Muestra alertas de error cuando la petición falla
- **Feedback Visual**: Muestra alerta de éxito cuando se elimina correctamente

### 3. Prevención de Eventos

**Uso de `e.stopPropagation()`**:
```typescript
<div 
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteCustomer(contact.id);
  }}
  className="p-2 hover:bg-red-50 rounded-full transition-colors cursor-pointer group-hover:text-red-500"
  title="Eliminar"
>
  <Trash2 size={18} />
</div>
```

**Propósito**: Previene que el clic en el botón de eliminar también dispare el evento de clic en la tarjeta, lo que podría causar navegación no deseada.

## Archivos Modificados

- `frontend/src/app/(dashboard)/crm/page.tsx` - Agregada función handleDeleteCustomer y botón de eliminar en cada tarjeta

## Cambios en el Código

### 1. Nueva Importación

```typescript
import { Search, Plus, Phone, Mail, Filter, ArrowDownUp, X, Edit2, Trash2 } from "lucide-react";
```

Se agregó `Trash2` a las importaciones de iconos.

### 2. Nueva Función

```typescript
const handleDeleteCustomer = async (customerId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;
  
  const token = localStorage.getItem("token");
  
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (resp.ok) {
      setCustomers(customers.filter(c => c.id !== customerId));
      alert("Cliente eliminado exitosamente");
    } else {
      const errorData = await resp.json();
      console.error("Failed to delete customer:", errorData);
      alert(`Error al eliminar cliente: ${errorData.detail || "Error desconocido"}`);
    }
  } catch (err) {
    console.error("Error deleting customer:", err);
    alert("Error de red al eliminar cliente");
  }
};
```

### 3. Botón de Eliminar en Tarjeta

**Código**:
```typescript
<div 
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteCustomer(contact.id);
  }}
  className="p-2 hover:bg-red-50 rounded-full transition-colors cursor-pointer group-hover:text-red-500"
  title="Eliminar"
>
  <Trash2 size={18} />
</div>
```

**Ubicación**: Agregado junto con los botones de teléfono, correo y editar en cada tarjeta de cliente.

## Funcionalidades Mantenidas

Todas las funcionalidades existentes se mantienen sin cambios:

1. **Listado de Clientes**: Grid de tarjetas con información de clientes
2. **Filtros**: Filtros por tipo (Todos, Prospectos, Clientes)
3. **Crear Clientes**: Botón "Nuevo Prospecto" abre modal para crear
4. **Editar Clientes**: Botón de edición en cada tarjeta abre modal para editar
5. **Navegación**: Click en tarjeta para ver detalles del cliente

## Beneficios de la Implementación

1. **Eficiencia**: Los usuarios pueden eliminar clientes sin navegar a la página de detalles
2. **Experiencia de Usuario**: Acceso rápido a la acción de eliminar desde la lista
3. **Confirmación**: Previene eliminaciones accidentales con diálogo de confirmación
4. **Feedback Visual**: Alertas claras de éxito y error
5. **Prevención de Eventos**: Uso de `stopPropagation` para evitar navegación no deseada
6. **UX Mejorada**: Icono de papelera con color rojo en hover para indicar acción destructiva

## Pruebas Recomendadas

1. **Eliminar Cliente**:
   - Hacer clic en el botón de papelera en una tarjeta
   - Confirmar la acción en el diálogo
   - Verificar que el cliente se elimina de la lista
   - Verificar que se muestra la alerta de éxito

2. **Confirmación**:
   - Intentar eliminar y hacer clic en "Cancelar"
   - Verificar que el cliente NO se elimina
   - Intentar eliminar y hacer clic en "Aceptar"
   - Verificar que el cliente se elimina

3. **Manejo de Errores**:
   - Intentar eliminar sin conexión a internet
   - Verificar que se muestra el error de red
   - Intentar eliminar un cliente que no existe
   - Verificar que se muestra el error apropiado

4. **Prevención de Eventos**:
   - Hacer clic en el botón de eliminar
   - Verificar que NO navega a la página de detalles
   - Hacer clic en otra parte de la tarjeta
   - Verificar que SÍ navega a la página de detalles

5. **Filtros**:
   - Crear un cliente de tipo "prospect"
   - Crear un cliente de tipo "client"
   - Filtrar por "prospect"
   - Eliminar el cliente filtrado
   - Verificar que el cliente desaparece de la lista filtrada

## Notas Técnicas

- **Endpoint DELETE**: Se usa el método HTTP DELETE para eliminar el cliente
- **Filtro de Estado**: Se usa `filter()` para eliminar el cliente de la lista por ID
- **Confirmación del Navegador**: Se usa `confirm()` del navegador para la confirmación
- **Stop Propagation**: Se usa `e.stopPropagation()` para prevenir que el clic en el botón dispare el evento de la tarjeta
- **Estado de Carga**: No se implementa estado de carga para la eliminación (opcional en el futuro)

## Comparación con Otras Funciones

| Función | Método | Confirmación | Feedback Visual |
|---------|---------|-------------|-----------------|
| Crear Cliente | POST en modal | No | Alerta de éxito |
| Editar Cliente | PUT en modal | No | Alerta de éxito |
| **Eliminar Cliente** | **DELETE directo** | **Sí** | **Alerta de éxito** |
| Ver Detalles | Navegación | No | N/A |

## Fecha

2026-03-28
