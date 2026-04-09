# Implementación de Modal para Agregar/Editar Clientes en CRM

## Descripción General

Se ha implementado un modal completo para agregar y editar clientes en el sistema CRM. Este modal permite a los usuarios crear nuevos prospectos o clientes, así como editar los existentes, todo desde una interfaz unificada y fácil de usar.

## Características Implementadas

### 1. Modal Unificado

El modal sirve para dos propósitos:
- **Crear Nuevo Cliente**: Abre el modal con campos vacíos para agregar un nuevo prospecto o cliente
- **Editar Cliente Existente**: Abre el modal con los datos del cliente seleccionado para modificarlo

### 2. Campos del Formulario

**Campos Personales**:
- **Nombre** (required): Campo de texto para el nombre del cliente
- **Apellido** (optional): Campo de texto para el apellido del cliente

**Campos de Contacto**:
- **Empresa/Organización** (optional): Campo de texto para el nombre de la empresa
- **Correo Electrónico** (optional): Campo de tipo email
- **Teléfono** (optional): Campo de tipo teléfono

**Campos de Clasificación**:
- **Tipo de Cliente**: Selector con opciones:
  - 🔍 Prospecto
  - 💼 Cliente
- **Estado**: Selector con opciones:
  - ✅ Activo
  - ⏳ Pendiente
  - ❌ Cerrado

### 3. Funciones Implementadas

**handleOpenAddModal**:
```typescript
const handleOpenAddModal = () => {
  setEditingCustomer(null);
  setFormData({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "prospect",
    status: "ACTIVO"
  });
  setShowCustomerModal(true);
};
```
Abre el modal para crear un nuevo cliente con campos vacíos.

**handleOpenEditModal**:
```typescript
const handleOpenEditModal = (customer: Customer) => {
  setEditingCustomer(customer);
  setFormData({
    first_name: customer.first_name,
    last_name: customer.last_name || "",
    company: customer.company || "",
    email: customer.email || "",
    phone: customer.phone || "",
    customer_type: customer.customer_type as "prospect" | "client",
    status: customer.status as "ACTIVO" | "PENDIENTE" | "CERRADO"
  });
  setShowCustomerModal(true);
};
```
Abre el modal para editar un cliente existente con sus datos actuales.

**handleCloseModal**:
```typescript
const handleCloseModal = () => {
  setShowCustomerModal(false);
  setEditingCustomer(null);
  setFormData({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "prospect",
    status: "ACTIVO"
  });
};
```
Cierra el modal y limpia todos los campos.

**handleSaveCustomer**:
```typescript
const handleSaveCustomer = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.first_name.trim()) return;

  setSavingCustomer(true);
  const token = localStorage.getItem("token");

  try {
    const url = editingCustomer 
      ? `http://127.0.0.1:8000/api/crm/customers/${editingCustomer.id}`
      : "http://127.0.0.1:8000/api/crm/customers";

    const method = editingCustomer ? "PUT" : "POST";

    const resp = await fetch(url, {
      method: method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        company: formData.company || null,
        email: formData.email || null,
        phone: formData.phone || null,
        customer_type: formData.customer_type,
        status: formData.status
      })
    });

    if (resp.ok) {
      const savedCustomer = await resp.json();
      if (editingCustomer) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? savedCustomer : c));
      } else {
        setCustomers([savedCustomer, ...customers]);
      }
      handleCloseModal();
      alert(editingCustomer ? "Cliente actualizado exitosamente" : "Cliente creado exitosamente");
    } else {
      const errorData = await resp.json();
      console.error("Failed to save customer:", errorData);
      alert(`Error al guardar cliente: ${errorData.detail || "Error desconocido"}`);
    }
  } catch (err) {
    console.error("Error saving customer:", err);
    alert("Error de red al guardar cliente");
  } finally {
    setSavingCustomer(false);
  }
};
```
Guarda el cliente (crea o actualiza) en el backend y actualiza la lista de clientes.

### 4. Estados Nuevos

```typescript
const [showCustomerModal, setShowCustomerModal] = useState(false);
const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
const [savingCustomer, setSavingCustomer] = useState(false);
const [formData, setFormData] = useState({
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  customer_type: "prospect" as "prospect" | "client",
  status: "ACTIVO" as "ACTIVO" | "PENDIENTE" | "CERRADO"
});
```

### 5. Modificaciones en el Header

**Botón "Nuevo Prospecto"**:
```typescript
<button 
  onClick={handleOpenAddModal}
  className="h-11 bg-[#00C2FF] hover:bg-[#00a6da] text-white font-bold tracking-wide px-5 rounded-xl shadow-[0_8px_16px_-6px_rgba(0,194,255,0.4)] transition-all flex items-center gap-2"
>
  <Plus size={18} strokeWidth={3} /> Nuevo Prospecto
