-- Auth Hub owns login state. Business projects must not store OAuth account
-- tokens or NextAuth sessions.
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
