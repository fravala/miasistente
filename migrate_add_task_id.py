#!/usr/bin/env python3
"""
Script para ejecutar la migración que agrega task_id a crm_interactions
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate():
    """Ejecutar la migración"""
    try:
        print("Ejecutando migración: Agregar task_id a crm_interactions")
        
        # Agregar columna task_id
        supabase.rpc('execute_sql', {
            'sql': """
                ALTER TABLE crm_interactions
                ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
            """
        })
        print("✓ Columna task_id agregada a crm_interactions")
        
        # Crear índice
        supabase.rpc('execute_sql', {
            'sql': """
                CREATE INDEX IF NOT EXISTS idx_crm_interactions_task_id 
                ON crm_interactions(task_id);
            """
        })
        print("✓ Índice idx_crm_interactions_task_id creado")
        
        # Agregar comentario
        supabase.rpc('execute_sql', {
            'sql': """
                COMMENT ON COLUMN crm_interactions.task_id IS 
                'Optional reference to a task. Allows linking customer interactions to specific tasks for better tracking and context.';
            """
        })
        print("✓ Comentario agregado a la columna task_id")
        
        print("\n✅ Migración completada exitosamente")
        
    except Exception as e:
        print(f"\n❌ Error ejecutando la migración: {e}")
        raise

if __name__ == "__main__":
    migrate()
