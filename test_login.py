import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
from supabase import create_client, Client
from passlib.context import CryptContext
import requests
import json

# Configuración de Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Gestor de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Obtener el usuario admin
users = supabase.table("users").select("*").eq("email", "admin@miasistente.com").execute()
if not users.data:
    print("❌ No se encontró el usuario admin@miasistente.com")
    sys.exit(1)

user = users.data[0]
print(f"✅ Usuario encontrado: {user['email']}")
print(f"   Password Hash: {user['password_hash'][:50]}...")

# Probar diferentes contraseñas
passwords_to_test = ["admin123", "admin", "password", "Admin123"]

for password in passwords_to_test:
    print(f"\n🔍 Probando contraseña: '{password}'")
    try:
        is_valid = pwd_context.verify(password, user['password_hash'])
        if is_valid:
            print(f"   ✅ ¡CONTRASEÑA CORRECTA! '{password}'")
            
            # Ahora probar el login con el backend
            login_url = "http://127.0.0.1:8000/api/auth/login"
            login_data = {
                "email": user['email'],
                "password": password
            }
            
            print(f"\n🌐 Probando login con el backend...")
            response = requests.post(login_url, json=login_data)
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
            if response.status_code == 200:
                print(f"   ✅ LOGIN EXITOSO!")
                token_data = response.json()
                print(f"   Token: {token_data.get('access_token', '')[:50]}...")
            else:
                print(f"   ❌ LOGIN FALLIDO")
                
            break
        else:
            print(f"   ❌ Incorrecta")
    except Exception as e:
        print(f"   ❌ Error: {e}")
else:
    print("\n❌ Ninguna de las contraseñas probadas funcionó")
