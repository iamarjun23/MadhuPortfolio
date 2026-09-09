import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const plainPassword = process.env.ADMIN_PASSWORD;
if (!databaseUrl || !email || !plainPassword)
  throw new Error("DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required.");
const password = await hashPassword(plainPassword);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
await db.user.upsert({
  where: { email },
  create: { email, password, role: Role.OWNER },
  update: { password, role: Role.OWNER },
});
await db.$disconnect();
