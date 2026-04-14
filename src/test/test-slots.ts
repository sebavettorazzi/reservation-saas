import { getAvailableSlots } from "../services/availability-engine";

async function run() {
  const businessId = "test-business-id"; // usa uno real de tu DB
  const serviceId = "test-service-id"; // usa uno real de tu DB

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const slots = await getAvailableSlots(
    businessId,
    serviceId,
    date
  );

  console.log("Slots disponibles:");
  console.log(slots);
}

run();
