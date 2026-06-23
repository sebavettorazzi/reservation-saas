/* eslint-disable @typescript-eslint/no-require-imports */

require("dotenv/config");

const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: "dosdeabril@test.com" },
    data: { passwordHash: hashPassword("test1234") },
  });

  if (result.count !== 1) {
    throw new Error("No se encontró la cuenta demo de 2 de Abril.");
  }

  console.log("Cuenta demo actualizada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
