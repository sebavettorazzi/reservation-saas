import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/services/availability-engine";
import {
  AvailabilityRequestSchema,
} from "@/contracts/availability.contract";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const raw = {
      businessId: searchParams.get("businessId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
    };

    const parsed = AvailabilityRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { businessId, serviceId, date } = parsed.data;

    const result = await getAvailableSlots(
      businessId,
      serviceId,
      date
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
