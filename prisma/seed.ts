import bcrypt from "bcryptjs";
import { PackageType, Role } from "../src/enums.js";
import { prisma } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

const packages = [
  { name: "ডেইলি প্যাক", duration: 1, price: 10, type: PackageType.INTERNET },
  { name: "সাপ্তাহিক প্যাক", duration: 7, price: 50, type: PackageType.INTERNET },
  { name: "মাসিক প্যাক", duration: 30, price: 100, type: PackageType.INTERNET },
  { name: "টিভি প্যাক", duration: 30, price: 200, type: PackageType.TV },
];

async function main() {
  console.log("Seeding database...");

  if (!env.adminPassword || !env.adminPhone) {
    throw new Error("Set ADMIN_PASSWORD and ADMIN_PHONE before seeding the admin account.");
  }

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: { duration: pkg.duration, price: pkg.price, type: pkg.type },
      create: pkg,
    });
  }

  const adminPassword = await bcrypt.hash(env.adminPassword, 12);
  await prisma.user.upsert({
    where: { phone: env.adminPhone },
    update: {
      name: env.adminName,
      email: env.adminEmail,
      password: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      name: env.adminName,
      email: env.adminEmail,
      phone: env.adminPhone,
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log("Seed completed.");
  console.log(`Admin phone: ${env.adminPhone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
