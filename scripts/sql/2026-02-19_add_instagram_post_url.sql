-- Migration: Add instagram_post_canva_use_copy_url to canva_templates
-- Applies to PostgreSQL and H2

/* PostgreSQL */
ALTER TABLE canva_templates
  ADD COLUMN IF NOT EXISTS instagram_post_canva_use_copy_url VARCHAR(1000);

/* H2 (simple add; ignore if already present in dev) */
ALTER TABLE canva_templates ADD COLUMN instagram_post_canva_use_copy_url VARCHAR(1000);
