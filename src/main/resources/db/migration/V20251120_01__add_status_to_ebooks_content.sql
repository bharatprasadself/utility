-- Add status column to ebooks_content for draft/published support
ALTER TABLE ebooks_content ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
-- Optionally, add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_ebooks_content_status ON ebooks_content(status);