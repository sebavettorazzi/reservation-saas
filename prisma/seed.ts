import { randomUUID } from "crypto";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function buildUtcDate(daysFromToday: number, hour: number, minute = 0) {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysFromToday,
      hour,
      minute,
      0,
      0
    )
  );
}

async function resetBusinessData(businessId: string) {
  const services = await prisma.service.findMany({
    where: { businessId },
    select: { id: true },
  });

  const serviceIds = services.map((service) => service.id);

  await prisma.appointment.deleteMany({
    where: { businessId },
  });

  await prisma.expense.deleteMany({
    where: { businessId },
  });

  if (serviceIds.length > 0) {
    await prisma.staffService.deleteMany({
      where: {
        serviceId: {
          in: serviceIds,
        },
      },
    });
  }

  await prisma.customer.deleteMany({
    where: { businessId },
  });

  await prisma.staff.deleteMany({
    where: { businessId },
  });

  await prisma.service.deleteMany({
    where: { businessId },
  });
}

async function seedSalon() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@test.com" },
    update: {
      name: "Salon Owner",
      password: "test1234",
    },
    create: {
      id: randomUUID(),
      email: "owner@test.com",
      name: "Salon Owner",
      password: "test1234",
    },
  });

  const business = await prisma.business.upsert({
    where: {
      name_ownerId: {
        name: "Barber Shop Demo",
        ownerId: owner.id,
      },
    },
    update: {
      slug: "barber-shop-demo",
      category: "SALON",
      plan: "PREMIUM",
      tagline: "Turnos simples para una barberia moderna.",
      description:
        "Template premium para peluquerias y barberias con una experiencia de reserva clara.",
    },
    create: {
      id: randomUUID(),
      name: "Barber Shop Demo",
      slug: "barber-shop-demo",
      category: "SALON",
      plan: "PREMIUM",
      tagline: "Turnos simples para una barberia moderna.",
      description:
        "Template premium para peluquerias y barberias con una experiencia de reserva clara.",
      ownerId: owner.id,
    },
  });

  await resetBusinessData(business.id);

  const staff = await Promise.all([
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Juan",
        businessId: business.id,
      },
    }),
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Pedro",
        businessId: business.id,
      },
    }),
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Lucia",
        businessId: business.id,
      },
    }),
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Corte de pelo",
        description: "Corte clasico con terminacion prolija.",
        duration: 30,
        price: 15,
        businessId: business.id,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Barba",
        description: "Perfilado y arreglo de barba.",
        duration: 20,
        price: 10,
        businessId: business.id,
      },
    }),
  ]);

  for (const member of staff) {
    for (const service of services) {
      await prisma.staffService.create({
        data: {
          staffId: member.id,
          serviceId: service.id,
        },
      });
    }
  }

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Cliente 1",
        email: "cliente1@demo.com",
        phone: "+54 11 4000 0001",
        businessId: business.id,
      },
    }),
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Cliente 2",
        email: "cliente2@demo.com",
        phone: "+54 11 4000 0002",
        businessId: business.id,
      },
    }),
  ]);

  await prisma.appointment.create({
    data: {
      id: randomUUID(),
      businessId: business.id,
      serviceId: services[0].id,
      customerId: customers[0].id,
      staffId: staff[0].id,
      startTime: buildUtcDate(1, 14, 0),
      endTime: buildUtcDate(1, 14, 30),
      status: "confirmed",
    },
  });

  return {
    owner,
    business,
    staff,
    services,
    customers,
  };
}

