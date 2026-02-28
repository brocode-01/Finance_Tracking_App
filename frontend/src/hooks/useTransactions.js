import { useState, useEffect, useCallback, useMemo } from 'react';
import { transactionsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useTransactions = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ page: 1, limit: 10, ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (params = filters) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await transactionsAPI.getAll(params);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
  }, []);

  const createTransaction = useCallback(async (data) => {
    const res = await transactionsAPI.create(data);
    toast.success('Transaction added!');
    fetchTransactions(filters);
    return res.data;
  }, [filters, fetchTransactions]);

  const updateTransaction = useCallback(async (id, data) => {
    const res = await transactionsAPI.update(id, data);
    toast.success('Transaction updated!');
    fetchTransactions(filters);
    return res.data;
  }, [filters, fetchTransactions]);

  const deleteTransaction = useCallback(async (id) => {
    await transactionsAPI.delete(id);
    toast.success('Transaction deleted!');
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);


  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return {
    transactions,
    pagination,
    filters,
    loading,
    error,
    totals,
    updateFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: () => fetchTransactions(filters),
  };
};
