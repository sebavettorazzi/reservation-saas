import { prisma } from "@/lib/prisma";

function getArgentinaDayBounds(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999));

  return { start, end };
}

export async function listBookingBusinesses() {
  return prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      plan: true,
      tagline: true,
      description: true,
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
    orderBy: [{ duration: "asc" }, { price: "asc" }, { name: "asc" }],
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

export async function getBusinessBySlug(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      plan: true,
      tagline: true,
      description: true,
      createdAt: true,
      staff: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          staff: true,
          services: true,
          appointments: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  const services = await listBusinessServices(business.id);

  return {
    ...business,
    services,
  };
}

export async function listBusinessAppointmentsBySlug(
  slug: string,
  date: string
) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      category: true,
      _count: {
        select: {
          staff: true,
          services: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  const { start, end } = getArgentinaDayBounds(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      startTime: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ startTime: "asc" }],
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    business,
    appointments,
  };
}
