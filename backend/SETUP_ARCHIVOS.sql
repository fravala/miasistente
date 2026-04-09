-- =============================================
-- SCRIPT DE CONFIGURACIÓN PARA ARCHIVOS DE CLIENTES
-- Ejecutar en: Supabase SQL Editor
-- =============================================

-- 1. Crear tabla para almacenar metadatos de archivos
CREATE TABLE IF NOT EXISTS crm_customer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    customer_id UUID,
    file_name TEXT,
    file_path TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Habilitar Row Level Security
ALTER TABLE crm_customer_files ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso (ajustar según necesidad)
-- Por ahora, permitir acceso total a usuarios autenticados
CREATE POLICY "Acceso total a archivos de clientes" ON crm_customer_files
    FOR ALL USING (true);

-- 4. Crear bucket para archivos (ejecutar en Storage UI de Supabase)
-- Ir a: Storage -> New Bucket
-- Nombre: customer-files
-- Public: Yes
-- File size limit: 10MB
-- Allowed MIME types: 
--   application/pdf
--   application/msword
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   application/vnd.ms-excel
--   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--   image/jpeg
--   image/png
--   image/gif
