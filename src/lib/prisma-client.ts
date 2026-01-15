import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

// Ces variables doivent être définies dans l'environnement de build
const adapter = new PrismaMariaDb({
    host: '127.0.0.1',
    user: 'noelson',
    password: 'noelson',
    database: 'noelson',
    connectionLimit: 5
});

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
