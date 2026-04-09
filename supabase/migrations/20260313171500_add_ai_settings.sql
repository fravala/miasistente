-- Agregar configuraciones de IA a la tabla `tenants`
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic', 'gemini', 'grok')),
ADD COLUMN IF NOT EXISTS ai_api_key TEXT;

-- Opcional: Para ofuscar de miradas rápidas (aunque sigue siendo texto plano en la BD temporalmente)
-- En un entorno de producción, esto debería encriptarse mediante pgcrypto o a nivel de aplicación (FastAPI).
