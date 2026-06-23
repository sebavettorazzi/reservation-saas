import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.notification.updateMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
    data: { status: "SIMULATED", sentAt: new Date() },
  });

  console.log(`Simulated WhatsApp dispatch: ${result.count} notification(s).`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
