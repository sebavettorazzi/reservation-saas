-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "confirmationToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_confirmationToken_key" ON "Appointment"("confirmationToken");
