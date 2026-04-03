// Database client placeholder - not yet wired into the API
// Prisma 7 requires a database adapter (e.g., @prisma/adapter-pg)
// This module exists to allow the build to pass until DB integration is complete

export type PrismaClient = never;

export function getPrismaClient(): never {
  throw new Error('Database not configured. Install a Prisma adapter and set DATABASE_URL.')
}

export const prisma = getPrismaClient();

export default prisma;
