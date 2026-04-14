-- CreateEnum
CREATE TYPE "BusinessCategory" AS ENUM ('GENERAL', 'SALON', 'SPORTS', 'DENTAL', 'BEAUTY');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASE', 'PREMIUM');

-- AlterTable
ALTER TABLE "Business"
ADD COLUMN "category" "BusinessCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "description" TEXT,
ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'BASE',
ADD COLUMN "slug" TEXT,
ADD COLUMN "tagline" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
