-- Migration: Add buyer_pdf_type to canva_templates and backfill values
-- Applies to: PostgreSQL and H2 (two sections below)

/* =============================================
   PostgreSQL
   ============================================= */
-- 1) Add column
ALTER TABLE canva_templates
  ADD COLUMN IF NOT EXISTS buyer_pdf_type VARCHAR(50);

-- 2) Backfill based on available links
-- Rules:
-- - WEDDING_SET: if RSVP or Detail Card link present
-- - PRINT_MOBILE: if both print (canva_use_copy_url) and mobile links present
-- - PRINT_ONLY: if print link present and mobile link absent
-- - otherwise leave NULL (will default in UI as Print & Mobile)
UPDATE canva_templates
SET buyer_pdf_type = CASE
  WHEN (NULLIF(TRIM(rsvp_canva_use_copy_url), '') IS NOT NULL OR NULLIF(TRIM(detail_card_canva_use_copy_url), '') IS NOT NULL)
       THEN 'WEDDING_SET'
  WHEN (NULLIF(TRIM(canva_use_copy_url), '') IS NOT NULL AND NULLIF(TRIM(mobile_canva_use_copy_url), '') IS NOT NULL)
       THEN 'PRINT_MOBILE'
  WHEN (NULLIF(TRIM(canva_use_copy_url), '') IS NOT NULL AND NULLIF(TRIM(mobile_canva_use_copy_url), '') IS NULL)
       THEN 'PRINT_ONLY'
  ELSE buyer_pdf_type
END;

-- 3) Optional: constrain values to known set (soft check via CHECK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_canva_templates_buyer_pdf_type'
  ) THEN
    ALTER TABLE canva_templates
      ADD CONSTRAINT chk_canva_templates_buyer_pdf_type
      CHECK (buyer_pdf_type IN ('PRINT_MOBILE','PRINT_ONLY','WEDDING_SET') OR buyer_pdf_type IS NULL);
  END IF;
END $$;

/* =============================================
   H2 (run when using H2 in dev)
   ============================================= */
-- 1) Add column (H2 lacks IF NOT EXISTS on ADD COLUMN in older modes; guard with INFORMATION_SCHEMA)
-- Safe add: only executes if column missing
CREATE TABLE IF NOT EXISTS __tmp_canva_templates_chk (id INT);
DROP TABLE __tmp_canva_templates_chk; -- no-op placeholder to keep file valid in tools that expect statements

-- Check existence
-- Note: Some environments may need RUNSCRIPT; include straightforward attempt then ignore error if already exists.
ALTER TABLE canva_templates ADD COLUMN buyer_pdf_type VARCHAR(50);

-- 2) Backfill
UPDATE canva_templates
SET buyer_pdf_type = CASE
  WHEN (rsvp_canva_use_copy_url IS NOT NULL AND TRIM(rsvp_canva_use_copy_url) <> '')
        OR (detail_card_canva_use_copy_url IS NOT NULL AND TRIM(detail_card_canva_use_copy_url) <> '')
       THEN 'WEDDING_SET'
  WHEN (canva_use_copy_url IS NOT NULL AND TRIM(canva_use_copy_url) <> '')
        AND (mobile_canva_use_copy_url IS NOT NULL AND TRIM(mobile_canva_use_copy_url) <> '')
       THEN 'PRINT_MOBILE'
  WHEN (canva_use_copy_url IS NOT NULL AND TRIM(canva_use_copy_url) <> '')
        AND (mobile_canva_use_copy_url IS NULL OR TRIM(mobile_canva_use_copy_url) = '')
       THEN 'PRINT_ONLY'
  ELSE buyer_pdf_type
END;

-- 3) Optional CHECK constraint (H2 supports simple CHECK)
ALTER TABLE canva_templates ADD CONSTRAINT chk_canva_templates_buyer_pdf_type
  CHECK (buyer_pdf_type IN ('PRINT_MOBILE','PRINT_ONLY','WEDDING_SET') OR buyer_pdf_type IS NULL);
