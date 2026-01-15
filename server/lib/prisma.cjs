const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'noelson',
    password: process.env.DATABASE_PASSWORD || 'noelson',
    database: process.env.DATABASE_NAME || 'noelson',
    connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
