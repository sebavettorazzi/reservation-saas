import { prisma } from "./prisma";
import { isTimeSlotAvailable } from "./availability";

/**
 * Crea una reserva segura, validando la disponibilidad antes.
 */
export async function createAppointmentSafe(
  serviceId: string,
  customerId: string,
  startTime: Date,
  endTime: Date
) {
  const available = await isTimeSlotAvailable(serviceId, startTime, endTime);

  if (!available) {
    throw new Error("Horario no disponible");
  }

  return await prisma.appointment.create({
    data: {
      serviceId,
      customerId,
      startTime,
      endTime,
      status: "pending",
    },
  });
}