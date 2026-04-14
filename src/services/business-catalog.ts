import { prisma } from "@/lib/prisma";

export async function listBookingBusinesses() {
  return prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          services: true,
          staff: true,
        },
      },
    },
  });
}

export async function listBusinessServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId },
    orderBy: [
      { duration: "asc" },
      { price: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      businessId: true,
      _count: {
        select: {
          staff: true,
        },
      },
    },
  });
}
