require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3001";
const BUSINESS_SLUG = process.env.SMOKE_BUSINESS_SLUG ?? "2-de-abril";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "dosdeabril@test.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "test1234";

function argentinaInputDate(daysFromToday = 1) {
  const now = new Date();
  const date = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysFromToday,
    12
  ));

  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Cordoba",
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${JSON.stringify(body)}`);
  }

  return { response, body };
}

async function main() {
  const date = process.env.SMOKE_DATE ?? argentinaInputDate(1);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  let appointmentId = null;

  try {
    console.log(`[smoke] Usando ${BASE_URL}`);

    const { body: business } = await fetchJson(`${BASE_URL}/api/businesses/slug/${BUSINESS_SLUG}`);
    const service = business.services[0];

    if (!service) {
      throw new Error(`El negocio ${BUSINESS_SLUG} no tiene servicios cargados.`);
    }

    const availabilityUrl = new URL(`${BASE_URL}/api/availability`);
    availabilityUrl.searchParams.set("businessId", business.id);
    availabilityUrl.searchParams.set("serviceId", service.id);
    availabilityUrl.searchParams.set("date", date);

    const { body: slots } = await fetchJson(availabilityUrl.toString());
    const slot = slots.find((item) => item.availableStaff?.length > 0);

    if (!slot) {
      throw new Error(`No hay horarios disponibles para ${date}.`);
    }

    const payload = {
      businessId: business.id,
      serviceId: service.id,
      staffId: slot.bestStaffId,
      start: slot.start,
      end: slot.end,
      customer: {
        name: "Prueba simulacro automatico",
        phone: "3511111111",
      },
    };

    const { response: createdResponse, body: appointment } = await fetchJson(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    appointmentId = appointment.id;
    console.log(`[smoke] Reserva creada: ${createdResponse.status} ${appointmentId}`);

    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!login.ok) {
      throw new Error(`Login admin fallo: ${login.status}`);
    }

    const cookie = login.headers.get("set-cookie")?.split(";")[0];

    if (!cookie) {
      throw new Error("Login admin no devolvio cookie de sesion.");
    }

    const appointmentsUrl = new URL(`${BASE_URL}/api/businesses/slug/${BUSINESS_SLUG}/appointments`);
    appointmentsUrl.searchParams.set("date", date);

    const { body: adminPayload } = await fetchJson(appointmentsUrl.toString(), {
      headers: { cookie },
    });

    const visibleInAdmin = adminPayload.appointments.some((item) => item.id === appointmentId);

    if (!visibleInAdmin) {
      throw new Error("La reserva creada no aparece en el dashboard admin.");
    }

    console.log("[smoke] Reserva visible en admin.");
  } finally {
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" },
      });
      console.log("[smoke] Reserva de prueba cancelada.");
    }

    await prisma.$disconnect();
  }

  console.log("[smoke] Flujo cliente/admin OK.");
}

main().catch((error) => {
  console.error(`[smoke] ${error.message}`);
  process.exit(1);
});
