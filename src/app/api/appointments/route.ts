import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      businessId,
      serviceId,
      customerId,
      staffId,
      start,
      end,
    } = body;

    // validación mínima
    if (!businessId || !serviceId || !customerId || !start || !end) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // 🔥 check de seguridad (muy importante)
    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId,
        startTime: { lt: new Date(end) },
        endTime: { gt: new Date(start) },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        serviceId,
        customerId,
        staffId,
        startTime: new Date(start),
        endTime: new Date(end),
        status: "confirmed",
      },
    });

    return NextResponse.json(appointment);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}