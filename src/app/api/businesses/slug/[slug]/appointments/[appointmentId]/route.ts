import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedBusiness } from "@/lib/auth";
import { UpdateAppointmentStatusSchema } from "@/contracts/court-schedule.contract";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ slug: string; appointmentId: string }> };

export async function PATCH(req: Request, context: Context) {
  const { slug, appointmentId } = await context.params;
  const user = await getCurrentUser();
  const business = user ? await getOwnedBusiness(user.id, slug) : null;
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UpdateAppointmentStatusSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, businessId: business.id } });
  if (!appointment) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });

  return NextResponse.json(await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: parsed.data.status },
  }));
}
