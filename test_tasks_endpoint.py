#!/usr/bin/env python3
"""
Script de prueba para verificar el endpoint /api/tasks
"""

import requests
import json

# URL del endpoint
url = "http://127.0.0.1:8000/api/tasks"

# Token de prueba (obtenido del login)
# Necesitas estar logueado para obtener un token válido
token = "TU_TOKEN_AQUI"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("=== PRUEBA DE ENDPOINT /api/tasks ===")
print(f"URL: {url}")
print()

# Prueba 1: GET sin filtros
print("Prueba 1: GET /api/tasks (sin filtros)")
try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Body (raw): {response.text}")
except Exception as e:
    print(f"Error: {e}")
print()

# Prueba 2: GET con filtro de status
print("Prueba 2: GET /api/tasks?status=pending")
try:
    response = requests.get(f"{url}?status=pending", headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Body (raw): {response.text}")
except Exception as e:
    print(f"Error: {e}")
print()

# Prueba 3: POST para crear tarea
print("Prueba 3: POST /api/tasks (crear tarea)")
task_data = {
    "title": "Tarea de prueba",
    "description": "Descripción de prueba",
    "priority": "medium",
    "status": "pending"
}
try:
    response = requests.post(url, json=task_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Body (raw): {response.text}")
except Exception as e:
    print(f"Error: {e}")

print()
print("=== FIN DE PRUEBAS ===")
