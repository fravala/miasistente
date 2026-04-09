{
  "name": "gestionar_entidad_erp",
  "description": "Permite al asistente realizar operaciones transaccionales para la gestión operativa en las tablas del ERP (ej. clientes, servicios). Toda operación está aislada por el tenant_id del entorno. Utilizar para agilizar flujos de trabajo y mejorar la eficiencia de la empresa.",
  "parameters": {
    "type": "object",
    "properties": {
      "tabla": {
        "type": "string",
        "enum": ["clientes", "prospectos", "servicios"],
        "description": "La tabla sobre la cual operar."
      },
      "accion": {
        "type": "string",
        "enum": ["seleccionar", "insertar", "actualizar"],
        "description": "El tipo de operación a realizar en la base de datos."
      },
      "parametros": {
        "type": "object",
        "description": "Diccionario clave-valor con los datos a insertar o los filtros de búsqueda (ej. {'email': 'contacto@empresa.com'})."
      }
    },
    "required": ["tabla", "accion", "parametros"]
  }
}