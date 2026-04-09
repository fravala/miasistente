{
  "name": "gestionar_agenda",
  "description": "Verifica la disponibilidad en el calendario del usuario o agenda un nuevo compromiso.",
  "parameters": {
    "type": "object",
    "properties": {
      "accion": {
        "type": "string",
        "enum": ["consultar_disponibilidad", "crear_evento"],
        "description": "Si se desea ver espacios libres o fijar una cita."
      },
      "fecha_inicio_iso": {
        "type": "string",
        "description": "Fecha y hora en formato ISO 8601 (ej. 2026-03-15T10:00:00Z)."
      },
      "duracion_minutos": {
        "type": "integer",
        "description": "Duración de la reunión en minutos."
      },
      "titulo_evento": {
        "type": "string",
        "description": "Título descriptivo de la reunión."
      }
    },
    "required": ["accion", "fecha_inicio_iso"]
  }
}