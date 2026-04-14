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
    phone: z.string().trim().min(7).max(30).optional(),
  }).refine((value) => Boolean(value.email || value.phone), {
    message: "Email or phone is required",
    path: ["email"],
  }),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
