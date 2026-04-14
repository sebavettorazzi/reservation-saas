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

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.businessId !== businessId) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    const parsedDate = new Date(date);
    const slots = await getAvailableSlots(businessId, serviceId, parsedDate);

    return res.json(slots);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
