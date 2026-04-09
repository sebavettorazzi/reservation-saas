import { Request, Response } from "express";
import prisma from "../prisma-client";

export const getAppointments = async (req: Request, res: Response) => {
  const appointments = await prisma.appointment.findMany({
    include: { service: true, staff: true, customer: true },
  });
  res.json(appointments);
};

export const createAppointment = async (req: Request, res: Response) => {
  const { businessId, serviceId, staffId, customerId, startTime } = req.body;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return res.status(400).json({ error: "Service not found" });

  const endTime = new Date(new Date(startTime).getTime() + service.duration * 60000);

  const appointment = await prisma.appointment.create({
    data: { businessId, serviceId, staffId, customerId, startTime: new Date(startTime), endTime },
  });

  res.json(appointment);
};