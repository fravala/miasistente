-- Agregar campo para que el cliente redacte el contexto o las reglas de su propio negocio para la IA.
ALTER TABLE tenants ADD COLUMN ai_company_rules TEXT;
