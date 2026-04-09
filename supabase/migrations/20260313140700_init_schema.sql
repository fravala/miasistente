-- Extensión recomendada para generar UUIDs seguros
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. NÚCLEO (CORE): Multitenancy, Autenticación Custom y Módulos
-- ==============================================================================

-- Tabla de Inquilinos (Tenants): Cada cliente/empresa registrada en el SaaS
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Módulos Activos por Tenant
-- Controla (plug-and-play) qué módulos puede usar un Tenant (y por ende su Asistente IA)
CREATE TABLE tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL, -- ej: 'crm', 'inventory', 'knowledge_base', 'calendar'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, module_name) -- Evitar módulos duplicados por tenant
);

-- Enum para definir el control de acceso (RBAC)
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'regular_user');

-- Tabla de Usuarios con Custom Auth (FastAPI + JWT)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL solo para 'super_admin' globales
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,          -- Hasheado por FastAPI (Bcrypt, Argon2, etc)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'regular_user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. MÓDULO: CRM (Customer Relationship Management)
-- ==============================================================================

-- Tabla CRM: Prospectos y Clientes
CREATE TABLE crm_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('prospect', 'client')),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Quién lo creó
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla CRM: Cotizaciones (Quotes)
CREATE TABLE crm_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
    quote_number VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    valid_until TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, quote_number) -- Cada empresa maneja su propia secuencia de cotizaciones
);

-- ==============================================================================
-- 3. ÍNDICES DE OPTIMIZACIÓN MULTITENANT
-- Dado que TODO se filtra por tenant_id vía el Backend (FastAPI), añadir índices 
-- sobre tenant_id es crítiico para el rendimiento de búsquedas.
-- ==============================================================================
CREATE INDEX idx_tenant_modules_tenant_id ON tenant_modules(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_crm_customers_tenant_id ON crm_customers(tenant_id);
CREATE INDEX idx_crm_quotes_tenant_id ON crm_quotes(tenant_id);
