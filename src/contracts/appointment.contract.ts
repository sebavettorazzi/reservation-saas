import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().optional(),
    phone: z.string().trim().min(7).max(30),
  }).refine((value) => Boolean(value.phone), {
    message: "Phone is required",
    path: ["phone"],
  }),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
