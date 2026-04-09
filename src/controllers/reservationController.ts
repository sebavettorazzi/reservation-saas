import { Request, Response } from "express";
import prisma from "../prisma-client";
import { getAvailableSlots } from "../services/availability-engine";
import { Prisma } from "@prisma/client";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { serviceId, customerId, startTime, endTime } = req.body;

    if (!serviceId || !customerId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // ✅ Buscar el servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // ✅ Buscar slots disponibles
    const availableSlots = await getAvailableSlots(
      service.businessId, // usamos businessId del servicio
      service.duration,
      start,
    );

    const isAvailable = availableSlots.some(
      (slot) =>
        slot.start.getTime() === start.getTime() &&
        slot.end.getTime() === end.getTime(),
    );

    if (!isAvailable) {
      return res.status(409).json({ error: "Slot is already booked" });
    }

    // ✅ Crear el Appointment
    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        customerId,
        startTime: start,
        endTime: end,
        status: "pending",
      } as Prisma.AppointmentUncheckedCreateInput,
    });

    res.status(201).json({ appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
