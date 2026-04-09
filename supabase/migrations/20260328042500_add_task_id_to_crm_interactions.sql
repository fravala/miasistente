-- Add task_id field to crm_interactions table
-- This allows linking interactions to tasks

ALTER TABLE crm_interactions ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_interactions_task_id ON crm_interactions(task_id);

-- Add comment to the column
COMMENT ON COLUMN crm_interactions.task_id IS 'Optional reference to a task that this interaction is related to';
