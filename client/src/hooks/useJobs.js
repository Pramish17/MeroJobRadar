import { useState, useEffect, useCallback, useRef } from 'react';
import { getJobs, getStats, toggleSave, refreshJobs } from '../utils/api.js';

export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Avoid stale closures when filters change
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchJobs = useCallback(async (overrideFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = overrideFilters ?? filtersRef.current;
      const result = await getJobs(params);
      setJobs(result.jobs);
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      // Stats failure is non-critical
    }
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchJobs(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.source,
    filters.sponsorship,
    filters.dateFrom,
    filters.saved,
    filters.page,
    filters.limit,
  ]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleToggleSave = useCallback(async (id) => {
    try {
      const { saved } = await toggleSave(id);
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? { ...job, saved } : job))
      );
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshJobs();
      // Poll for 15 seconds to pick up new data
      await new Promise((resolve) => setTimeout(resolve, 8000));
      await Promise.all([fetchJobs(filters), fetchStats()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [filters, fetchJobs, fetchStats]);

  return {
    jobs,
    stats,
    loading,
    refreshing,
    error,
    pagination,
    toggleSave: handleToggleSave,
    refresh: handleRefresh,
    refetch: () => Promise.all([fetchJobs(filters), fetchStats()]),
  };
}
