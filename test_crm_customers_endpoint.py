#!/usr/bin/env python3
"""
Script para verificar el endpoint de clientes del backend
"""
import requests
import json

# URL del endpoint
url = "http://127.0.0.1:8000/api/crm/customers"

# Headers (necesitas un token válido)
headers = {
    "Content-Type": "application/json",
    # Nota: Necesitas obtener un token válido primero
    # "Authorization": "Bearer YOUR_TOKEN_HERE"
}

try:
    # Hacer la petición
    response = requests.get(url, headers=headers)
    
    # Verificar el código de estado
    print(f"Status Code: {response.status_code}")
    
    # Mostrar el contenido de la respuesta
    if response.status_code == 200:
        data = response.json()
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
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
