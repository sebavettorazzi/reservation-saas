import { z } from "zod";

/**
 * =========================
 * REQUEST
 * =========================
 */

export const AvailabilityRequestSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string(), // ISO string desde frontend
});

export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;

/**
 * =========================
 * RESPONSE
 * =========================
 */

export const AvailabilitySlotSchema = z.object({
  start: z.string(), // ISO
  end: z.string(),   // ISO

  availableStaff: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),

  bestStaffId: z.string().nullable(),
});

export const AvailabilityResponseSchema = z.array(AvailabilitySlotSchema);

export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;