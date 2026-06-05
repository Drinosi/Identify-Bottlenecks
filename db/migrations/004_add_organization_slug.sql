ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT;

WITH generated_slugs AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        REGEXP_REPLACE(
          REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        ),
        ''
      ),
      'organization'
    ) AS base_slug
  FROM organizations
  WHERE slug IS NULL
),
ranked_slugs AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS duplicate_number
  FROM generated_slugs
)
UPDATE organizations
SET slug =
  CASE
    WHEN ranked_slugs.duplicate_number = 1 THEN ranked_slugs.base_slug
    ELSE ranked_slugs.base_slug || '-' || SUBSTRING(organizations.id::TEXT, 1, 8)
  END
FROM ranked_slugs
WHERE organizations.id = ranked_slugs.id;

ALTER TABLE organizations
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_idx
  ON organizations (slug);
