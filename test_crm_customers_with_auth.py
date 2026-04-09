#!/usr/bin/env python3
"""
Script para verificar el endpoint de clientes del backend con autenticación
"""
import requests
import json

# URL del endpoint de login
login_url = "http://127.0.0.1:8000/api/auth/login"
login_data = {
    "email": "admin@miasistente.com",
    "password": "admin123"
}

try:
    # Hacer login para obtener el token
    print("=== HACIENDO LOGIN ===")
    login_response = requests.post(login_url, json=login_data)
    print(f"Status Code: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_data_response = login_response.json()
        access_token = login_data_response.get('access_token')
        print(f"✅ Login exitoso")
        print(f"   Token: {access_token[:50]}...")
        
        # URL del endpoint de clientes
        customers_url = "http://127.0.0.1:8000/api/crm/customers"
        
        # Headers con el token
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Hacer la petición para obtener los clientes
        print("\n=== OBTENIENDO CLIENTES ===")
        customers_response = requests.get(customers_url, headers=headers)
        print(f"Status Code: {customers_response.status_code}")
        
        # Mostrar el contenido de la respuesta
        if customers_response.status_code == 200:
            data = customers_response.json()
            print(f"Total de clientes: {len(data)}")
            print("\n=== CLIENTES ===")
            for customer in data:
                name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
                company = customer.get('company', 'Sin empresa')
                interactions_count = customer.get('interactions_count', 0)
                print(f"Cliente: {name} ({company})")
                print(f"  ID: {customer.get('id')}")
                print(f"  Interacciones: {interactions_count} {'nota' if interactions_count == 1 else 'notas'}")
                print()
        else:
            print(f"Error: {customers_response.text}")
    else:
        print(f"Error en login: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
