import { z } from "zod";

export const UpdateServicePriceSchema = z.object({
  price: z.coerce.number().positive().max(1_000_000),
});

export type UpdateServicePriceInput = z.infer<typeof UpdateServicePriceSchema>;
