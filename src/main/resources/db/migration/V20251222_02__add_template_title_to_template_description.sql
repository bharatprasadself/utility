-- Add template_title column to template_descriptions
ALTER TABLE template_descriptions ADD COLUMN template_title VARCHAR(255) DEFAULT 'Editable {{style}} {{eventType}} Invitation | Canva Template | {{buyerPdfType}} | Instant Download';
