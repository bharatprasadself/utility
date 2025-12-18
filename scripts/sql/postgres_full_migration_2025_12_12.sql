-- Postgres migration: ebooks_content status, ebooks_covers content_hash, and indexes/constraints
-- Safe to run multiple times where IF NOT EXISTS is supported

BEGIN;

-- 0) Create per-ebook table to store full authoring content
CREATE TABLE IF NOT EXISTS ebooks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(512) NOT NULL DEFAULT '',
    cover_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    book_json TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ebooks_status CHECK (status IN ('draft','published'))
);

CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_ebooks_updated_at ON ebooks(updated_at);

-- 1) Add draft/published status to ebooks_content
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ebooks_content' AND column_name = 'status'
    ) THEN
        EXECUTE 'ALTER TABLE ebooks_content ADD COLUMN status VARCHAR(20) DEFAULT ''draft''';
    END IF;
END$$;

-- Create index on status for faster catalog queries
CREATE INDEX IF NOT EXISTS idx_ebooks_content_status ON ebooks_content(status);

-- Add CHECK constraint to enforce allowed status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'ebooks_content' AND constraint_name = 'chk_ebooks_content_status'
    ) THEN
        EXECUTE 'ALTER TABLE ebooks_content ADD CONSTRAINT chk_ebooks_content_status CHECK (status IN (''draft'',''published''))';
    END IF;
END$$;

-- 2) Add content_hash to ebooks_covers for deduplication (SHA-256 hex)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ebooks_covers' AND column_name = 'content_hash'
    ) THEN
        EXECUTE 'ALTER TABLE ebooks_covers ADD COLUMN content_hash VARCHAR(64)';
    END IF;
END$$;

-- Unique index on content_hash to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_ebooks_covers_content_hash ON ebooks_covers(content_hash);

COMMIT;

-- Optional: Backfill content_hash using application code (not SQL) by computing SHA-256 of data
-- After deploying application support, you can run a one-time job to populate content_hash.
