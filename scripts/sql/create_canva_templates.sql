-- Create table for Canva Templates if it doesn't exist (PostgreSQL)
-- Matches com.utilityzone.model.CanvaTemplate @Table(name = 'canva_templates')

CREATE TABLE IF NOT EXISTS canva_templates (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  canva_use_copy_url VARCHAR(1000),
  mobile_canva_use_copy_url VARCHAR(1000),
  mockup_url VARCHAR(1000),
  buyer_pdf_url VARCHAR(1000),
  etsy_listing_url VARCHAR(1000),
  secondary_mockup_url VARCHAR(1000),
  rsvp_canva_use_copy_url VARCHAR(1000),
  detail_card_canva_use_copy_url VARCHAR(1000),
  instagram_post_canva_use_copy_url VARCHAR(1000),
  mobile_mockup_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: helpful indexes
-- CREATE INDEX IF NOT EXISTS idx_canva_templates_title ON canva_templates(title);
-- CREATE INDEX IF NOT EXISTS idx_canva_templates_etsy ON canva_templates(etsy_listing_url);
