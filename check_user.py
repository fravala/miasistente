import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
from supabase import create_client, Client
import json

# Configuración de Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Obtener usuarios
users = supabase.table("users").select("*").execute()
print(f"Usuarios encontrados: {len(users.data)}")
for user in users.data:
    print(f"\nID: {user['id']}")
    print(f"Email: {user['email']}")
    print(f"Nombre: {user['first_name']} {user.get('last_name', '')}")
    print(f"Role: {user['role']}")
    print(f"Tenant ID: {user['tenant_id']}")
    print(f"Is Active: {user.get('is_active', True)}")
    print(f"Password Hash: {user['password_hash'][:50]}...")
