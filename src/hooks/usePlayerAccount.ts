import { useState, useEffect, useCallback } from 'react';
import { api, PlayerAccount } from '@/lib/api';
import { useAuth } from './useAuth';

const BASE_INCOME_PER_SECOND = 0.01;

export function usePlayerAccount(incomeMultiplier: number = 1) {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<PlayerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Load fresh account data from database on mount
  useEffect(() => {
    if (!user || !token) return;

    const loadAccount = async () => {
      try {
        const fresh = await api.getAccount(user.id);
        if (fresh) {
          setAccount(fresh);
        } else {
          // Fallback to user data if API fails
          setAccount(user);
        }
      } catch (error) {
        console.error('Failed to load account from DB:', error);
        // Fallback to user data if API fails
        setAccount(user);
      }
      setLoading(false);
    };

    loadAccount();
  }, [user, token]);

  // Auto-increment balance every second with multiplier
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      setAccount(prev => {
        if (!prev) return prev;
        const effectiveIncome = prev.income_per_second * incomeMultiplier;
        const newBalance = prev.balance + effectiveIncome;

        // Save to database every second
        api.updateAccount(prev.id, {
          balance: newBalance,
          last_updated_at: new Date().toISOString()
        }).catch(error => {
          console.error('Error saving balance:', error);
        });

        return {
          ...prev,
          balance: newBalance,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [account?.income_per_second, incomeMultiplier]);


  const updateIncomeRate = useCallback(async (newRate: number) => {
    if (!account || !token) return;

    try {
      await api.updateAccount(account.id, { income_per_second: newRate });

      setAccount(prev => prev ? { ...prev, income_per_second: newRate } : prev);
    } catch (error) {
      console.error('Error updating income rate:', error);
    }
  }, [account, token]);

  const spendMoney = useCallback(async (amount: number) => {
    if (!account || account.balance < amount || !token) return false;

    const newBalance = account.balance - amount;

    try {
      await api.updateAccount(account.id, { balance: newBalance });

      setAccount(prev => prev ? { ...prev, balance: newBalance } : prev);
      return true;
    } catch (error) {
      console.error('Error spending money:', error);
      return false;
    }
  }, [account, token]);

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
