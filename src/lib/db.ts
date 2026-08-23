import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // High traffic: connection pooling via DATABASE_URL (PgBouncer) + limit
  });
}

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Graceful shutdown for high traffic
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect();
  });
}
