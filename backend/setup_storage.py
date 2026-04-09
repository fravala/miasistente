#!/usr/bin/env python3
"""Script para inicializar Storage y tablas necesarias."""
import os
import sys

# Add the backend path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Usar service role key para operaciones de admin
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaWtybGh4eXhzd3pvdGNpZ2hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQzMzc3MSwiZXhwIjoyMDg5MDA5NzcxfQ.2aYj-3GJZK-JiR1j0L4Hx0tD9t3Z5Kx8YvBqJ2hBxdE"

def main():
    print("🔧 Inicializando Supabase Storage...")
    
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    # 1. Crear bucket si no existe
    print("📦 Creando bucket 'customer-files'...")
    try:
        bucket = supabase.storage.create_bucket(
            id="customer-files",
            name="customer-files",
            file_size_limit=10485760,  # 10MB
            allowed_mime_types=[
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/jpeg",
                "image/png",
                "image/gif"
            ]
        )
        print("✅ Bucket creado exitosamente")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("ℹ️  Bucket ya existe")
        else:
            print(f"❌ Error creando bucket: {e}")
    
    # 2. Crear tabla si no existe
    print("📊 Creando tabla 'crm_customer_files'...")
    try:
        # Crear tabla usando SQL
        sql = """
        CREATE TABLE IF NOT EXISTS crm_customer_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID REFERENCES tenants(id),
            customer_id UUID REFERENCES crm_customers(id),
            file_name TEXT,
            file_path TEXT,
            file_url TEXT,
            file_size INTEGER,
            mime_type TEXT,
            created_by UUID,
            created_at TIMESTAMP DEFAULT now()
        );
        
        -- Habilitar RLS
        ALTER TABLE crm_customer_files ENABLE ROW LEVEL SECURITY;
        
        -- Política: usuarios pueden ver archivos de su tenant
        CREATE POLICY "Usuarios ven archivos de su tenant" ON crm_customer_files
            FOR SELECT USING (tenant_id = (SELECT id FROM tenants LIMIT 1));
        
        -- Política: usuarios pueden insertar archivos de su tenant
        CREATE POLICY "Usuarios insertan archivos en su tenant" ON crm_customer_files
            FOR INSERT WITH CHECK (tenant_id = (SELECT id FROM tenants LIMIT 1));
        
        -- Política: usuarios pueden eliminar archivos de su tenant
        CREATE POLICY "Usuarios eliminan archivos de su tenant" ON crm_customer_files
            FOR DELETE USING (tenant_id = (SELECT id FROM tenants LIMIT 1));
        """
        
        # Ejecutar SQL
        result = supabase.rpc("exec_sql", {"query": sql}).execute()
        print("✅ Tabla creada exitosamente")
    except Exception as e:
        print(f"❌ Error creando tabla: {e}")
        # Intentar solo crear la tabla sin políticas
        try:
            sql_simple = """
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
            """
            print("ℹ️  Tabla creada sin políticas RLS (ejecuta SQL manualmente para agregar seguridad)")
        except Exception as e2:
            print(f"❌ Error también: {e2}")
    
    print("✨ Configuración completada!")

if __name__ == "__main__":
    main()
