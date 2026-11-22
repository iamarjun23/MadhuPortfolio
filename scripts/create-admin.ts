import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma-node/client";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../src/lib/credential-limits";
import { hashPassword } from "../src/lib/password";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const plainPassword = process.env.ADMIN_PASSWORD;
if (!databaseUrl || !email || !plainPassword)
  throw new Error("DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required.");
// Same bounds as the Studio's change-password form.
if (plainPassword.length < MIN_PASSWORD_LENGTH || plainPassword.length > MAX_PASSWORD_LENGTH)
  throw new Error(
    `ADMIN_PASSWORD must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`,
  );
const password = await hashPassword(plainPassword);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
await db.user.upsert({
  where: { email },
  create: { email, password, role: Role.OWNER },
  update: { password, role: Role.OWNER },
});
// A reset password ends every existing Studio session, as a change in the Studio does.
await db.session.deleteMany({ where: { user: { email } } });
await db.$disconnect();
