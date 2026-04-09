import "dotenv/config"; // cargar .env
import prisma from "../prisma-client";

async function main() {
  try {
    const services = await prisma.service.findMany();
    console.log("✅ Servicios encontrados:", services.length);
  } catch (e) {
    console.error("❌ Error de conexión Prisma:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();