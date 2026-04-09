import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
from supabase import create_client, Client
import requests
import json

# Configuración de Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Obtener un usuario para probar
users = supabase.table("users").select("*").limit(1).execute()
print("Usuarios encontrados:", len(users.data))
if users.data:
    user = users.data[0]
    print(f"Usuario: {user['email']}")
    print(f"Tenant ID: {user['tenant_id']}")
    print(f"User ID: {user['id']}")
    
    # Intentar hacer login para obtener token usando el endpoint del backend
    login_url = "http://127.0.0.1:8000/api/auth/login"
    login_data = {
        "email": user['email'],
        "password": "admin123"  # Contraseña por defecto del admin
    }
    
    print(f"\nIntentando login con: {user['email']}")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"Login exitoso! Token obtenido: {access_token[:50]}...")
        
        # Decodificar el token para ver el payload
        import jwt
        try:
            payload = jwt.decode(access_token, options={"verify_signature": False})
            print(f"\nPayload del token:")
            print(json.dumps(payload, indent=2, default=str))
        except Exception as e:
            print(f"Error decodificando token: {e}")
        
        # Probar el endpoint de CRM
        crm_url = "http://127.0.0.1:8000/api/crm/customers"
        print(f"\nProbando endpoint CRM: {crm_url}")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(crm_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nClientes obtenidos: {len(data)}")
            for customer in data:
                print(f"  - {customer['first_name']} {customer.get('last_name', '')}")
        else:
            print(f"Error en la petición CRM: {response.status_code}")
    else:
        print(f"Error en login: {response.status_code}")
        print(f"Response: {response.text}")
else:
    print("No hay usuarios en la base de datos")
