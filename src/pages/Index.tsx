import { BankHeader } from '@/components/BankHeader';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { RandomEventBanner } from '@/components/RandomEventBanner';
import { usePlayerAccount } from '@/hooks/usePlayerAccount';
import { useRandomEvent } from '@/hooks/useRandomEvent';
import { Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { activeEvent, timeRemaining, nextEventIn, multiplier } = useRandomEvent();
  const { account, loading, effectiveIncomePerSecond } = usePlayerAccount(multiplier);

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
      
      <main className="container py-8 md:py-16">
        {/* Random Event Banner */}
        <div className="max-w-2xl mx-auto mb-6">
          <RandomEventBanner 
            activeEvent={activeEvent}
            timeRemaining={timeRemaining}
            nextEventIn={nextEventIn}
          />
        </div>

        {/* Balance Card */}
        <div className="max-w-2xl mx-auto">
          <div className="card-banking text-center py-12 md:py-20 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 gradient-money" />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
            
            {/* Content */}
            <div className="relative z-10">
              <BalanceDisplay 
                balance={account.balance} 
                incomePerSecond={effectiveIncomePerSecond}
                multiplier={multiplier}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="card-banking">
              <p className="text-sm text-muted-foreground mb-1">Revenu par minute</p>
              <p className="font-display font-semibold text-xl text-foreground">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(effectiveIncomePerSecond * 60)}
              </p>
            </div>
            <div className="card-banking">
              <p className="text-sm text-muted-foreground mb-1">Revenu par heure</p>
              <p className="font-display font-semibold text-xl text-foreground">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(effectiveIncomePerSecond * 3600)}
              </p>
            </div>
          </div>

          {/* CTA to Upgrades */}
          <Link 
            to="/upgrades"
            className="mt-6 card-banking flex items-center justify-between group hover:border-primary/50 transition-colors border border-transparent cursor-pointer block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Augmenter vos revenus</p>
                <p className="text-sm text-muted-foreground">Découvrir les améliorations</p>
              </div>
            </div>
            <svg 
              className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
