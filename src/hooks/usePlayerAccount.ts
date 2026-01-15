import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ACCOUNT_STORAGE_KEY = 'player_account_id';

interface PlayerAccount {
  id: string;
  balance: number;
  income_per_second: number;
  last_updated_at: string;
}

export function usePlayerAccount(incomeMultiplier: number = 1) {
  const [account, setAccount] = useState<PlayerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Load or create account
  useEffect(() => {
    async function initAccount() {
      const storedId = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      
      if (storedId) {
        // Try to load existing account
        const { data, error } = await supabase
          .from('player_accounts')
          .select('*')
          .eq('id', storedId)
          .maybeSingle();
        
        if (data && !error) {
          // Calculate accumulated earnings since last update
          const lastUpdate = new Date(data.last_updated_at).getTime();
          const now = Date.now();
          const secondsPassed = Math.floor((now - lastUpdate) / 1000);
          const accumulatedEarnings = secondsPassed * Number(data.income_per_second);
          
          const newBalance = Number(data.balance) + accumulatedEarnings;
          
          // Update balance in database
          await supabase
            .from('player_accounts')
            .update({ 
              balance: newBalance, 
              last_updated_at: new Date().toISOString() 
            })
            .eq('id', storedId);
          
          setAccount({
            ...data,
            balance: newBalance,
            income_per_second: Number(data.income_per_second),
          });
          setLoading(false);
          return;
        }
      }
      
      // Create new account
      const { data, error } = await supabase
        .from('player_accounts')
        .insert({})
        .select()
        .single();
      
      if (data && !error) {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, data.id);
        setAccount({
          ...data,
          balance: Number(data.balance),
          income_per_second: Number(data.income_per_second),
        });
      }
      
      setLoading(false);
    }
    
    initAccount();
  }, []);

  // Auto-increment balance every second with multiplier
  useEffect(() => {
    if (!account) return;
    
    const interval = setInterval(() => {
      setAccount(prev => {
        if (!prev) return prev;
        const effectiveIncome = prev.income_per_second * incomeMultiplier;
        return {
          ...prev,
          balance: prev.balance + effectiveIncome,
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [account?.income_per_second, incomeMultiplier]);

  // Sync to database every 10 seconds
  useEffect(() => {
    if (!account) return;
    
    const syncInterval = setInterval(async () => {
      await supabase
        .from('player_accounts')
        .update({ 
          balance: account.balance, 
          last_updated_at: new Date().toISOString() 
        })
        .eq('id', account.id);
    }, 10000);
    
    return () => clearInterval(syncInterval);
  }, [account]);

  const updateIncomeRate = useCallback(async (newRate: number) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('player_accounts')
      .update({ income_per_second: newRate })
      .eq('id', account.id);
    
    if (!error) {
      setAccount(prev => prev ? { ...prev, income_per_second: newRate } : prev);
    }
  }, [account]);

  const spendMoney = useCallback(async (amount: number) => {
    if (!account || account.balance < amount) return false;
    
    const newBalance = account.balance - amount;
    
    const { error } = await supabase
      .from('player_accounts')
      .update({ balance: newBalance })
      .eq('id', account.id);
    
    if (!error) {
      setAccount(prev => prev ? { ...prev, balance: newBalance } : prev);
      return true;
    }
    
    return false;
  }, [account]);

  // Calculate effective income with multiplier
  const effectiveIncomePerSecond = account ? account.income_per_second * incomeMultiplier : 0;

  return {
    account,
    loading,
    updateIncomeRate,
    spendMoney,
    effectiveIncomePerSecond,
  };
}
