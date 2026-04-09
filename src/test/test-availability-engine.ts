import prisma from "../prisma-client"

async function main() {

  await prisma.appointment.deleteMany()
  await prisma.customer.deleteMany()

  console.log("Base limpia")

}

main()