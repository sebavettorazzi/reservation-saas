import { z } from "zod";

export const UpdateCourtSchedulesSchema = z.object({
  schedules: z.array(
    z.object({
      staffId: z.string().uuid(),
      weekday: z.number().int().min(0).max(6),
      startMinute: z.number().int().min(0).max(1439),
      endMinute: z.number().int().min(1).max(1440),
      slotInterval: z.number().int().min(15).max(120),
      isOpen: z.boolean(),
    }).refine((schedule) => !schedule.isOpen || schedule.startMinute < schedule.endMinute, {
      message: "El cierre debe ser posterior a la apertura.",
      path: ["endMinute"],
    })
  ).min(1),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});
