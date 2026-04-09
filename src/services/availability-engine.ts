import { prisma } from "@/lib/prisma";

type Slot = {
  start: Date;
  end: Date;
  staffId: string;
};

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: Date
): Promise<Slot[]> {

  const openHour = 9;
  const closeHour = 17;
  const slotInterval = 30;

  const startOfDay = new Date(date);
  startOfDay.setHours(openHour, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(closeHour, 0, 0, 0);

  // servicio
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!service) return [];

  const serviceDuration = service.duration;

  // staff que hacen ese servicio
  const staffServices = await prisma.staffService.findMany({
    where: {
      serviceId: serviceId
    },
    select: {
      staffId: true
    }
  });

  const staffIds = staffServices.map(s => s.staffId);

  const slots: Slot[] = [];

  for (const staffId of staffIds) {

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: ["pending", "confirmed"],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    let current = new Date(startOfDay);

    while (current < endOfDay) {

      const slotEnd = new Date(current.getTime() + serviceDuration * 60000);

      if (slotEnd > endOfDay) break;

      const conflict = appointments.some(
        (a) => current < a.endTime && slotEnd > a.startTime
      );

      if (!conflict) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
          staffId
        });
      }

      current = new Date(current.getTime() + slotInterval * 60000);
    }
  }

  return slots;
}