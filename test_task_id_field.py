#!/usr/bin/env python3
"""
Script para verificar si el campo task_id existe en la tabla crm_interactions
"""
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from supabase import create_client, Client

# Leer variables de entorno directamente del archivo .env
env_file = os.path.join(os.path.dirname(__file__), 'backend', '.env')
supabase_url = None
supabase_key = None

with open(env_file, 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip().strip('"\'')
        elif line.startswith('SUPABASE_KEY='):
            supabase_key = line.split('=', 1)[1].strip().strip('"\'')

# Crear cliente de Supabase
supabase: Client = create_client(supabase_url, supabase_key)

def check_task_id_field():
    """Verificar si el campo task_id existe en la tabla crm_interactions"""
    try:
        # Intentar insertar una interacción con task_id
        # Esto fallará si el campo no existe
        test_data = {
            'customer_id': '00000000-0000-0000-0000-000000000000',
            'tenant_id': '00000000-0000-0000-0000-000000000000',
            'interaction_type': 'note',
            'description': 'Test interaction',
            'task_id': None
        }
        
        # Intentar hacer una consulta para verificar la estructura de la tabla
        # Usamos una consulta que no modifique datos
        result = supabase.table('crm_interactions').select('*').limit(1).execute()
        
        if result.data:
            # Verificar si task_id está en los resultados
            first_row = result.data[0]
            if 'task_id' in first_row:
                print("✅ El campo task_id existe en la tabla crm_interactions")
                print(f"   Valor de task_id: {first_row.get('task_id')}")
                return True
            else:
                print("❌ El campo task_id NO existe en la tabla crm_interactions")
                print("   Campos disponibles:", list(first_row.keys()))
                return False
        else:
            print("⚠️  No hay datos en la tabla crm_interactions")
            print("   No se puede verificar la estructura de la tabla")
            return None
            
    except Exception as e:
        print(f"❌ Error al verificar el campo task_id: {e}")
        return False

if __name__ == '__main__':
    print("Verificando si el campo task_id existe en la tabla crm_interactions...")
    print("=" * 70)
    check_task_id_field()
