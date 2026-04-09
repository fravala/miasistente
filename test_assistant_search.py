#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad de búsqueda del asistente
"""

import requests
import json

# Configuración
API_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{API_URL}/api/auth/login"
ASSISTANT_URL = f"{API_URL}/api/assistant/chat"

def test_assistant_search():
    """Prueba la búsqueda de clientes a través del asistente"""
    
    print("=== PRUEBA DE BÚSQUEDA DEL ASISTENTE ===")
    print()
    
    # 1. Iniciar sesión
    print("1. Iniciando sesión...")
    print("-" * 60)
    login_data = {
        "email": "admin@miasistente.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(LOGIN_URL, json=login_data)
        login_response.raise_for_status()
        login_result = login_response.json()
        
        token = login_result.get("access_token")
        print(f"  ✓ Sesión iniciada correctamente")
        print(f"  Token: {token[:50]}...")
        print()
    except Exception as e:
        print(f"  ✗ Error al iniciar sesión: {e}")
        return
    
    # 2. Enviar mensaje al asistente buscando "Eduardo Campoa"
    print("2. Buscando 'Eduardo Campoa' a través del asistente...")
    print("-" * 60)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    message = "Busca al prospecto Eduardo Campoa"
    
    try:
        assistant_response = requests.post(
            ASSISTANT_URL,
            json={"message": message},
            headers=headers
        )
        assistant_response.raise_for_status()
        result = assistant_response.json()
        
        print(f"  Mensaje enviado: {message}")
        print(f"  Respuesta del asistente:")
        print(f"  {json.dumps(result, indent=2)}")
        print()
        
        # Verificar si encontró al cliente
        if "response" in result:
            response_text = result["response"].lower()
            if "eduardo" in response_text or "campa" in response_text:
                print("  ✓ El asistente encontró información sobre Eduardo Campoa")
            else:
                print("  ✗ El asistente no encontró información sobre Eduardo Campoa")
        
    except Exception as e:
        print(f"  ✗ Error al comunicarse con el asistente: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
    
    print()
    print("=== FIN DE LA PRUEBA ===")

if __name__ == "__main__":
    test_assistant_search()
