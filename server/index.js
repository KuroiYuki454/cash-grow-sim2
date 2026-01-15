const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('./prisma/generated/prisma/client.js');

const crypto = require('crypto');

const adapter = new PrismaMariaDb({
    host: '127.0.0.1',
    user: 'noelson',
    password: 'noelson',
    database: 'noelson',
    connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = 3001;
const JWT_SECRET = 'votre-super-cle-secrete-123456789'; // À changer en production

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requis' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

const VIRTUAL_OFFER_LIFETIME_MS = 20 * 1000;
const VIRTUAL_OFFER_COOLDOWN_MS = 30 * 1000;

const randomFloat = (min, max) => {
    return Math.random() * (max - min) + min;
};

const round2 = (value) => {
    return Math.round(value * 100) / 100;
};

const generateVirtualOffer = () => {
    const tiers = [
        { id: 'small', weight: 55, minBoost: 0.5, maxBoost: 5, costMin: 25, costMax: 120 },
        { id: 'medium', weight: 30, minBoost: 5, maxBoost: 50, costMin: 80, costMax: 220 },
        { id: 'large', weight: 12, minBoost: 50, maxBoost: 300, costMin: 150, costMax: 320 },
        { id: 'legendary', weight: 3, minBoost: 300, maxBoost: 1500, costMin: 250, costMax: 450 },
    ];

    const totalWeight = tiers.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * totalWeight;
    let tier = tiers[0];
    for (const t of tiers) {
        r -= t.weight;
        if (r <= 0) {
            tier = t;
            break;
        }
    }

    const incomeBoostRaw = randomFloat(tier.minBoost, tier.maxBoost);
    const incomeBoost = round2(incomeBoostRaw);
    const cost = round2(Math.max(10, incomeBoost * randomFloat(tier.costMin, tier.costMax)));

    const names = [
        'Machine à café autonome',
        'Distributeur intelligent',
        'Stand premium',
        'Mini-atelier',
        'Robot vendeur',
        'Kiosque automatique',
    ];

    const name = names[Math.floor(Math.random() * names.length)];

    return {
        offer_id: crypto.randomUUID(),
        offer_name: name,
        offer_cost: cost,
        offer_income_boost: incomeBoost,
    };
};

// Routes pour les comptes joueurs
app.get('/api/account/:id', async (req, res) => {
    try {
        const account = await prisma.playerAccount.findUnique({
            where: { id: req.params.id }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

app.post('/api/account', async (req, res) => {
    try {
        const account = await prisma.playerAccount.create({
            data: req.body
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

app.put('/api/account/:id', async (req, res) => {
    try {
        const account = await prisma.playerAccount.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                last_updated_at: req.body.last_updated_at ? new Date(req.body.last_updated_at) : new Date()
            }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// Routes pour les améliorations
app.get('/api/upgrades', async (req, res) => {
    try {
        const upgrades = await prisma.upgrade.findMany({
            orderBy: { sort_order: 'asc' }
        });
        res.json(upgrades);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch upgrades' });
    }
});

// Routes pour les améliorations achetées
app.get('/api/purchased-upgrades/:accountId', async (req, res) => {
    try {
        const purchased = await prisma.purchasedUpgrade.findMany({
            where: { account_id: req.params.accountId }
        });
        res.json(purchased);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchased upgrades' });
    }
});

app.post('/api/purchased-upgrade', async (req, res) => {
    try {
        const purchased = await prisma.purchasedUpgrade.create({
            data: req.body
        });
        res.json(purchased);
    } catch (error) {
        res.status(500).json({ error: 'Failed to purchase upgrade' });
    }
});

app.put('/api/purchased-upgrade', async (req, res) => {
    try {
        const { account_id, upgrade_id, level } = req.body;
        const purchased = await prisma.purchasedUpgrade.updateMany({
            where: {
                account_id,
                upgrade_id
            },
            data: { level }
        });
        res.json(purchased);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update purchased upgrade' });
    }
});

// Compte virtuel + offres temporaires
app.get('/api/virtual-account/:accountId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const virtual = await prisma.virtualAccount.upsert({
            where: { account_id: req.params.accountId },
            create: { account_id: req.params.accountId, balance: 0 },
            update: {}
        });

        res.json(virtual);
    } catch (error) {
        console.error('Virtual account get error:', error);
        res.status(500).json({ error: 'Failed to fetch virtual account' });
    }
});

app.post('/api/virtual-account/:accountId/transfer', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const amount = Number(req.body?.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Montant invalide' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.playerAccount.findUnique({ where: { id: req.params.accountId } });
            if (!account) throw new Error('Account not found');

            if (account.balance < amount) {
                return { ok: false, error: 'Fonds insuffisants' };
            }

            const updatedAccount = await tx.playerAccount.update({
                where: { id: req.params.accountId },
                data: {
                    balance: account.balance - amount,
                    last_updated_at: new Date(),
                }
            });

            const virtual = await tx.virtualAccount.upsert({
                where: { account_id: req.params.accountId },
                create: { account_id: req.params.accountId, balance: amount },
                update: { balance: { increment: amount } }
            });

            return { ok: true, account: updatedAccount, virtual };
        });

        if (!result.ok) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ account: result.account, virtual: result.virtual });
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ error: 'Failed to transfer funds' });
    }
});

app.get('/api/virtual-offer/:accountId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const now = new Date();
        const state = await prisma.virtualOfferState.upsert({
            where: { account_id: req.params.accountId },
            create: { account_id: req.params.accountId },
            update: {}
        });

        const expiresAt = state.expires_at ? new Date(state.expires_at) : null;
        const nextOfferAt = state.next_offer_at ? new Date(state.next_offer_at) : null;
        const hasActiveOffer = state.offer_id && expiresAt && now < expiresAt;

        if (hasActiveOffer) {
            return res.json({
                offer: {
                    id: state.offer_id,
                    name: state.offer_name,
                    cost: state.offer_cost,
                    income_boost: state.offer_income_boost,
                    spawned_at: state.offer_spawned_at,
                    expires_at: state.expires_at,
                    purchased_at: state.purchased_at,
                },
                next_offer_at: state.next_offer_at,
            });
        }

        if (nextOfferAt && now < nextOfferAt) {
            return res.json({ offer: null, next_offer_at: state.next_offer_at });
        }

        const offer = generateVirtualOffer();
        const spawnedAt = now;
        const newExpiresAt = new Date(spawnedAt.getTime() + VIRTUAL_OFFER_LIFETIME_MS);
        const newNextOfferAt = new Date(newExpiresAt.getTime() + VIRTUAL_OFFER_COOLDOWN_MS);

        const updated = await prisma.virtualOfferState.update({
            where: { account_id: req.params.accountId },
            data: {
                offer_id: offer.offer_id,
                offer_name: offer.offer_name,
                offer_cost: offer.offer_cost,
                offer_income_boost: offer.offer_income_boost,
                offer_spawned_at: spawnedAt,
                expires_at: newExpiresAt,
                next_offer_at: newNextOfferAt,
                purchased_at: null,
            }
        });

        return res.json({
            offer: {
                id: updated.offer_id,
                name: updated.offer_name,
                cost: updated.offer_cost,
                income_boost: updated.offer_income_boost,
                spawned_at: updated.offer_spawned_at,
                expires_at: updated.expires_at,
                purchased_at: updated.purchased_at,
            },
            next_offer_at: updated.next_offer_at,
        });
    } catch (error) {
        console.error('Virtual offer get error:', error);
        res.status(500).json({ error: 'Failed to fetch virtual offer' });
    }
});

app.post('/api/virtual-offer/:accountId/purchase', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const state = await tx.virtualOfferState.findUnique({ where: { account_id: req.params.accountId } });
            if (!state || !state.offer_id || !state.expires_at) {
                return { ok: false, error: 'Aucune offre active' };
            }

            const expiresAt = new Date(state.expires_at);
            if (now >= expiresAt) {
                return { ok: false, error: 'Offre expirée' };
            }

            if (state.purchased_at) {
                return { ok: false, error: 'Offre déjà achetée' };
            }

            const cost = Number(state.offer_cost);
            const incomeBoost = Number(state.offer_income_boost);
            if (!Number.isFinite(cost) || !Number.isFinite(incomeBoost)) {
                return { ok: false, error: 'Offre invalide' };
            }

            const virtual = await tx.virtualAccount.upsert({
                where: { account_id: req.params.accountId },
                create: { account_id: req.params.accountId, balance: 0 },
                update: {}
            });

            if (virtual.balance < cost) {
                return { ok: false, error: 'Solde virtuel insuffisant' };
            }

            const updatedVirtual = await tx.virtualAccount.update({
                where: { account_id: req.params.accountId },
                data: { balance: virtual.balance - cost }
            });

            const updatedAccount = await tx.playerAccount.update({
                where: { id: req.params.accountId },
                data: {
                    income_per_second: { increment: incomeBoost },
                    last_updated_at: now,
                }
            });

            await tx.virtualPurchase.create({
                data: {
                    account_id: req.params.accountId,
                    offer_id: state.offer_id,
                    offer_name: state.offer_name || 'Offre',
                    cost,
                    income_boost: incomeBoost,
                }
            });

            await tx.virtualOfferState.update({
                where: { account_id: req.params.accountId },
                data: { purchased_at: now }
            });

            return { ok: true, virtual: updatedVirtual, account: updatedAccount };
        });

        if (!result.ok) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ virtual: result.virtual, account: result.account });
    } catch (error) {
        console.error('Virtual offer purchase error:', error);
        res.status(500).json({ error: 'Failed to purchase offer' });
    }
});

