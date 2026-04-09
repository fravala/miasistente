{
  "name": "consultar_cerebro_obsidian",
  "description": "Realiza una búsqueda semántica en los vectores de las notas de Obsidian del usuario activo. Útil para recuperar contexto de reuniones, reglas de negocio o estrategias previas antes de redactar documentos o responder consultas complejas.",
  "parameters": {
    "type": "object",
    "properties": {
      "consulta": {
        "type": "string",
        "description": "El concepto, pregunta o nombre del proyecto que se necesita buscar en las notas."
      },
      "limite_resultados": {
        "type": "integer",
        "description": "Número máximo de fragmentos de notas a recuperar (recomendado: 3)."
      }
    },
    "required": ["consulta"]
  }
}