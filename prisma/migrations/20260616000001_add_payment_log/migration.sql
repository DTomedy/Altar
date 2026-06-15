-- CreateEnum
CREATE TYPE "PaymentLogOutcome" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'AMOUNT_MISMATCH', 'VERIFICATION_ERROR');

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "flwTxRef" TEXT NOT NULL,
    "flwTxId" TEXT,
    "campaignId" TEXT NOT NULL,
    "contributionId" TEXT,
    "amountExpected" DECIMAL(65,30) NOT NULL,
    "amountPaid" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "outcome" "PaymentLogOutcome" NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_flwTxRef_idx" ON "PaymentLog"("flwTxRef");

-- CreateIndex
CREATE INDEX "PaymentLog_campaignId_idx" ON "PaymentLog"("campaignId");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");
