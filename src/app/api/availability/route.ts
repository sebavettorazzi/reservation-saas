import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/services/availability-engine";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);

    const businessId = searchParams.get("businessId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(
      businessId,
      service.duration,
      new Date(date)
    );

    return NextResponse.json(slots);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error calculating availability" },
      { status: 500 }
    );
  }
}