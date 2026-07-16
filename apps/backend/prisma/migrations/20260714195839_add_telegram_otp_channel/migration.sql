-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'TELEGRAM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpChannel" "OtpChannel" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "pending_telegram_links" (
    "id" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "chatId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_telegram_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_telegram_links_linkCode_key" ON "pending_telegram_links"("linkCode");

-- CreateIndex
CREATE INDEX "pending_telegram_links_linkCode_idx" ON "pending_telegram_links"("linkCode");
