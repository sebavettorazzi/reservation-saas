require("dotenv/config");

const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const BUSINESS_SLUG = process.env.SIM_BUSINESS_SLUG ?? "2-de-abril";
const DAYS_BACK = Number(process.env.SIM_DAYS_BACK ?? 365);
const CUSTOMER_COUNT = Number(process.env.SIM_CUSTOMERS ?? 280);
const PRICE_MULTIPLIER = Number(process.env.SIM_PRICE_MULTIPLIER ?? 1000);
const SIM_PREFIX = "[Sim]";
const SIM_PHONE_PREFIX = "+549SIM";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function createRng(seed = 20260930) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const rng = createRng(Number(process.env.SIM_SEED ?? 20260930));

const FIRST_NAMES = [
  "Martin",
  "Agustin",
  "Nicolas",
  "Lucas",
  "Tomas",
  "Federico",
  "Diego",
  "Gaston",
  "Matias",
  "Joaquin",
  "Santiago",
  "Bruno",
  "Ezequiel",
  "Franco",
  "Maximiliano",
  "Leandro",
];

const LAST_NAMES = [
  "Perez",
  "Rojas",
  "Diaz",
  "Gomez",
  "Lopez",
  "Sosa",
  "Fernandez",
  "Martinez",
  "Romero",
  "Alvarez",
  "Torres",
  "Castro",
  "Molina",
  "Suarez",
  "Acosta",
  "Herrera",
];

const HOLIDAYS = new Set([
  "01-01",
  "03-24",
  "04-02",
  "05-01",
  "05-25",
  "06-20",
  "07-09",
  "08-17",
  "10-12",
  "11-20",
  "12-08",
  "12-25",
]);

function pad(value) {
  return String(value).padStart(2, "0");
}

function argentinaDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function argentinaDateAt(dateKey, hour, minute = 0) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute, 0, 0));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function monthDay(dateKey) {
  return dateKey.slice(5);
}

function seasonFactor(month) {
  if ([1, 2].includes(month)) return 0.58; // vacaciones y calor
  if ([6, 7].includes(month)) return 0.72; // invierno, frio y lluvia
  if ([3, 4, 9, 10, 11].includes(month)) return 0.9; // meses fuertes
  return 0.8;
}

function priceFactor(monthsAgo) {
  return 1 - Math.min(monthsAgo * 0.018, 0.22);
}

function occupancyFor(dateKey, hour, weekday, monthsAgo) {
  const [, monthValue, dayValue] = dateKey.split("-").map(Number);
  let probability = weekday >= 1 && weekday <= 5 ? 0.7 : 0.34;

  probability *= seasonFactor(monthValue);

  if (hour >= 20 && hour <= 22) probability += 0.12;
  if (hour === 18) probability -= 0.08;
  if (weekday === 5) probability += 0.08;
  if (weekday === 6) probability -= 0.04;
  if (HOLIDAYS.has(monthDay(dateKey))) probability *= 0.18;

  // Algunas semanas flojas por lluvia, frio o viajes largos.
  const weekWave = Math.sin((dayValue + monthValue * 3 + monthsAgo) * 1.7);
  if (weekWave < -0.72) probability *= 0.58;
  if ([6, 7].includes(monthValue) && rng() < 0.08) probability *= 0.35;
  if ([1, 2].includes(monthValue) && rng() < 0.1) probability *= 0.45;

  return Math.max(0.05, Math.min(probability, 0.94));
}

function chooseCustomer(customers) {
  return customers[Math.floor(rng() * customers.length)];
}

function randomFrom(items) {
  return items[Math.floor(rng() * items.length)];
}

async function cleanupSimulation(businessId) {
  const simulatedCustomers = await prisma.customer.findMany({
    where: {
      businessId,
      phone: { startsWith: SIM_PHONE_PREFIX },
    },
    select: { id: true },
  });
  const customerIds = simulatedCustomers.map((customer) => customer.id);

  if (customerIds.length > 0) {
    await prisma.appointment.deleteMany({
      where: {
        businessId,
        customerId: { in: customerIds },
      },
    });
    await prisma.customer.deleteMany({
      where: {
        id: { in: customerIds },
      },
    });
  }

  await prisma.expense.deleteMany({
    where: {
      businessId,
      title: { startsWith: SIM_PREFIX },
    },
  });
}

async function createCustomers(businessId) {
  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, index) => {
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const suffix = pad(index + 1);

    return {
      id: randomUUID(),
      businessId,
      name: `${firstName} ${lastName}`,
      email: `sim-${suffix}@2deabril.test`,
      phone: `${SIM_PHONE_PREFIX}${suffix}`,
    };
  });

  await prisma.customer.createMany({ data: customers });
  return customers;
}

function buildExpenseRows(businessId, startDate, endDate) {
  const rows = [];
  const firstMonth = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1, 12));
  const lastMonth = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1, 12));

  for (let cursor = firstMonth; cursor <= lastMonth; cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1, 12))) {
    const dateKey = argentinaDateKey(cursor);
    const [year, month] = dateKey.split("-").map(Number);
    const winterBoost = [6, 7, 8].includes(month) ? 1.18 : 1;
    const summerBoost = [1, 2].includes(month) ? 1.12 : 1;

    rows.push(
      {
        id: randomUUID(),
        businessId,
        title: `${SIM_PREFIX} Luz y servicios`,
        category: "Servicios",
        amount: Math.round((68000 + rng() * 22000) * winterBoost),
        notes: "Consumo mensual simulado.",
        expenseDate: argentinaDateAt(`${year}-${pad(month)}-05`, 12),
      },
      {
        id: randomUUID(),
        businessId,
        title: `${SIM_PREFIX} Mantenimiento de canchas`,
        category: "Canchas",
        amount: Math.round((52000 + rng() * 38000) * summerBoost),
        notes: "Corte, riego, caucho, redes y marcacion.",
        expenseDate: argentinaDateAt(`${year}-${pad(month)}-10`, 12),
      },
      {
        id: randomUUID(),
        businessId,
        title: `${SIM_PREFIX} Limpieza y vestuarios`,
        category: "Operacion",
        amount: Math.round(36000 + rng() * 16000),
        notes: "Limpieza mensual simulada.",
        expenseDate: argentinaDateAt(`${year}-${pad(month)}-16`, 12),
      },
      {
        id: randomUUID(),
        businessId,
        title: `${SIM_PREFIX} Personal eventual`,
        category: "Personal",
        amount: Math.round(44000 + rng() * 28000),
        notes: "Refuerzos de atencion y fines de semana.",
        expenseDate: argentinaDateAt(`${year}-${pad(month)}-22`, 12),
      }
    );

    if (rng() < 0.42) {
      rows.push({
        id: randomUUID(),
        businessId,
        title: `${SIM_PREFIX} Reparacion puntual`,
        category: "Infraestructura",
        amount: Math.round(18000 + rng() * 55000),
        notes: "Gasto extraordinario simulado.",
        expenseDate: argentinaDateAt(`${year}-${pad(month)}-${pad(12 + Math.floor(rng() * 12))}`, 12),
      });
    }
  }

  return rows;
}

async function main() {
  const business = await prisma.business.findUnique({
    where: { slug: BUSINESS_SLUG },
    include: {
      staff: {
        include: {
          services: {
            include: { service: true },
          },
        },
      },
    },
  });

  if (!business) {
    throw new Error(`No se encontro el negocio ${BUSINESS_SLUG}.`);
  }

  await cleanupSimulation(business.id);
  const customers = await createCustomers(business.id);

  const today = new Date();
  const startDate = addDays(today, -DAYS_BACK);
  const endDate = addDays(today, -1);
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      status: { not: "CANCELLED" },
      startTime: { gte: startDate, lte: endDate },
    },
    select: { staffId: true, startTime: true },
  });
  const occupiedSlots = new Set(
    existingAppointments.map((appointment) => `${appointment.staffId}:${appointment.startTime.toISOString()}`)
  );
  const appointments = [];
  const weekdayHours = [18, 19, 20, 21, 22];
  const saturdayHours = [10, 11, 12, 16, 17, 18, 19];

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const dateKey = argentinaDateKey(cursor);
    const [year, month] = dateKey.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, Number(dateKey.slice(8)), 12)).getUTCDay();

    if (weekday === 0) continue;
    if (weekday === 6 && rng() > 0.52) continue;

    const hours = weekday === 6 ? saturdayHours : weekdayHours;
    const monthsAgo = Math.max(0, (today.getUTCFullYear() - year) * 12 + (today.getUTCMonth() + 1 - month));

    for (const court of business.staff) {
      const service = court.services[0]?.service;
      if (!service) continue;

      for (const hour of hours) {
        if (rng() > occupancyFor(dateKey, hour, weekday, monthsAgo)) continue;

        const startTime = argentinaDateAt(dateKey, hour);
        const endTime = argentinaDateAt(dateKey, hour + Math.round(service.duration / 60));
        const slotKey = `${court.id}:${startTime.toISOString()}`;

        if (occupiedSlots.has(slotKey)) continue;

        const customer = chooseCustomer(customers);
        const isCancelled = rng() < 0.055;

        occupiedSlots.add(slotKey);
        appointments.push({
          id: randomUUID(),
          businessId: business.id,
          serviceId: service.id,
          customerId: customer.id,
          staffId: court.id,
          startTime,
          endTime,
          status: isCancelled ? "CANCELLED" : "CONFIRMED",
          priceSnapshot: Math.round(service.price * PRICE_MULTIPLIER * priceFactor(monthsAgo)),
        });
      }
    }
  }

  const expenses = buildExpenseRows(business.id, startDate, endDate);

  await prisma.appointment.createMany({ data: appointments });
  await prisma.expense.createMany({ data: expenses });

  const confirmed = appointments.filter((appointment) => appointment.status === "CONFIRMED");
  const cancelled = appointments.length - confirmed.length;
  const revenue = confirmed.reduce((total, appointment) => total + appointment.priceSnapshot, 0);
  const expenseTotal = expenses.reduce((total, expense) => total + expense.amount, 0);

  console.log("Simulacion anual cargada.");
  console.log({
    business: business.name,
    range: `${argentinaDateKey(startDate)} a ${argentinaDateKey(endDate)}`,
    customers: customers.length,
    appointments: appointments.length,
    confirmed: confirmed.length,
    cancelled,
    expenses: expenses.length,
    priceMultiplier: PRICE_MULTIPLIER,
    revenue,
    expenseTotal,
    net: revenue - expenseTotal,
  });
}

main()
  .catch((error) => {
    console.error("Simulation seed error:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
