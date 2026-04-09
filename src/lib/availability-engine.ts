import prisma from "../prisma-client"

export async function getAvailability(serviceId: string, date: Date) {

  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  })

  if (!service) {
    throw new Error("Service not found")
  }

  const startOfDay = new Date(date)
  startOfDay.setHours(9, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(18, 0, 0, 0)

  const appointments = await prisma.appointment.findMany({
    where: {
      serviceId,
      startTime: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  })

  const slots: string[] = []

  let current = new Date(startOfDay)

  while (current < endOfDay) {

    const slotStart = new Date(current)

    const slotEnd = new Date(
      current.getTime() + service.duration * 60000
    )

    const overlap = appointments.some(a => {
      return (
        slotStart < a.endTime &&
        slotEnd > a.startTime
      )
    })

    if (!overlap && slotEnd <= endOfDay) {
      slots.push(
        slotStart.toTimeString().slice(0, 5)
      )
    }

    current.setMinutes(current.getMinutes() + 30)

  }

  return slots
}