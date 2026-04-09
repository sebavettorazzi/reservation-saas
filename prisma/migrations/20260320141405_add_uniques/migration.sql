/*
  Warnings:

  - A unique constraint covering the columns `[name,ownerId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,businessId]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Business_name_ownerId_key" ON "Business"("name", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_businessId_key" ON "Service"("name", "businessId");
