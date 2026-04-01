import { useState } from 'react';
import { useJobs } from './hooks/useJobs.js';
import StatsPanel from './components/StatsPanel.jsx';
import SearchBar from './components/SearchBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import JobCard from './components/JobCard.jsx';
import AiAdvisor from './components/AiAdvisor.jsx';

const DEFAULT_FILTERS = {
  search: '',
  source: '',
  sponsorship: false,
  dateFrom: '',
  _dateLabel: '',
  saved: false,
  page: 1,
  limit: 30,
};

function todayFormatted() {
  return new Date().toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { jobs, stats, loading, refreshing, error, pagination, toggleSave, refresh } = useJobs(filters);

  const handleSearchChange = (value) => {
    setFilters((f) => ({ ...f, search: value, page: 1 }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const hasApiKeys = stats !== null;
  const noKeysConfigured = !loading && !error && stats && stats.total === 0 && !stats.scheduler?.lastRunAt;

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-sand-900">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-mono text-3xl font-bold text-sand-900 dark:text-sand-100 tracking-tight">
                Mero Job Radar
              </h1>
              <p className="text-sand-500 dark:text-sand-500 text-sm mt-1">
                London IT roles · Updated daily · Sponsorship tracked
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-sand-400 dark:text-sand-600 mt-1">
                {todayFormatted()}
              </p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <StatsPanel stats={stats} loading={loading && !stats} />

        {/* AI Advisor */}
        <AiAdvisor jobs={jobs} />

        {/* Search */}
        <SearchBar value={filters.search} onChange={handleSearchChange} />

        {/* Filters + Refresh */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <FilterBar filters={filters} onChange={handleFiltersChange} />
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 hover:bg-sand-50 dark:hover:bg-sand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Fetch latest jobs"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Fetching…' : '↻ Fetch Latest'}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* No API keys banner */}
        {noKeysConfigured && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
            <strong>No jobs yet.</strong> Add <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">REED_API_KEY</code> and/or{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">ADZUNA_APP_ID</code> +{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">ADZUNA_APP_KEY</code>{' '}
            to <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">server/.env</code> then click{' '}
            <strong>↻ Fetch Latest</strong>.
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-sand-500 dark:text-sand-500 mb-3">
            {pagination.total.toLocaleString()} {pagination.total === 1 ? 'role' : 'roles'} found
            {pagination.totalPages > 1 && ` · Page ${pagination.page} of ${pagination.totalPages}`}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-sand-200 dark:bg-sand-700 animate-pulse" />
            ))}
          </div>
        )}

        {/* Job list */}
        {!loading && (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onToggleSave={toggleSave} />
            ))}

            {jobs.length === 0 && !error && (
              <div className="text-center py-16 text-sand-400 dark:text-sand-600">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">No jobs match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-50 dark:hover:bg-sand-700 transition-colors"
            >
              ← Previous
            </button>
            <span className="font-mono text-sm text-sand-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-50 dark:hover:bg-sand-700 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-sand-200 dark:border-sand-700 text-center text-xs text-sand-400 dark:text-sand-600">
          <p>
            Mero Job Radar · London IT roles · Data from{' '}
            <a href="https://www.reed.co.uk/developers" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">Reed</a>{' '}
            &{' '}
            <a href="https://developer.adzuna.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">Adzuna</a>
          </p>
          <p className="mt-1">
            To connect live data, add API keys for Reed and Adzuna in <code className="font-mono bg-sand-100 dark:bg-sand-800 px-1 rounded">server/.env</code>
          </p>
        </footer>
      </div>
    </div>
  );
}
