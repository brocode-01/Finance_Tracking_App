import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';

const STORAGE_KEY = (userId, year) => `analytics_cache_${userId}_${year}`;

export const useAnalytics = (year) => {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      const stored = localStorage.getItem(STORAGE_KEY(userId, year));
      if (stored) {
        const parsed = JSON.parse(stored);
        const ageMinutes = (Date.now() - parsed.savedAt) / 1000 / 60;
        if (ageMinutes < 15) {
          setSummary(parsed.summary);
          setCategoryData(parsed.categoryData || []);
          setMonthlyTrends(parsed.monthlyTrends || []);
          setIncomeVsExpense(parsed.incomeVsExpense || []);
          setRecentTransactions(parsed.recentTransactions || []);
          setFromCache(true);
          setLoading(false);
          return; 
        }
      }
    } catch (e) {
    
    }
  }, [year]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = year ? { year } : {};
      const [summaryRes, catRes, monthlyRes, iveRes, recentRes] = await Promise.all([
        analyticsAPI.getSummary(params),
        analyticsAPI.getCategoryBreakdown({ ...params, type: 'expense' }),
        analyticsAPI.getMonthlyTrends(params),
        analyticsAPI.getIncomeVsExpense({ ...params, period: 'monthly' }),
        analyticsAPI.getRecent({ limit: 5 }),
      ]);

      const data = {
        summary: summaryRes.data,
        categoryData: catRes.data.data || [],
        monthlyTrends: monthlyRes.data.data || [],
        incomeVsExpense: iveRes.data.data || [],
        recentTransactions: recentRes.data.transactions || [],
        savedAt: Date.now(),
      };


      setSummary(data.summary);
      setCategoryData(data.categoryData);
      setMonthlyTrends(data.monthlyTrends);
      setIncomeVsExpense(data.incomeVsExpense);
      setRecentTransactions(data.recentTransactions);
      setFromCache(summaryRes.data.fromCache || false);

      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id;
        localStorage.setItem(STORAGE_KEY(userId, year), JSON.stringify(data));
      } catch (e) {
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    summary,
    categoryData,
    monthlyTrends,
    incomeVsExpense,
    recentTransactions,
    loading,
    fromCache,
    error,
    refresh: fetchAll,
  };
};
