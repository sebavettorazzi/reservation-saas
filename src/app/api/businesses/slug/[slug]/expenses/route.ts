import { NextResponse } from "next/server";
import { CreateExpenseSchema } from "@/contracts/expense.contract";
import { createBusinessExpenseBySlug } from "@/services/business-premium";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(req: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const parsed = CreateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid expense payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createBusinessExpenseBySlug(slug, parsed.data);

    if (result.status === "business_not_found") {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (result.status === "premium_required") {
      return NextResponse.json(
        { error: "Premium plan required" },
        { status: 403 }
      );
    }

    return NextResponse.json(result.expense, { status: 201 });
  } catch (error) {
    console.error("Expense create error:", error);

    return NextResponse.json(
      { error: "Could not create expense" },
      { status: 500 }
    );
  }
}
