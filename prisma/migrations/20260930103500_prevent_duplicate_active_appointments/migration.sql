CREATE UNIQUE INDEX "Appointment_active_staff_start_unique"
ON "Appointment"("staffId", "startTime")
WHERE "staffId" IS NOT NULL AND "status" <> 'CANCELLED';
