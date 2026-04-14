import { z } from "zod";

export const CreateExpenseSchema = z.object({
  title: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40).optional(),
  amount: z.coerce.number().positive().max(10_000_000),
  expenseDate: z.string().datetime(),
  notes: z.string().trim().max(280).optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
