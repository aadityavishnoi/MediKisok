-- AlterTable
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "OtpVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OtpVerification_phone_idx" ON "OtpVerification"("phone");
