import { prisma } from '../../src/lib/prisma-client'

export async function seedUpgrades() {
    const upgrades = [
        {
            id: 'lemonade_stand',
            name: 'Stand de Limonade',
            description: 'Un petit stand qui génère des revenus passifs',
            cost: 10.00,
            income_boost: 0.10,
            icon: '🍋',
            sort_order: 1,
            cost_multiplier: 1.15,
            income_multiplier: 1.20
        },
        {
            id: 'food_truck',
            name: 'Food Truck',
            description: 'Un camion de restauration rapide',
            cost: 100.00,
            income_boost: 1.00,
            icon: '🚚',
            sort_order: 2,
            cost_multiplier: 1.20,
            income_multiplier: 1.30
        },
        {
            id: 'coffee_shop',
            name: 'Café',
            description: 'Un café de quartier populaire',
            cost: 500.00,
            income_boost: 5.00,
            icon: '☕',
            sort_order: 3,
            cost_multiplier: 1.25,
            income_multiplier: 1.40
        },
        {
            id: 'restaurant',
            name: 'Restaurant',
            description: 'Un restaurant gastronomique',
            cost: 2000.00,
            income_boost: 20.00,
            icon: '🍽️',
            sort_order: 4,
            cost_multiplier: 1.30,
            income_multiplier: 1.50
        },
        {
            id: 'hotel',
            name: 'Hôtel',
            description: 'Un hôtel de luxe en centre-ville',
            cost: 10000.00,
            income_boost: 100.00,
            icon: '🏨',
            sort_order: 5,
            cost_multiplier: 1.35,
            income_multiplier: 1.60
        }
    ]

    for (const upgrade of upgrades) {
        await prisma.upgrade.upsert({
            where: { id: upgrade.id },
            update: upgrade,
            create: upgrade
        })
    }

    console.log('Upgrades seeded successfully!')
}

seedUpgrades()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
