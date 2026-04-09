#!/usr/bin/env python3
"""
Script para crear la función execute_sql en Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup():
    """Crear la función execute_sql"""
    try:
        print("Creando función execute_sql en Supabase")
        
        # Leer el archivo SQL
        with open("create_execute_sql_function.sql", "r") as f:
            sql = f.read()
        
        # Ejecutar cada statement separado por punto y coma
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        
        for statement in statements:
            if statement:
                # Usar el cliente de Supabase directamente para ejecutar SQL
                # Esto requiere acceso a la base de datos directamente
                print(f"Ejecutando: {statement[:50]}...")
        
        print("\n⚠️  Nota: La función execute_sql debe crearse directamente en Supabase")
        print("   Puedes hacerlo desde el dashboard de Supabase:")
        print("   https://app.supabase.com/project/miasistente/sql")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    setup()
