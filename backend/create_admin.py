import asyncio
from passlib.context import CryptContext
from app.db import supabase

# Gestor de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_initial_setup():
    print("Iniciando configuración inicial...")
    
    # 1. Crear el primer Tenant (Tu Empresa)
    tenant_response = supabase.table("tenants").insert({
        "company_name": "Mi Empresa Principal"
    }).execute()
    
    if not tenant_response.data:
        print("Error creando el Tenant.")
        return
        
    tenant_id = tenant_response.data[0]["id"]
    print(f"✅ Tenant creado con ID: {tenant_id}")
    
    # 2. Agregar módulos activos para este tenant
    supabase.table("tenant_modules").insert([
        {"tenant_id": tenant_id, "module_name": "core"},
        {"tenant_id": tenant_id, "module_name": "crm"}
    ]).execute()
    print("✅ Módulos 'core' y 'crm' activados para tu empresa.")

    # 3. Crear el Usuario Administrador Global
    password_plana = "admin123"
    password_hash = pwd_context.hash(password_plana)
    
    user_response = supabase.table("users").insert({
        "tenant_id": tenant_id,
        "email": "admin@miasistente.com",
        "password_hash": password_hash,
        "first_name": "Francisco",
        "last_name": "Admin",
        "role": "super_admin"
    }).execute()
    
    if user_response.data:
        print(f"\n🎉 ¡Todo listo! Se ha creado tu usuario administrador.")
        print("-" * 30)
        print(f"📧 Email: admin@miasistente.com")
        print(f"🔑 Password: {password_plana}")
        print("-" * 30)
        print("Ahora puedes iniciar sesión desde el frontend.")
    else:
        print("Error creando el usuario administrador.")

if __name__ == "__main__":
    create_initial_setup()
