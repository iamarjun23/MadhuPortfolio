import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

declare global {
  var madhuPrisma: PrismaClient | undefined;
}

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access content.");
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

export function getDb() {
  globalThis.madhuPrisma ??= createClient();
  return globalThis.madhuPrisma;
}
