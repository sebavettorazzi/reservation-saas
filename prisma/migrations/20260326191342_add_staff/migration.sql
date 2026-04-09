/*
  Warnings:

  - Added the required column `staffId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "staffId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "businessId" INTEGER NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
