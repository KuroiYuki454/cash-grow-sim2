import { useEffect, useState } from 'react';
import { BankHeader } from '@/components/BankHeader';
import { UpgradeCard } from '@/components/UpgradeCard';
import { usePlayerAccount } from '@/hooks/usePlayerAccount';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Upgrade {
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

interface PurchasedUpgrade {
  upgrade_id: string;
  level: number;
}

const Upgrades = () => {
  const { account, loading: accountLoading, spendMoney, updateIncomeRate } = usePlayerAccount();
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpgrades() {
      const { data: upgradesData } = await supabase
        .from('upgrades')
        .select('*')
        .order('sort_order');

      if (upgradesData) {
        setUpgrades(upgradesData.map(u => ({
          ...u,
          cost: Number(u.cost),
          income_boost: Number(u.income_boost),
          cost_multiplier: Number(u.cost_multiplier),
          income_multiplier: Number(u.income_multiplier),
        })));
      }

      setLoading(false);
    }

    loadUpgrades();
  }, []);

  useEffect(() => {
    async function loadPurchased() {
      if (!account) return;

      const { data } = await supabase
        .from('purchased_upgrades')
        .select('upgrade_id, level')
        .eq('account_id', account.id);

      if (data) {
        const purchasedMap = new Map<string, number>();
        data.forEach(p => purchasedMap.set(p.upgrade_id, p.level));
        setPurchasedUpgrades(purchasedMap);
      }
    }

    loadPurchased();
  }, [account]);

  // Calculate current cost for an upgrade based on level
  const calculateCost = (upgrade: Upgrade, level: number) => {
    if (level === 0) return upgrade.cost;
    return upgrade.cost * Math.pow(upgrade.cost_multiplier, level);
  };

  // Calculate income boost for upgrading to next level
  const calculateIncomeBoost = (upgrade: Upgrade, currentLevel: number) => {
    if (currentLevel === 0) return upgrade.income_boost;
    return upgrade.income_boost * Math.pow(upgrade.income_multiplier, currentLevel);
  };

  const handleUpgrade = async (upgrade: Upgrade) => {
    if (!account) return;

    const currentLevel = purchasedUpgrades.get(upgrade.id) || 0;
    const upgradeCost = calculateCost(upgrade, currentLevel);
    const incomeBoost = calculateIncomeBoost(upgrade, currentLevel);

    const success = await spendMoney(upgradeCost);
    if (!success) {
      toast.error('Fonds insuffisants');
      return;
    }

    if (currentLevel === 0) {
      // First purchase - insert new record
      const { error } = await supabase
        .from('purchased_upgrades')
        .insert({
          account_id: account.id,
          upgrade_id: upgrade.id,
          level: 1,
        });

      if (error) {
        toast.error('Erreur lors de l\'achat');
        return;
      }
    } else {
      // Upgrade existing - update level
      const { error } = await supabase
        .from('purchased_upgrades')
        .update({ level: currentLevel + 1 })
        .eq('account_id', account.id)
        .eq('upgrade_id', upgrade.id);

      if (error) {
        toast.error('Erreur lors de l\'amélioration');
        return;
      }
    }

    // Update income rate
    const newRate = account.income_per_second + incomeBoost;
    await updateIncomeRate(newRate);

    setPurchasedUpgrades(prev => new Map(prev).set(upgrade.id, currentLevel + 1));
    
    const newLevel = currentLevel + 1;
    toast.success(
      `${upgrade.name} niveau ${newLevel} ! +${formatCurrency(incomeBoost)}/sec`
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading || accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des améliorations...</p>
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
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-money flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Améliorations</h1>
          </div>
          <p className="text-muted-foreground">
            Investissez pour augmenter vos revenus passifs
          </p>
        </div>

        {/* Current Balance Banner */}
        <div className="card-banking mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="font-display text-2xl font-bold text-primary">
              {formatCurrency(account.balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Revenu actuel</p>
            <p className="font-medium text-foreground">
              +{formatCurrency(account.income_per_second)}/sec
            </p>
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {upgrades.map(upgrade => {
            const currentLevel = purchasedUpgrades.get(upgrade.id) || 0;
            const currentCost = calculateCost(upgrade, currentLevel);
            const currentIncomeBoost = calculateIncomeBoost(upgrade, currentLevel);
            
            return (
              <UpgradeCard
                key={upgrade.id}
                id={upgrade.id}
                name={upgrade.name}
                description={upgrade.description}
                cost={currentCost}
                incomeBoost={currentIncomeBoost}
                icon={upgrade.icon}
                level={currentLevel}
                canAfford={account.balance >= currentCost}
                onUpgrade={() => handleUpgrade(upgrade)}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Upgrades;