import { prisma } from "./prisma";

/**
 * Verifica si un servicio tiene disponibilidad en un rango de tiempo.
 */
export async function isTimeSlotAvailable(
  serviceId: string,
  startTime: Date,
  endTime: Date
) {
  const overlapping = await prisma.appointment.findFirst({
    where: {
      serviceId,
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
  });

  return overlapping === null;
}