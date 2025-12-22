-- Migration: Create template_descriptions table with required columns and constraints
CREATE TABLE IF NOT EXISTS template_descriptions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NULL,
    title VARCHAR(255) DEFAULT 'Editable {{style}} {{eventType}} Invitation | Canva Template | {{buyerPdfType}} | Instant Download',
    description TEXT NULL,
    -- Add other columns as needed, e.g. created_at TIMESTAMP, updated_at TIMESTAMP, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Add any additional columns and constraints here
);
