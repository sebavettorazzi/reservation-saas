import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateAppointmentSchema } from "@/contracts/appointment.contract";
import { getAvailableSlots } from "@/services/availability-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      businessId,
      serviceId,
      staffId,
      start,
      end,
      customer: customerInput,
    } = parsed.data;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Invalid appointment range" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found for this business" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(businessId, serviceId, startDate);
    const selectedSlot = slots.find(
      (slot) =>
        slot.start.toISOString() === start &&
        slot.end.toISOString() === end
    );

    if (!selectedSlot) {
      return NextResponse.json(
        { error: "Selected slot is no longer available" },
        { status: 409 }
      );
    }

    const assignedStaffId = staffId ?? selectedSlot.bestStaffId;

    if (!assignedStaffId) {
      return NextResponse.json(
        { error: "No staff is available for this slot" },
        { status: 409 }
      );
    }

    const staffIsAvailable = selectedSlot.availableStaff.some(
      (member) => member.id === assignedStaffId
    );

    if (!staffIsAvailable) {
      return NextResponse.json(
        { error: "Selected staff is not available for this slot" },
        { status: 409 }
      );
    }

    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId: assignedStaffId,
        startTime: { lt: endDate },
        endTime: { gt: startDate },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 }
      );
    }

    const existingCustomer =
      (customerInput.email
        ? await prisma.customer.findFirst({
            where: {
              businessId,
              email: customerInput.email,
            },
          })
        : null) ??
      (customerInput.phone
        ? await prisma.customer.findFirst({
            where: {
              businessId,
              phone: customerInput.phone,
            },
          })
        : null);

    const customer = existingCustomer
      ? await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: customerInput.name,
            email: customerInput.email,
            phone: customerInput.phone,
          },
        })
      : await prisma.customer.create({
          data: {
            businessId,
            name: customerInput.name,
            email: customerInput.email,
            phone: customerInput.phone,
          },
        });

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        serviceId,
        customerId: customer.id,
        staffId: assignedStaffId,
        startTime: startDate,
        endTime: endDate,
        status: "confirmed",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Appointments error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
