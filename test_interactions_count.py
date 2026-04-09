#!/usr/bin/env python3
"""
Script para verificar el conteo de interacciones por cliente
"""
import sys
import os
from dotenv import load_dotenv
from supabase import create_client
import uuid

# Cargar variables de entorno
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

# Conectar a Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

print(f"DEBUG: SUPABASE_URL = {supabase_url}")
print(f"DEBUG: SUPABASE_KEY = {supabase_key[:20]}...")

if not supabase_url:
    print("ERROR: SUPABASE_URL no está configurado")
    sys.exit(1)

if not supabase_key:
    print("ERROR: SUPABASE_KEY no está configurado")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

# Obtener todos los clientes
print("=== OBTENIENDO CLIENTES ===")
customers_response = supabase.table('crm_customers').select('*').execute()
customers = customers_response.data

print(f"Total de clientes: {len(customers)}")

# Obtener todas las interacciones
print("\n=== OBTENIENDO INTERACCIONES ===")
interactions_response = supabase.table('crm_interactions').select('*').execute()
interactions = interactions_response.data

print(f"Total de interacciones: {len(interactions)}")

# Contar interacciones por cliente
print("\n=== CONTEO DE INTERACCIONES POR CLIENTE ===")
interactions_count = {}
for interaction in interactions:
    customer_id = str(interaction['customer_id'])
    interactions_count[customer_id] = interactions_count.get(customer_id, 0) + 1

# Mostrar conteo por cliente
for customer in customers:
    customer_id = str(customer['id'])
    count = interactions_count.get(customer_id, 0)
    name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
    print(f"Cliente: {name} ({customer['company'] or 'Sin empresa'})")
    print(f"  ID: {customer_id}")
    print(f"  Interacciones: {count} {'nota' if count == 1 else 'notas'}")
    print()
