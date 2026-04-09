import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
import requests
import json

# 1. Hacer login para obtener token
login_url = "http://127.0.0.1:8000/api/auth/login"
login_data = {
    "email": "admin@miasistente.com",
    "password": "admin123"
}

print("=== PASO 1: Login ===")
print(f"URL: {login_url}")
print(f"Email: {login_data['email']}")

try:
    response = requests.post(login_url, json=login_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"✅ Login exitoso!")
        print(f"User: {token_data.get('user', {}).get('email')}")
        print(f"Tenant ID: {token_data.get('user', {}).get('tenant_id')}")
        print(f"Token (primeros 50 chars): {access_token[:50]}...")
        
        # 2. Decodificar el token
        print("\n=== PASO 2: Decodificar Token ===")
        import jwt
        try:
            payload = jwt.decode(access_token, options={"verify_signature": False})
            print(f"Payload del token:")
            print(json.dumps(payload, indent=2, default=str))
        except Exception as e:
            print(f"Error decodificando token: {e}")
        
        # 3. Probar el endpoint CRM
        print("\n=== PASO 3: Probar Endpoint CRM ===")
        crm_url = "http://127.0.0.1:8000/api/crm/customers"
        print(f"URL: {crm_url}")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(crm_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Petición CRM exitosa!")
            print(f"Clientes obtenidos: {len(data)}")
            for i, customer in enumerate(data, 1):
                print(f"\n  Cliente {i}:")
                print(f"    ID: {customer.get('id')}")
                print(f"    Nombre: {customer.get('first_name')} {customer.get('last_name', '')}")
                print(f"    Tipo: {customer.get('customer_type')}")
                print(f"    Status: {customer.get('status')}")
                print(f"    Tenant ID: {customer.get('tenant_id')}")
        else:
            print(f"❌ Error en la petición CRM")
            print(f"Response: {response.text}")
    else:
        print(f"❌ Error en login")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
