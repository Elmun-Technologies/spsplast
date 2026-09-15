import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // High traffic: connection pooling via DATABASE_URL (PgBouncer) + limit
  });
}

/*
 * Lazy client.
 *
 * `new PrismaClient()` throws when the generated client is missing (e.g. a
 * cached node_modules on Vercel where `prisma generate` did not run, or a
 * local checkout without DATABASE_URL). Creating it at module scope therefore
 * took down every route that transitively imports `db` — including the locale
 * layout through the header — with a hard 500 before any try/catch could run.
 *
 * With the proxy the client is only constructed on first property access, so
 * a broken Prisma setup degrades to "these queries fail" instead of "the whole
 * storefront is down".
 */
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in getPrismaClient();
  },
}) as PrismaClient;

// Graceful shutdown for high traffic
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect();
    }
  });
}
