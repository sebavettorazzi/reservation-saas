import { Request, Response } from "express";
import prisma from "../prisma-client";
import { getAvailableSlots } from "../services/availability-engine";

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const serviceId = req.query.serviceId as string;
    const date = req.query.date as string;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        error: "businessId, serviceId and date are required",
      });
    }

    // Verificar que el servicio existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    // Parsear la fecha
    const parsedDate = new Date(date);

    // Obtener slots disponibles basados en las reservas existentes
    const slots = await getAvailableSlots(
      businessId, // string, se convertirá a int dentro del engine
      service.duration,
      parsedDate
    );

    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};