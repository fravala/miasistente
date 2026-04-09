#!/usr/bin/env python3
"""
Script para aplicar la migración del campo tag a la tabla tasks.
"""

from supabase import create_client
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear cliente de Supabase
client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# Aplicar la migración SQL
migration_sql = """
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tag VARCHAR(100);

COMMENT ON COLUMN tasks.tag IS 'Optional tag/label for categorizing tasks (e.g., #sales, #support, #urgent)';
"""

# Ejecutar la migración usando la API de Supabase
try:
    # Primero verificar si el campo ya existe
    result = client.table('tasks').select('*').limit(1).execute()
    print("Conexión a Supabase exitosa")
    print("Migración SQL debe aplicarse manualmente en el panel de Supabase")
    print("\nSQL a ejecutar:")
    print(migration_sql)
    
    # Intentar crear una tarea con tag para verificar
    test_data = {
        'title': 'Test Tag Migration',
        'description': 'Testing tag field',
        'status': 'pending',
        'priority': 'medium',
        'tag': 'test'
    }
    
    # Solo si el usuario confirma
    print("\nPara aplicar la migración, ejecuta el siguiente SQL en el panel de Supabase:")
    print(migration_sql)
    
except Exception as e:
    print(f"Error: {str(e)}")
