import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export { PrismaClient };
export default getPrismaClient();
