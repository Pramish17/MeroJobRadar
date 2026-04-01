import { useState } from 'react';
import { useJobs } from './hooks/useJobs.js';
import StatsPanel from './components/StatsPanel.jsx';
import SearchBar from './components/SearchBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import JobCard from './components/JobCard.jsx';
import AiAdvisor from './components/AiAdvisor.jsx';

const BASE_FILTERS = {
  search: '',
  source: '',
  location: '',
  sponsorship: false,
  dateFrom: '',
  _dateLabel: '',
  saved: false,
  page: 1,
  limit: 30,
};

function todayFormatted() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function App() {
  const [activeTab, setActiveTab]           = useState('all');
  const [allFilters, setAllFilters]         = useState(BASE_FILTERS);
  const [sponsoredFilters, setSponsoredFilters] = useState({ ...BASE_FILTERS, sponsorship: true });

  // Sponsored tab always has sponsorship locked to true
  const filters    = activeTab === 'sponsored' ? { ...sponsoredFilters, sponsorship: true } : allFilters;
  const setFilters = activeTab === 'sponsored' ? setSponsoredFilters : setAllFilters;

  const { jobs, stats, loading, refreshing, error, pagination, toggleSave, refresh } = useJobs(filters);

  const noJobsYet = !loading && !error && stats?.total === 0 && !stats?.scheduler?.lastRunAt;

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-sand-900">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-mono text-3xl font-bold text-sand-900 dark:text-sand-100 tracking-tight">
                Mero Job Radar
              </h1>
              <p className="text-sand-500 dark:text-sand-500 text-sm mt-1">
                Worldwide IT roles · Updated daily · Visa sponsorship tracked
              </p>
            </div>
            <p className="font-mono text-xs text-sand-400 dark:text-sand-600 mt-1 text-right">
              {todayFormatted()}
            </p>
          </div>
        </header>

        {/* Stats */}
        <StatsPanel stats={stats} loading={loading && !stats} />

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-sand-200 dark:bg-sand-800 border border-sand-200 dark:border-sand-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-sand-900 text-sand-900 dark:text-sand-100 shadow-sm'
                : 'text-sand-500 dark:text-sand-400 hover:text-sand-700 dark:hover:text-sand-300'
            }`}
          >
            All Jobs
            {stats?.total > 0 && (
              <span className="ml-2 font-mono text-xs text-sand-400 dark:text-sand-500">
                {stats.total.toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sponsored')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'sponsored'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-sand-500 dark:text-sand-400 hover:text-sand-700 dark:hover:text-sand-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Visa Sponsored
            {stats?.sponsors > 0 && (
              <span className={`font-mono text-xs ${activeTab === 'sponsored' ? 'text-emerald-100' : 'text-sand-400 dark:text-sand-500'}`}>
                {stats.sponsors.toLocaleString()}
              </span>
            )}
          </button>
        </div>

        {/* Sponsored tab info banner */}
        {activeTab === 'sponsored' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              Companies on the <strong>UK Home Office Skilled Worker register</strong> or listings that
              explicitly mention <strong>visa sponsorship</strong> — worldwide.
            </span>
          </div>
        )}

        {/* AI Advisor */}
        <AiAdvisor jobs={jobs} />

        {/* Search + Refresh */}
        <SearchBar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />

        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              hideSponsorToggle={activeTab === 'sponsored'}
            />
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 hover:bg-sand-50 dark:hover:bg-sand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* First-run prompt */}
        {noJobsYet && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
            <strong>No jobs yet.</strong> Add{' '}
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
            {Array.from({ length: 5 }, (_, i) => (
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
                <p className="text-4xl mb-3">{activeTab === 'sponsored' ? '🏢' : '🔍'}</p>
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
        <footer className="mt-12 pt-6 border-t border-sand-200 dark:border-sand-700 text-center text-xs text-sand-400 dark:text-sand-600 space-y-1">
          <p>
            Mero Job Radar · Worldwide IT roles · Data from{' '}
            <a href="https://developer.adzuna.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">Adzuna</a>,{' '}
            <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">Remotive</a>,{' '}
            <a href="https://www.arbeitnow.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">Arbeitnow</a>,{' '}
            &amp;{' '}
            <a href="https://remoteok.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-sand-600">RemoteOK</a>
          </p>
          <p>Visa sponsorship: UK Home Office register + worldwide job description scan</p>
        </footer>

      </div>
    </div>
  );
}
