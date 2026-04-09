-- Migrations for CRM Interactions (Historial de clientes)
CREATE TABLE crm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('meeting', 'call', 'email', 'note', 'sale')),
    description TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crm_interactions_tenant_id ON crm_interactions(tenant_id);
CREATE INDEX idx_crm_interactions_customer_id ON crm_interactions(customer_id);
