import { prisma } from "../lib/prisma";
import { getAvailableSlots } from "../services/availability-engine";

async function main() {
  const business = await prisma.business.findFirst({
    include: { services: true },
  });

  if (!business?.services[0]) {
    throw new Error("No demo business or service found. Run npm run db:seed first.");
  }

  const slots = await getAvailableSlots(
    business.id,
    business.services[0].id,
    new Date("2026-04-13T12:00:00.000Z")
  );

  if (slots.length === 0) {
    throw new Error("No availability slots were generated.");
  }

  console.log(`Availability verified: ${slots.length} slots generated.`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
