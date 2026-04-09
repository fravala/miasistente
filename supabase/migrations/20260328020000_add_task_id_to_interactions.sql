-- Migration for adding task_id to crm_interactions
-- This allows linking interactions (notes, meetings, calls, emails) to tasks

-- Add task_id column to crm_interactions
ALTER TABLE crm_interactions
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for task_id
CREATE INDEX idx_crm_interactions_task_id ON crm_interactions(task_id);

-- Add comment to explain the purpose
COMMENT ON COLUMN crm_interactions.task_id IS 'Optional reference to a task. Allows linking customer interactions to specific tasks for better tracking and context.';
