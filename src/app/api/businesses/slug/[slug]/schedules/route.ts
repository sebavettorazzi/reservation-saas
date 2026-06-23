import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedBusiness } from "@/lib/auth";
import { UpdateCourtSchedulesSchema } from "@/contracts/court-schedule.contract";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Context) {
  const { slug } = await context.params;
  const user = await getCurrentUser();
  const business = user ? await getOwnedBusiness(user.id, slug) : null;

  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courts = await prisma.staff.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
    include: { schedules: { orderBy: { weekday: "asc" } } },
  });

  return NextResponse.json(courts);
}

export async function PATCH(req: Request, context: Context) {
  const { slug } = await context.params;
  const user = await getCurrentUser();
  const business = user ? await getOwnedBusiness(user.id, slug) : null;

  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UpdateCourtSchedulesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Horarios inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const staffIds = [...new Set(parsed.data.schedules.map((schedule) => schedule.staffId))];
  const ownedCourts = await prisma.staff.count({ where: { id: { in: staffIds }, businessId: business.id } });
  if (ownedCourts !== staffIds.length) return NextResponse.json({ error: "Cancha inválida." }, { status: 400 });

  await prisma.$transaction(
    parsed.data.schedules.map((schedule) =>
      prisma.courtSchedule.upsert({
        where: { staffId_weekday: { staffId: schedule.staffId, weekday: schedule.weekday } },
        update: {
          startMinute: schedule.startMinute,
          endMinute: schedule.endMinute,
          slotInterval: schedule.slotInterval,
          isOpen: schedule.isOpen,
        },
        create: schedule,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
