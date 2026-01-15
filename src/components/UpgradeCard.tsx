import { 
  PiggyBank, 
  TrendingUp, 
  Building, 
  Cpu, 
  Rocket, 
  BarChart, 
  Crown,
  ArrowUp,
  Lock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeCardProps {
  id: string;
  name: string;
  description: string;
  cost: number;
  incomeBoost: number;
  icon: string;
  level: number;
  canAfford: boolean;
  onUpgrade: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'building': Building,
  'cpu': Cpu,
  'rocket': Rocket,
  'bar-chart': BarChart,
  'crown': Crown,
};

export function UpgradeCard({
  name,
  description,
  cost,
  incomeBoost,
  icon,
  level,
  canAfford,
  onUpgrade,
}: UpgradeCardProps) {
  const IconComponent = iconMap[icon] || TrendingUp;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isOwned = level > 0;

  return (
    <div 
      className={`card-banking relative overflow-hidden transition-all duration-300 ${
        isOwned 
          ? 'border border-primary/30 bg-primary/5' 
          : canAfford 
            ? 'hover:border-primary/50 border border-transparent' 
            : 'opacity-60 border border-transparent'
      }`}
    >
      {/* Level Badge */}
      {isOwned && (
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Niv. {level}
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isOwned ? 'gradient-money' : 'bg-secondary'
        }`}>
          <IconComponent className={`w-6 h-6 ${isOwned ? 'text-primary-foreground' : 'text-foreground'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="font-display font-semibold text-lg mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-primary font-medium">
              +{formatCurrency(incomeBoost)}/sec
            </span>
            <span className="text-muted-foreground">
              Coût: {formatCurrency(cost)}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade Button */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          onClick={onUpgrade}
          disabled={!canAfford}
          className="w-full"
          variant={canAfford ? "default" : "secondary"}
        >
          {canAfford ? (
            <>
              <ArrowUp className="w-4 h-4 mr-2" />
              {isOwned ? `Améliorer au niveau ${level + 1}` : 'Acheter'}
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Fonds insuffisants
            </>
          )}
        </Button>
      </div>
    </div>
  );
}