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
            {formatCompactEuro(displayBalance)}
          </span>
        </div>
      </div>

      {/* Income Rate with multiplier */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          +{formatCompactEuro(incomePerSecond)}/sec
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
