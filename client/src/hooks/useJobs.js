import { useState, useEffect, useCallback, useRef } from 'react';
import { getJobs, getStats, toggleSave, refreshJobs } from '../utils/api.js';

export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const autoFetchedRef = useRef(false);

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
      return s;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.source,
    filters.location,
    filters.sponsorship,
    filters.dateFrom,
    filters.saved,
    filters.page,
    filters.limit,
  ]);

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
    const startingFromEmpty = (statsRef.current?.total ?? 0) === 0;
    try {
      await refreshJobs();
      if (startingFromEmpty) {
        // Poll every 10s for up to 3 minutes waiting for the first scrape to complete
        for (let i = 0; i < 18; i++) {
          await new Promise((r) => setTimeout(r, 10000));
          const s = await fetchStats();
          if (s?.total > 0) {
            await fetchJobs(filtersRef.current);
            return;
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 8000));
        await Promise.all([fetchJobs(filtersRef.current), fetchStats()]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchJobs, fetchStats]);

  // Auto-trigger first fetch when the DB is empty
  useEffect(() => {
    if (!stats || stats.total > 0 || refreshing || autoFetchedRef.current) return;
    autoFetchedRef.current = true;
    handleRefresh();
  }, [stats, refreshing, handleRefresh]);

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
