-- Add Thank You Card Canva link column to canva_templates
ALTER TABLE canva_templates ADD COLUMN IF NOT EXISTS thank_you_card_canva_use_copy_url VARCHAR(1000);
