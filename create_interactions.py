import os
import sys
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

query = """
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('meeting', 'call', 'email', 'note', 'sale')),
    description TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_tenant_id ON crm_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_customer_id ON crm_interactions(customer_id);
"""

# Suapabase client rest api does not execute raw DDL query directly usually. Let's just create an sql file and see if there is any other way.
