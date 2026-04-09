-- Convert any remaining wishlist items into applied before removing the enum value.
UPDATE "Application"
SET "status" = 'applied'
WHERE "status"::text = 'wishlist';

UPDATE "ImportedEmail"
SET "status" = 'applied'
WHERE "status"::text = 'wishlist';

ALTER TABLE "Application"
ALTER COLUMN "status" DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'Status_old'
  ) THEN
    ALTER TYPE "Status" RENAME TO "Status_old";

    CREATE TYPE "Status" AS ENUM (
      'applied',
      'interview',
      'offer',
      'rejected',
      'withdrawn'
    );
  END IF;
END $$;

ALTER TABLE "Application"
ALTER COLUMN "status" TYPE "Status"
USING ("status"::text::"Status");

ALTER TABLE "Application"
ALTER COLUMN "status" SET DEFAULT 'applied';

ALTER TABLE "ImportedEmail"
ALTER COLUMN "status" TYPE "Status"
USING ("status"::text::"Status");

DROP TYPE IF EXISTS "Status_old";
