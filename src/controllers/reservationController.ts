import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma-client";
import { getAvailableSlots } from "../services/availability-engine";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { serviceId, customerId, startTime, endTime } = req.body;

    if (!serviceId || !customerId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const availableSlots = await getAvailableSlots(
      service.businessId,
      service.id,
      start
    );

    const isAvailable = availableSlots.some(
      (slot) =>
        slot.start.getTime() === start.getTime() &&
        slot.end.getTime() === end.getTime()
    );

    if (!isAvailable) {
      return res.status(409).json({ error: "Slot is already booked" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: service.businessId,
        serviceId,
        customerId,
        startTime: start,
        endTime: end,
        status: "pending",
      } as Prisma.AppointmentUncheckedCreateInput,
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: "Internal server error" });
  }
};
