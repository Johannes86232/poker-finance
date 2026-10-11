-- Add Telegram group fields to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "telegramGroupId"   TEXT,
  ADD COLUMN IF NOT EXISTS "telegramGroupName" TEXT;
