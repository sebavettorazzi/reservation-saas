import { NextResponse } from "next/server";
import { listBusinessAppointmentsBySlug } from "@/services/business-catalog";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Cordoba",
    });

    const payload = await listBusinessAppointmentsBySlug(slug, date);

    if (!payload) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Business appointments error:", error);

    return NextResponse.json(
      { error: "Could not load appointments" },
      { status: 500 }
    );
  }
}
