import { useEffect, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

interface BalanceDisplayProps {
  balance: number;
  incomePerSecond: number;
  multiplier?: number;
}

export function BalanceDisplay({ balance, incomePerSecond, multiplier = 1 }: BalanceDisplayProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setDisplayBalance(balance);
    setIsAnimating(true);
    const timeout = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(timeout);
  }, [balance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatIncome = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const getMultiplierColor = () => {
    if (multiplier >= 100) return 'text-purple-400';
    if (multiplier >= 10) return 'text-yellow-400';
    if (multiplier >= 4) return 'text-orange-400';
    if (multiplier >= 2) return 'text-green-400';
    if (multiplier < 1) return 'text-red-400';
    return 'text-primary';
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main Balance */}
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Solde disponible
        </p>
        <div 
          className={`transition-transform duration-200 ${isAnimating ? 'animate-counter-tick' : ''}`}
        >
          <span className="font-display text-5xl md:text-7xl font-bold text-primary glow-money">
            {formatCurrency(displayBalance)}
          </span>
        </div>
      </div>

      {/* Income Rate with multiplier */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          +{formatIncome(incomePerSecond)}/sec
        </span>
        {multiplier !== 1 && (
          <span className={`flex items-center gap-1 text-sm font-bold ${getMultiplierColor()}`}>
            <Zap className="w-3 h-3" />
            x{multiplier}
          </span>
        )}
      </div>
    </div>
  );
}
