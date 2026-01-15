// Client API pour communiquer avec le backend Prisma

const API_BASE = 'http://localhost:3001/api';

export interface PlayerAccount {
    id: string;
    email: string;
    balance: number;
    income_per_second: number;
    last_updated_at: string;
    created_at?: string;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    income_boost: number;
    icon: string;
    sort_order: number;
    cost_multiplier: number;
    income_multiplier: number;
}

export interface PurchasedUpgrade {
    id: string;
    account_id: string;
    upgrade_id: string;
    level: number;
    created_at: string;
    updated_at: string;
}

export interface RandomEventState {
    account_id: string;
    active_event_id: string | null;
    multiplier: number;
    started_at: string | null;
    ends_at: string | null;
    next_event_at: string | null;
}

export interface AuthResponse {
    token: string;
    user: PlayerAccount;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials { }

// API functions
export const api = {
    // Account functions
    async getAccount(id: string): Promise<PlayerAccount | null> {
        const response = await fetch(`${API_BASE}/account/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data ? {
            ...data,
            balance: parseFloat(data.balance),
            income_per_second: parseFloat(data.income_per_second)
        } : null;
    },

    async createAccount(data: Partial<PlayerAccount>): Promise<PlayerAccount> {
        const response = await fetch(`${API_BASE}/account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return {
            ...result,
            balance: parseFloat(result.balance),
            income_per_second: parseFloat(result.income_per_second)
        };
    },

    async updateAccount(id: string, data: Partial<PlayerAccount>): Promise<PlayerAccount> {
        const response = await fetch(`${API_BASE}/account/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return {
            ...result,
            balance: parseFloat(result.balance),
            income_per_second: parseFloat(result.income_per_second)
        };
    },

    // Upgrades functions
    async getUpgrades(): Promise<Upgrade[]> {
        const response = await fetch(`${API_BASE}/upgrades`);
        const data = await response.json();
        return data.map((upgrade: any) => ({
            ...upgrade,
            cost: parseFloat(upgrade.cost),
            income_boost: parseFloat(upgrade.income_boost),
            cost_multiplier: parseFloat(upgrade.cost_multiplier),
            income_multiplier: parseFloat(upgrade.income_multiplier)
        }));
    },

    async getPurchasedUpgrades(accountId: string): Promise<PurchasedUpgrade[]> {
        const response = await fetch(`${API_BASE}/purchased-upgrades/${accountId}`);
        const data = await response.json();
        return data.map((upgrade: any) => ({
            ...upgrade,
            level: parseInt(upgrade.level)
        }));
    },

    async createPurchasedUpgrade(data: Partial<PurchasedUpgrade>): Promise<PurchasedUpgrade> {
        const response = await fetch(`${API_BASE}/purchased-upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updatePurchasedUpgrade(data: { account_id: string; upgrade_id: string; level: number }): Promise<any> {
        const response = await fetch(`${API_BASE}/purchased-upgrade`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Random event state (persisted)
    async getRandomEventState(accountId: string): Promise<RandomEventState | null> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/random-event-state/${accountId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });

        if (!response.ok) return null;
        return response.json();
    },

    async upsertRandomEventState(accountId: string, data: Omit<RandomEventState, 'account_id'>): Promise<RandomEventState> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/random-event-state/${accountId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Erreur lors de la sauvegarde de l\'événement');
        }

        return response.json();
    },

    // Auth functions
    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de l\'inscription');
        }

        const result = await response.json();
        return {
            ...result,
            user: {
                ...result.user,
                balance: parseFloat(result.user.balance),
                income_per_second: parseFloat(result.user.income_per_second)
            }
        };
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la connexion');
        }

        const result = await response.json();
        return {
            ...result,
            user: {
                ...result.user,
                balance: parseFloat(result.user.balance),
                income_per_second: parseFloat(result.user.income_per_second)
            }
        };
    },

    async getProfile(token: string): Promise<PlayerAccount> {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du profil');
        }

        const data = await response.json();
        return {
            ...data,
            balance: parseFloat(data.balance),
            income_per_second: parseFloat(data.income_per_second)
        };
    }
};
