import { prisma } from "../src/lib/prisma";
import { randomUUID } from "crypto";

async function main() {
  console.log("🌱 Seeding database...");

  // =========================
  // OWNER
  // =========================
  const ownerId = randomUUID();

  const owner = await prisma.user.create({
    data: {
      id: ownerId,
      email: "owner@test.com",
      name: "Owner",
      password: "test1234",
    },
  });

  // =========================
  // BUSINESS
  // =========================
  const businessId = randomUUID();

  const business = await prisma.business.create({
    data: {
      id: businessId,
      name: "Barber Shop Demo",
      ownerId: owner.id,
    },
  });

  // =========================
  // STAFF (SOLO UUIDS REALES)
  // =========================
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
        name: "Lucía",
        businessId: business.id,
      },
    }),
  ]);

  // =========================
  // SERVICES
  // =========================
  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Corte de pelo",
        duration: 30,
        price: 15,
        businessId: business.id,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        name: "Barba",
        duration: 20,
        price: 10,
        businessId: business.id,
      },
    }),
  ]);

  // =========================
  // STAFF ↔ SERVICES RELATION
  // (todos pueden hacer todos los servicios)
  // =========================
  for (const s of staff) {
    for (const service of services) {
      await prisma.staffService.create({
        data: {
          staffId: s.id,
          serviceId: service.id,
        },
      });
    }
  }

  // =========================
  // CUSTOMERS
  // =========================
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Cliente 1",
        businessId: business.id,
      },
    }),
    prisma.customer.create({
      data: {
        id: randomUUID(),
        name: "Cliente 2",
        businessId: business.id,
      },
    }),
  ]);

  console.log("✅ Seed completed successfully");
  console.log({
    ownerId: owner.id,
    businessId: business.id,
    staffIds: staff.map((s) => s.id),
    serviceIds: services.map((s) => s.id),
    customerIds: customers.map((c) => c.id),
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });