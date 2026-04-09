#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad de búsqueda de CRM
"""

import os
import sys
from supabase import create_client, Client

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nsikrlhxyxswzotcighh.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaWtybGh4eXhzd3pvdGNpZ2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzM3NzEsImV4cCI6MjA4OTAwOTc3MX0.7viGNCMFoWsIkEzVMbOGMozxA4Xew6Lu8LVzY2hWx_k")

def test_search():
    """Prueba la búsqueda de clientes en la base de datos"""
    
    print("=== PRUEBA DE BÚSQUEDA CRM ===")
    print(f"URL: {SUPABASE_URL}")
    print()
    
    # Crear cliente de Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Buscar todos los clientes para ver qué tenemos
    print("1. Listando todos los clientes en la base de datos:")
    print("-" * 60)
    response = supabase.table("crm_customers").select("*").execute()
    
    if response.data:
        print(f"Total de clientes: {len(response.data)}")
        for customer in response.data:
            print(f"  - ID: {customer['id']}")
            print(f"    Nombre: {customer.get('first_name', '')} {customer.get('last_name', '')}")
            print(f"    Email: {customer.get('email', 'N/A')}")
            print(f"    Empresa: {customer.get('company', 'N/A')}")
            print(f"    Tipo: {customer.get('customer_type', 'N/A')}")
            print(f"    Tenant: {customer.get('tenant_id', 'N/A')}")
            print()
    else:
        print("  No se encontraron clientes en la base de datos")
        print()
    
    # 2. Buscar específicamente "Eduardo" en first_name
    print("2. Buscando 'Eduardo' en first_name:")
    print("-" * 60)
    response = supabase.table("crm_customers").select("*").ilike("first_name", "%Eduardo%").execute()
    
    if response.data:
        print(f"  Encontrados: {len(response.data)}")
        for customer in response.data:
            print(f"  - {customer.get('first_name', '')} {customer.get('last_name', '')}")
    else:
        print("  No se encontraron clientes con 'Eduardo' en first_name")
    print()
    
    # 3. Buscar específicamente "Campa" en last_name
    print("3. Buscando 'Campa' en last_name:")
    print("-" * 60)
    response = supabase.table("crm_customers").select("*").ilike("last_name", "%Campa%").execute()
    
    if response.data:
        print(f"  Encontrados: {len(response.data)}")
        for customer in response.data:
            print(f"  - {customer.get('first_name', '')} {customer.get('last_name', '')}")
    else:
        print("  No se encontraron clientes con 'Campa' en last_name")
    print()
    
    # 4. Búsqueda combinada simulando la lógica mejorada
    print("4. Búsqueda mejorada (simulando 'Eduardo Campoa'):")
    print("-" * 60)
    query_text = "Eduardo Campoa"
    search_terms = query_text.split()
    
    all_results = []
    seen_ids = set()
    
    for term in search_terms:
        if not term:
            continue
            
        # Buscar en first_name
        response = supabase.table("crm_customers").select("*").ilike("first_name", f"%{term}%").execute()
        for result in response.data:
            if result["id"] not in seen_ids:
                all_results.append(result)
                seen_ids.add(result["id"])
        
        # Buscar en last_name
        response = supabase.table("crm_customers").select("*").ilike("last_name", f"%{term}%").execute()
        for result in response.data:
            if result["id"] not in seen_ids:
                all_results.append(result)
                seen_ids.add(result["id"])
        
        # Buscar en email
        response = supabase.table("crm_customers").select("*").ilike("email", f"%{term}%").execute()
        for result in response.data:
            if result["id"] not in seen_ids:
                all_results.append(result)
                seen_ids.add(result["id"])
    
    if all_results:
        print(f"  Encontrados: {len(all_results)}")
        for customer in all_results:
            print(f"  - ID: {customer['id']}")
            print(f"    Nombre: {customer.get('first_name', '')} {customer.get('last_name', '')}")
            print(f"    Email: {customer.get('email', 'N/A')}")
            print(f"    Empresa: {customer.get('company', 'N/A')}")
            print(f"    Tipo: {customer.get('customer_type', 'N/A')}")
    else:
        print("  No se encontraron clientes con la búsqueda mejorada")
    print()
    
    print("=== FIN DE LA PRUEBA ===")

if __name__ == "__main__":
    test_search()
