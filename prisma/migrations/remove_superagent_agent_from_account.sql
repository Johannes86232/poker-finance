-- Remove superagent and agent columns from Account table
ALTER TABLE "Account"
  DROP COLUMN IF EXISTS "superagent",
  DROP COLUMN IF EXISTS "agent";