</button>
```
Ahora el botón tiene una función `onClick` que abre el modal para crear un nuevo cliente.

### 6. Modificaciones en las Tarjetas de Clientes

**Botón de Editar**:
```typescript
<div 
  onClick={() => handleOpenEditModal(contact)}
  className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer group-hover:text-cyan-500"
  title="Editar"
>
  <Edit2 size={18} />
</div>
```
Se ha agregado un nuevo botón de editar en cada tarjeta de cliente, junto con los botones de teléfono y correo.

### 7. Estructura del Modal

**Header del Modal**:
- Icono de Plus (crear) o Edit2 (editar) con fondo gradiente cyan
- Título dinámico: "Nuevo Prospecto" o "Editar Cliente"
- Botón X para cerrar

**Cuerpo del Modal**:
- Formulario con todos los campos organizados en grid
- Validación de campos requeridos
- Placeholders descriptivos
- Iconos y emojis en los selectores para mejor UX

**Pie del Modal**:
- Botón "Cancelar" (izquierda)
- Botón "Crear" o "Actualizar" (derecha, primario)
- Estado de carga mientras se guarda

## Archivos Modificados

- `frontend/src/app/(dashboard)/crm/page.tsx` - Implementación completa del modal de clientes

## Cambios en el Código

### 1. Nuevas Importaciones

```typescript
import { Search, Plus, Phone, Mail, Filter, ArrowDownUp, X, Edit2 } from "lucide-react";
```

### 2. Nuevos Estados

```typescript
const [showCustomerModal, setShowCustomerModal] = useState(false);
const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
const [savingCustomer, setSavingCustomer] = useState(false);
const [formData, setFormData] = useState({...});
```

### 3. Nuevas Funciones

```typescript
const handleOpenAddModal = () => { ... };
const handleOpenEditModal = (customer: Customer) => { ... };
const handleCloseModal = () => { ... };
const handleSaveCustomer = async (e: React.FormEvent) => { ... };
```

### 4. Modal en el JSX

```typescript
{showCustomerModal && (
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

1. **Listado de Clientes**: Grid de tarjetas con información de clientes
2. **Filtros**: Filtros por tipo (Todos, Prospectos, Clientes)
3. **Navegación**: Click en tarjeta para ver detalles del cliente
4. **Búsqueda**: Barra de búsqueda (placeholder, funcionalidad por implementar)
5. **Iconos de Contacto**: Teléfono y correo en cada tarjeta

## Beneficios de la Implementación

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden crear y editar clientes sin navegar a otra página
2. **Eficiencia**: Modal unificado para crear y editar reduce la complejidad de la interfaz
3. **Validación**: Campos requeridos con validación en el frontend
4. **Feedback Visual**: Estado de carga, alertas de éxito y error
5. **UX Mejorada**: Placeholders descriptivos, iconos y emojis para mejor comprensión
6. **Responsive Design**: Modal se ajusta a diferentes tamaños de pantalla
7. **Animaciones**: Animaciones suaves de entrada y salida para mejor experiencia

## Pruebas Recomendadas

1. **Crear Nuevo Cliente**:
   - Hacer clic en "Nuevo Prospecto"
   - Verificar que el modal se abre con campos vacíos
   - Llenar todos los campos
   - Hacer clic en "Crear"
   - Verificar que el cliente se agrega a la lista

2. **Editar Cliente Existente**:
   - Hacer clic en el icono de editar en una tarjeta
   - Verificar que el modal se abre con los datos del cliente
   - Modificar algunos campos
   - Hacer clic en "Actualizar"
   - Verificar que el cliente se actualiza en la lista

3. **Validación**:
   - Intentar guardar sin nombre
   - Verificar que el botón "Crear" está deshabilitado

4. **Cerrar Modal**:
   - Hacer clic en el botón X
   - Hacer clic en "Cancelar"
   - Verificar que el modal se cierra sin guardar cambios

5. **Responsive Design**:
   - Probar el modal en diferentes tamaños de pantalla
   - Verificar que el modal se ajusta correctamente

6. **Filtros**:
   - Crear un cliente de tipo "prospect"
   - Crear un cliente de tipo "client"
   - Verificar que los filtros funcionan correctamente

## Notas Técnicas

- **Backdrop Blur**: El modal usa `backdrop-blur-sm` para desenfocar el contenido detrás
- **Animaciones**: El modal usa animaciones de entrada (`fade-in`, `zoom-in-95`) para una experiencia fluida
- **Scroll**: El modal tiene `max-h-[90vh] overflow-y-auto` para permitir scroll cuando el contenido es largo
- **Estado de Carga**: El botón de guardar muestra "Guardando..." mientras se actualiza
- **Tipo de Cliente**: Se usa `customer_type` para diferenciar entre prospectos y clientes
- **Estado**: Se usa `status` para indicar el estado del cliente (ACTIVO, PENDIENTE, CERRADO)

## Fecha

2026-03-27
