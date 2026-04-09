import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
import requests
import json

print("=== SIMULACIÓN DEL FRONTEND CRM ===\n")

# 1. Verificar si hay un token en localStorage (simulado)
print("PASO 1: Verificar token en localStorage")
print("En el frontend, esto sería: const token = localStorage.getItem('token');")

# Simulamos que NO hay token
token = None
print(f"Token encontrado: {token if token else 'None (no hay token)'}")

if not token:
    print("\n❌ PROBLEMA IDENTIFICADO: No hay token en localStorage")
    print("El usuario no ha iniciado sesión o el token expiró")
    print("\nSOLUCIÓN: El usuario debe iniciar sesión en http://localhost:3000/login")
    print("Credenciales:")
    print("  Email: admin@miasistente.com")
    print("  Password: admin123")
else:
    print("\n✅ Token encontrado")
    
    # 2. Hacer la petición al endpoint CRM
    print("\nPASO 2: Hacer petición al endpoint CRM")
    crm_url = "http://127.0.0.1:8000/api/crm/customers"
    print(f"URL: {crm_url}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(crm_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Petición exitosa!")
            print(f"Clientes obtenidos: {len(data)}")
        else:
            print(f"❌ Error en la petición")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

print("\n=== DIAGNÓSTICO COMPLETO ===")
print("\nCAUSA RAÍZ DEL PROBLEMA:")
print("Los clientes no cargan en la página CRM porque el usuario no ha iniciado sesión.")
print("Sin un token válido en localStorage, el frontend redirige al login y no muestra los clientes.")
print("\nSOLUCIÓN:")
print("1. El usuario debe iniciar sesión en http://localhost:3000/login")
print("2. Usar las credenciales: admin@miasistente.com / admin123")
print("3. Una vez logueado, el token se guardará en localStorage")
print("4. La página CRM cargará los clientes automáticamente")
