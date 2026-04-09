-- Migration for adding tag field to tasks
-- This allows tagging tasks for better categorization and filtering

-- Add tag column to tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tag VARCHAR(100);

-- Add comment to explain purpose
COMMENT ON COLUMN tasks.tag IS 'Optional tag/label for categorizing tasks (e.g., #sales, #support, #urgent)';
