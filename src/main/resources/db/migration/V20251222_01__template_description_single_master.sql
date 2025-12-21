-- Migration: Remove keyword columns and enforce single master template row
ALTER TABLE template_descriptions DROP COLUMN IF EXISTS event_type;
ALTER TABLE template_descriptions DROP COLUMN IF EXISTS buyer_pdf_type;
ALTER TABLE template_descriptions DROP COLUMN IF EXISTS style;
ALTER TABLE template_descriptions DROP COLUMN IF EXISTS audience;
ALTER TABLE template_descriptions DROP COLUMN IF EXISTS region;

-- Remove unique constraint if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
          AND table_name = 'template_descriptions'
    ) THEN
        ALTER TABLE template_descriptions DROP CONSTRAINT IF EXISTS template_descriptions_event_type_style_audience_key;
    END IF;
END $$;

-- Optionally, keep only one row (the master template)
DELETE FROM template_descriptions WHERE id NOT IN (
    SELECT id FROM template_descriptions ORDER BY id LIMIT 1
);
