-- Give every existing resource a weekly schedule. Administrators can replace these defaults from the panel.
INSERT INTO "CourtSchedule" (
  "id",
  "staffId",
  "weekday",
  "startMinute",
  "endMinute",
  "slotInterval",
  "isOpen"
)
SELECT
  md5(staff."id" || '-' || weekday::text),
  staff."id",
  weekday,
  420,
  1320,
  30,
  true
FROM "Staff" AS staff
CROSS JOIN generate_series(0, 6) AS weekday
ON CONFLICT ("staffId", "weekday") DO NOTHING;
