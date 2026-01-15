import { useEffect, useMemo, useState } from 'react';
import { BankHeader } from '@/components/BankHeader';
import { usePlayerAccount } from '@/hooks/usePlayerAccount';
import { useRandomEventState } from '@/hooks/useRandomEventState';
import { api, VirtualOfferResponse } from '@/lib/api';
import { Loader2, ArrowRightLeft, Sparkles, Timer } from 'lucide-react';
import { toast } from 'sonner';

export default function VirtualCard() {
  const { multiplier } = useRandomEventState();
  const { account, loading: accountLoading, refreshAccount, effectiveIncomePerSecond, setAccountFromServer } = usePlayerAccount(multiplier);

  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  const [offer, setOffer] = useState<VirtualOfferResponse['offer']>(null);
  const [nextOfferAt, setNextOfferAt] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Array<{ id: string; offer_name: string; income_boost: number; cost: number; purchased_at: string }>>([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const offerSecondsRemaining = useMemo(() => {
    if (!offer?.expires_at) return null;
    const ms = new Date(offer.expires_at).getTime() - now;
    return Math.max(0, Math.floor(ms / 1000));
  }, [now, offer?.expires_at]);

  const cooldownSecondsRemaining = useMemo(() => {
    if (!nextOfferAt) return null;
    const ms = new Date(nextOfferAt).getTime() - now;
    return Math.max(0, Math.floor(ms / 1000));
  }, [nextOfferAt, now]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!account) return;

    const load = async () => {
      try {
        const v = await api.getVirtualAccount(account.id);
        setVirtualBalance(v.balance);

        const offerResp = await api.getVirtualOffer(account.id);
        setOffer(offerResp.offer);
        setNextOfferAt(offerResp.next_offer_at);

        const p = await api.getVirtualPurchases(account.id);
        setPurchases(p);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [account?.id]);

  useEffect(() => {
    if (!account) return;

    const poll = window.setInterval(async () => {
      try {
        const offerResp = await api.getVirtualOffer(account.id);
        setOffer(offerResp.offer);
        setNextOfferAt(offerResp.next_offer_at);
      } catch {
        // ignore
      }
    }, 2500);

    return () => window.clearInterval(poll);
  }, [account?.id]);

  const handleTransfer = async () => {
    if (!account) return;

    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setActionLoading(true);
    try {
      const result = await api.transferToVirtualAccount(account.id, amount);
      setVirtualBalance(result.virtual.balance);
      setAccountFromServer(result.account);
      setTransferAmount('');
      toast.success('Transfert effectué');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!account) return;

    setActionLoading(true);
    try {
      const result = await api.purchaseVirtualOffer(account.id);
      setVirtualBalance(result.virtual.balance);
      setAccountFromServer(result.account);
      const offerResp = await api.getVirtualOffer(account.id);
      setOffer(offerResp.offer);
      setNextOfferAt(offerResp.next_offer_at);

      const p = await api.getVirtualPurchases(account.id);
      setPurchases(p);
      toast.success('Achat effectué, revenu augmenté');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (accountLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de la carte virtuelle...</p>
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
            <p className="text-sm text-muted-foreground">Carte virtuelle</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Compte virtuel & offres</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-banking text-left">
              <p className="text-sm text-muted-foreground mb-4">Soldes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-secondary/40 border border-border p-4">
                  <p className="text-sm text-muted-foreground">Compte principal</p>
                  <p className="font-display text-2xl font-bold text-foreground">{formatCompactEuro(account.balance)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenu: +{formatCompactEuro(effectiveIncomePerSecond)}/sec</p>
                </div>
                <div className="rounded-2xl bg-secondary/40 border border-border p-4">
                  <p className="text-sm text-muted-foreground">Compte virtuel</p>
                  <p className="font-display text-2xl font-bold text-primary">{formatCompactEuro(virtualBalance)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Utilisé pour acheter les offres</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Montant à transférer"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    inputMode="decimal"
                  />
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={actionLoading}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transférer
                </button>
              </div>
            </div>

            <div className="card-banking text-left">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Offre temporaire</p>
                  <p className="text-xs text-muted-foreground">Visible 20s, nouvelle offre 30s plus tard</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  {offer ? (
                    <span>{offerSecondsRemaining ?? 0}s</span>
                  ) : (
                    <span>{cooldownSecondsRemaining ?? 0}s</span>
                  )}
                </div>
              </div>

              {offer ? (
                <div className="rounded-2xl bg-secondary/40 border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{offer.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">+{formatCompactEuro(offer.income_boost)}/sec (permanent)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Prix</p>
                      <p className="font-display text-xl font-bold text-foreground">{formatCompactEuro(offer.cost)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePurchase}
                      disabled={actionLoading || virtualBalance < offer.cost || !!offer.purchased_at}
                      className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/70 border border-border transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      {offer.purchased_at ? 'Déjà acheté' : 'Acheter'}
                    </button>
                    <div className="flex-1 text-xs text-muted-foreground flex items-center">
                      {virtualBalance < offer.cost ? 'Solde virtuel insuffisant' : 'Achat sauvegardé en base et revenu augmenté'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-secondary/30 border border-border p-5">
                  <p className="text-sm text-muted-foreground">
                    Aucune offre disponible. Prochaine offre dans {cooldownSecondsRemaining ?? 0}s.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-banking text-left">
              <p className="text-sm text-muted-foreground mb-2">Règles</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>- Transfère depuis ton compte principal vers le compte virtuel.</p>
                <p>- Achète une offre avant expiration (20s).</p>
                <p>- L'offre disparaît, mais le revenu reste (persisté).</p>
                <p>- Nouvelle offre 30s après la fin.</p>
              </div>
            </div>

            <div className="card-banking text-left">
              <p className="text-sm text-muted-foreground mb-4">Mes achats</p>
              {purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun achat pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {purchases.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.offer_name}</p>
                        <p className="text-xs text-muted-foreground">+{formatCompactEuro(p.income_boost)}/sec</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatCompactEuro(p.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