app.get('/api/virtual-purchases/:accountId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const purchases = await prisma.virtualPurchase.findMany({
            where: { account_id: req.params.accountId },
            orderBy: { purchased_at: 'desc' }
        });

        res.json(purchases);
    } catch (error) {
        console.error('Virtual purchases get error:', error);
        res.status(500).json({ error: 'Failed to fetch virtual purchases' });
    }
});

// Routes pour l'état des événements aléatoires (persisté)
app.get('/api/random-event-state/:accountId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const state = await prisma.randomEventState.findUnique({
            where: { account_id: req.params.accountId }
        });

        if (!state) return res.json(null);

        res.json({
            account_id: state.account_id,
            active_event_id: state.active_event_id,
            multiplier: state.multiplier,
            started_at: state.started_at,
            ends_at: state.ends_at,
            next_event_at: state.next_event_at
        });
    } catch (error) {
        console.error('Random event state get error:', error);
        res.status(500).json({ error: 'Failed to fetch random event state' });
    }
});

app.put('/api/random-event-state/:accountId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId !== req.params.accountId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { active_event_id, multiplier, started_at, ends_at, next_event_at } = req.body;

        const state = await prisma.randomEventState.upsert({
            where: { account_id: req.params.accountId },
            create: {
                account_id: req.params.accountId,
                active_event_id: active_event_id ?? null,
                multiplier: typeof multiplier === 'number' ? multiplier : 1,
                started_at: started_at ? new Date(started_at) : null,
                ends_at: ends_at ? new Date(ends_at) : null,
                next_event_at: next_event_at ? new Date(next_event_at) : null,
            },
            update: {
                active_event_id: active_event_id ?? null,
                multiplier: typeof multiplier === 'number' ? multiplier : 1,
                started_at: started_at ? new Date(started_at) : null,
                ends_at: ends_at ? new Date(ends_at) : null,
                next_event_at: next_event_at ? new Date(next_event_at) : null,
            }
        });

        res.json({
            account_id: state.account_id,
            active_event_id: state.active_event_id,
            multiplier: state.multiplier,
            started_at: state.started_at,
            ends_at: state.ends_at,
            next_event_at: state.next_event_at
        });
    } catch (error) {
        console.error('Random event state upsert error:', error);
        res.status(500).json({ error: 'Failed to save random event state' });
    }
});

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Vérifier si l'email existe déjà
        const existingAccount = await prisma.playerAccount.findUnique({
            where: { email }
        });

        if (existingAccount) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        // Créer le compte
        const account = await prisma.playerAccount.create({
            data: {
                email,
                password_hash: passwordHash,
                balance: 0,
                income_per_second: 0
            }
        });

        // Créer le token JWT
        const token = jwt.sign(
            { userId: account.id, email: account.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: account.id,
                email: account.email,
                balance: account.balance,
                income_per_second: account.income_per_second,
                last_updated_at: account.last_updated_at,
                created_at: account.created_at
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Trouver le compte
        const account = await prisma.playerAccount.findUnique({
            where: { email }
        });

        if (!account) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, account.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { userId: account.id, email: account.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: account.id,
                email: account.email,
                balance: account.balance,
                income_per_second: account.income_per_second,
                last_updated_at: account.last_updated_at,
                created_at: account.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const account = await prisma.playerAccount.findUnique({
            where: { id: req.user.userId }
        });

        if (!account) {
            return res.status(404).json({ error: 'Compte non trouvé' });
        }

        res.json({
            id: account.id,
            email: account.email,
            balance: account.balance,
            income_per_second: account.income_per_second,
            created_at: account.created_at
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
