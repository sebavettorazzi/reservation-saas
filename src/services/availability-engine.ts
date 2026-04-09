import prisma from "../prisma-client";

type Slot = {
  start: Date;
  end: Date;
};

export async function getAvailableSlots(
  businessId: string,
  serviceDuration: number,
  date: Date
): Promise<Slot[]> {

  const openHour = 9;
  const closeHour = 17;
  const slotInterval = 30;

  const startOfDay = new Date(date);
  startOfDay.setHours(openHour, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(closeHour, 0, 0, 0);

  // 🔎 buscar turnos existentes
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: businessId,
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

  const slots: Slot[] = [];
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
      });
    }

    current = new Date(current.getTime() + slotInterval * 60000);
  }

  return slots;
}