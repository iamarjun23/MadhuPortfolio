import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

declare global {
  var madhuPrisma: PrismaClient | undefined;
}

function withExplicitSslMode(databaseUrl: string) {
  return databaseUrl.replace(
    /([?&]sslmode=)(?:prefer|require|verify-ca)(?=(&|$))/i,
    "$1verify-full",
  );
}

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access content.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: withExplicitSslMode(databaseUrl) }),
  });
}

export function getDb() {
  globalThis.madhuPrisma ??= createClient();
  return globalThis.madhuPrisma;
}
