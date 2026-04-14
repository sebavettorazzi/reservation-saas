import { NextResponse } from "next/server";
import { listBusinessServices } from "@/services/business-catalog";

type Context = {
  params: Promise<{
    businessId: string;
  }>;
};

export async function GET(_req: Request, context: Context) {
  try {
    const { businessId } = await context.params;

    const services = await listBusinessServices(businessId);

    return NextResponse.json(services);
  } catch (error) {
    console.error("Services error:", error);

    return NextResponse.json(
      { error: "Could not load services" },
      { status: 500 }
    );
  }
}
