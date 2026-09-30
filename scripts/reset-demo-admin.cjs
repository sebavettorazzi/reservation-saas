/* eslint-disable @typescript-eslint/no-require-imports */

require("dotenv/config");

const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "dosdeabril@test.com";
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "test1234";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: DEMO_ADMIN_EMAIL },
    data: { passwordHash: hashPassword(DEMO_ADMIN_PASSWORD) },
  });

  if (result.count !== 1) {
    throw new Error(`No se encontró la cuenta demo ${DEMO_ADMIN_EMAIL}.`);
  }

  console.log(`Cuenta demo actualizada: ${DEMO_ADMIN_EMAIL}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
