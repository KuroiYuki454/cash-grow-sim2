import { BankHeader } from '@/components/BankHeader';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { RandomEventBanner } from '@/components/RandomEventBanner';
import { usePlayerAccount } from '@/hooks/usePlayerAccount';
import { useRandomEventState } from '@/hooks/useRandomEventState';
import { ArrowUpRight, CreditCard, Loader2, Sparkles, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { activeEvent, timeRemaining, nextEventIn, multiplier } = useRandomEventState();
  const { account, loading, effectiveIncomePerSecond } = usePlayerAccount(multiplier);

  const formatCompactEuro = (amount: number) => {
    const safe = Number.isFinite(amount) ? amount : 0;
    const abs = Math.abs(safe);

    if (abs < 1000) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safe);
    }

    const units = [
      { value: 1e12, suffix: 'Bn' },
      { value: 1e9, suffix: 'Md' },
      { value: 1e6, suffix: 'M' },
      { value: 1e3, suffix: 'K' },
    ];

    const unit = units.find(u => abs >= u.value) ?? units[units.length - 1];
    const scaled = safe / unit.value;

    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2,
    }).format(scaled);

    return `${formatted} ${unit.suffix} €`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Connexion à votre compte...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Erreur de connexion au compte</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BankHeader />
      
      <main className="container py-8 md:py-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Tableau de bord</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Compte principal</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground">
              IBAN: <span className="text-foreground font-medium">FR76 •••• •••• •••• 1234</span>
            </div>
          </div>
        </div>

        {/* Random Event Banner */}
        <div className="mb-6">
          <RandomEventBanner 
            activeEvent={activeEvent}
            timeRemaining={timeRemaining}
            nextEventIn={nextEventIn}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="card-banking relative overflow-hidden text-left">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 gradient-money" />
              <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-primary/5 blur-3xl" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl gradient-money flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solde disponible</p>
                      <p className="text-xs text-muted-foreground">Mise à jour en temps réel</p>
                    </div>
                  </div>
                  <Link
                    to="/upgrades"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/70 border border-border transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Améliorer</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>

                <div className="mt-6">
                  <BalanceDisplay 
                    balance={account.balance} 
                    incomePerSecond={effectiveIncomePerSecond}
                    multiplier={multiplier}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-banking">
                <p className="text-sm text-muted-foreground mb-1">Revenu / minute</p>
                <p className="font-display font-semibold text-xl text-foreground">
                  {formatCompactEuro(effectiveIncomePerSecond * 60)}
                </p>
              </div>
              <div className="card-banking">
                <p className="text-sm text-muted-foreground mb-1">Revenu / heure</p>
                <p className="font-display font-semibold text-xl text-foreground">
                  {formatCompactEuro(effectiveIncomePerSecond * 3600)}
                </p>
              </div>
              <div className="card-banking">
                <p className="text-sm text-muted-foreground mb-1">Multiplicateur</p>
                <p className="font-display font-semibold text-xl text-foreground">
                  x{multiplier}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-banking text-left">
              <p className="text-sm text-muted-foreground mb-4">Actions rapides</p>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/upgrades"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Améliorations</p>
                      <p className="text-xs text-muted-foreground">Augmenter le revenu</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/virtual"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Carte virtuelle</p>
                      <p className="text-xs text-muted-foreground">Transferts & offres temporaires</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            <div className="card-banking text-left">
              <p className="text-sm text-muted-foreground mb-4">Activité récente</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Revenus passifs</p>
                    <p className="text-xs text-muted-foreground">Chaque seconde</p>
                  </div>
                  <p className="text-sm text-primary font-semibold">+{formatCompactEuro(effectiveIncomePerSecond)}</p>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Événement</p>
                    <p className="text-xs text-muted-foreground">Impact sur le revenu</p>
                  </div>
                  <p className="text-sm text-foreground font-semibold">x{multiplier}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
