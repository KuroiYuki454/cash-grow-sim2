const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('./prisma/generated/prisma/client.js');

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
