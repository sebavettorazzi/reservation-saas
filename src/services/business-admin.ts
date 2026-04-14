import { prisma } from "@/lib/prisma";

type ServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  businessId: string;
  _count: {
    staff: number;
  };
};

export type UpdateBusinessServicePriceResult =
  | { status: "business_not_found" }
  | { status: "service_not_found" }
  | { status: "ok"; service: ServiceSummary };

export async function updateBusinessServicePriceBySlug(
  slug: string,
  serviceId: string,
  price: number
): Promise<UpdateBusinessServicePriceResult> {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!business) {
    return { status: "business_not_found" };
  }

  const existingService = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId: business.id,
    },
  });

  if (!existingService) {
    return { status: "service_not_found" };
  }

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { price },
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

  return {
    status: "ok",
    service,
  };
}
