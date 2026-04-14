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
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { businessId: true },
  });

  if (!service) {
    throw new Error("Servicio no encontrado");
  }

  const available = await isTimeSlotAvailable(serviceId, startTime, endTime);

  if (!available) {
    throw new Error("Horario no disponible");
  }

  return await prisma.appointment.create({
    data: {
      businessId: service.businessId,
      serviceId,
      customerId,
      startTime,
      endTime,
      status: "pending",
    },
  });
}