async function seedSportsComplex() {
  const owner = await prisma.user.upsert({
    where: { email: "dosdeabril@test.com" },
    update: {
      name: "Administrador 2 de Abril",
      password: "test1234",
    },
    create: {
      id: randomUUID(),
      email: "dosdeabril@test.com",
      name: "Administrador 2 de Abril",
      password: "test1234",
    },
  });

  const business = await prisma.business.upsert({
    where: {
      name_ownerId: {
        name: "2 de Abril",
        ownerId: owner.id,
      },
    },
    update: {
      slug: "2-de-abril",
      category: "SPORTS",
      plan: "PREMIUM",
      tagline: "Reservas online para las canchas del complejo 2 de Abril.",
      description:
        "Complejo de futbol con una cancha sintetica y dos de cesped natural, inspirado en la historia de su fundador excombatiente de Malvinas.",
    },
    create: {
      id: randomUUID(),
      name: "2 de Abril",
      slug: "2-de-abril",
      category: "SPORTS",
      plan: "PREMIUM",
      tagline: "Reservas online para las canchas del complejo 2 de Abril.",
      description:
        "Complejo de futbol con una cancha sintetica y dos de cesped natural, inspirado en la historia de su fundador excombatiente de Malvinas.",
      ownerId: owner.id,
    },
  });

  await resetBusinessData(business.id);

  const courts = await Promise.all([
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Cancha sintetica",
        businessId: business.id,
      },
    }),
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Cancha cesped norte",
        businessId: business.id,
      },
    }),
    prisma.staff.create({
      data: {
        id: randomUUID(),
        name: "Cancha cesped sur",
        businessId: business.id,
      },
    }),
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Cancha sintetica - 60 min",
        description: "Reserva de 60 minutos en la cancha sintetica.",
        duration: 60,
        price: 35,
        businessId: business.id,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Cancha cesped natural - 60 min",
        description: "Reserva de 60 minutos en una cancha de cesped natural.",
        duration: 60,
        price: 28,
        businessId: business.id,
      },
    }),
  ]);

  await prisma.staffService.create({
    data: {
      staffId: courts[0].id,
      serviceId: services[0].id,
    },
  });

  await prisma.staffService.createMany({
    data: [
      {
        staffId: courts[1].id,
        serviceId: services[1].id,
      },
      {
        staffId: courts[2].id,
        serviceId: services[1].id,
      },
    ],
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Martin Perez",
        email: "martin@partido.com",
        phone: "+54 11 5555 1001",
        businessId: business.id,
      },
    }),
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Agustin Rojas",
        email: "agustin@partido.com",
        phone: "+54 11 5555 1002",
        businessId: business.id,
      },
    }),
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Nicolas Diaz",
        email: "nicolas@partido.com",
        phone: "+54 11 5555 1003",
        businessId: business.id,
      },
    }),
  ]);

  await prisma.appointment.createMany({
    data: [
      {
        id: randomUUID(),
        businessId: business.id,
        serviceId: services[0].id,
        customerId: customers[0].id,
        staffId: courts[0].id,
        startTime: buildUtcDate(0, 18, 0),
        endTime: buildUtcDate(0, 19, 0),
        status: "confirmed",
      },
      {
        id: randomUUID(),
        businessId: business.id,
        serviceId: services[1].id,
        customerId: customers[1].id,
        staffId: courts[1].id,
        startTime: buildUtcDate(0, 19, 0),
        endTime: buildUtcDate(0, 20, 0),
        status: "confirmed",
      },
      {
        id: randomUUID(),
        businessId: business.id,
        serviceId: services[1].id,
        customerId: customers[2].id,
        staffId: courts[2].id,
        startTime: buildUtcDate(0, 20, 30),
        endTime: buildUtcDate(0, 21, 30),
        status: "confirmed",
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        id: randomUUID(),
        businessId: business.id,
        title: "Mantenimiento de iluminacion",
        category: "Infraestructura",
        amount: 18000,
        notes: "Cambio de reflectores del sector sintetico.",
        expenseDate: buildUtcDate(0, 10, 0),
      },
      {
        id: randomUUID(),
        businessId: business.id,
        title: "Mantenimiento del cesped",
        category: "Canchas",
        amount: 24500,
        notes: "Corte, marcacion y riego de las canchas naturales.",
        expenseDate: buildUtcDate(1, 9, 0),
      },
      {
        id: randomUUID(),
        businessId: business.id,
        title: "Limpieza y vestuarios",
        category: "Operacion",
        amount: 9500,
        notes: "Servicio semanal de limpieza general.",
        expenseDate: buildUtcDate(2, 8, 30),
      },
    ],
  });

  return {
    owner,
    business,
    courts,
    services,
    customers,
  };
}

async function main() {
  console.log("Seeding database...");

  const salon = await seedSalon();
  const sports = await seedSportsComplex();

  console.log("Seed completed successfully");
  console.log({
    salonSlug: salon.business.slug,
    sportsSlug: sports.business.slug,
    sportsDashboard: `/business/${sports.business.slug}/dashboard`,
    sportsPublic: `/business/${sports.business.slug}`,
  });
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
