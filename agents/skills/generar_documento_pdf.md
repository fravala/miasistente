{
  "name": "generar_documento_pdf",
  "description": "Genera un documento oficial (cotización, recibo) en formato PDF basándose en los datos proporcionados y lo almacena temporalmente para su descarga o envío.",
  "parameters": {
    "type": "object",
    "properties": {
      "tipo": {
        "type": "string",
        "enum": ["cotizacion", "factura_proforma"],
        "description": "El tipo de documento a generar."
      },
      "cliente_id": {
        "type": "string",
        "description": "El UUID del cliente al que va dirigido el documento."
      },
      "lineas_detalle": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "descripcion": {"type": "string"},
            "cantidad": {"type": "number"},
            "precio_unitario": {"type": "number"}
          }
        },
        "description": "Los servicios o productos a incluir en el documento."
      }
    },
    "required": ["tipo", "cliente_id", "lineas_detalle"]
  }
}