const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('../prisma/generated/prisma/client.js');

const adapter = new PrismaMariaDb({
    host: '127.0.0.1',
    user: 'noelson',
    password: 'noelson',
    database: 'noelson',
    connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const BALANCED_BY_SORT_ORDER = {
    1: { cost: 100, income_boost: 1 },
    2: { cost: 500, income_boost: 3 },
    3: { cost: 2500, income_boost: 10 },
    4: { cost: 10000, income_boost: 30 },
    5: { cost: 50000, income_boost: 100 },
    6: { cost: 250000, income_boost: 300 },
    7: { cost: 1000000, income_boost: 1000 },
};

async function main() {
    const upgrades = await prisma.upgrade.findMany({ orderBy: { sort_order: 'asc' } });

    if (!upgrades.length) {
        console.log('No upgrades found in DB. Nothing to rebalance.');
        return;
    }

    console.log(`Found ${upgrades.length} upgrades. Rebalancing...`);

    for (const up of upgrades) {
        const balanced = BALANCED_BY_SORT_ORDER[up.sort_order];
        if (!balanced) {
            console.log(`- Skipping ${up.name} (sort_order=${up.sort_order}) - no target values.`);
            continue;
        }

        await prisma.upgrade.update({
            where: { id: up.id },
            data: {
                cost: balanced.cost,
                income_boost: balanced.income_boost,
            },
        });

        console.log(
            `- Updated ${up.name} (order=${up.sort_order}) -> cost=${balanced.cost}, income_boost=${balanced.income_boost}`
        );
    }

    console.log('Rebalance done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
