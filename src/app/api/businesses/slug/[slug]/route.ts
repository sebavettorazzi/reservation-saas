import { NextResponse } from "next/server";
import { getBusinessBySlug } from "@/services/business-catalog";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_req: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const business = await getBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Business slug error:", error);

    return NextResponse.json(
      { error: "Could not load business" },
      { status: 500 }
    );
  }
}
