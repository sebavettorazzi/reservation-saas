import { prisma } from "../lib/prisma";
import { getAvailableSlots } from "../services/availability-engine";

async function runTest() {
  console.log("🧪 Running availability test...");

  const business = await prisma.business.findFirst({
    include: {
      services: true,
    },
  });

  if (!business) throw new Error("No business found");

  const service = business.services[0];

  if (!service) throw new Error("No service found");

  const date = new Date("2026-04-13");

  const slots = await getAvailableSlots(
    business.id,
    service.id,
    date
  );

  console.log("📦 Slots found:", slots.length);

  console.log(JSON.stringify(slots.slice(0, 5), null, 2));
}

runTest()
  .then(() => {
    console.log("✅ Test finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });