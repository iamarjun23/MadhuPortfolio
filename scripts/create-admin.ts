import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD_HASH;
if (!databaseUrl || !email || !password)
  throw new Error("DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD_HASH are required.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
await db.user.upsert({
  where: { email },
  create: { email, password, role: Role.OWNER },
  update: { password, role: Role.OWNER },
});
await db.$disconnect();
