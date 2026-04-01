import { useState } from 'react';
import { askAiAdvisor } from '../utils/api.js';

export default function AiAdvisor({ jobs = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const text = await askAiAdvisor(query.trim(), jobs);
      setResponse(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-sand-200 dark:border-sand-700">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-900/30 dark:hover:to-indigo-900/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-sand-800 dark:text-sand-200">AI Career Advisor</span>
          <span className="text-xs text-sand-500 dark:text-sand-500 hidden sm:inline">
            — Ask about the job listings
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-sand-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-sand-800 border-t border-sand-100 dark:border-sand-700">
          {!hasKey ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
              <strong>AI Advisor not configured.</strong> Add{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_ANTHROPIC_API_KEY</code>{' '}
              to <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">client/.env</code> to enable this feature.
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 'Which roles best match my Java + GCP skills?'"
                  className="
                    flex-1 px-3 py-2.5 rounded-lg text-sm
                    bg-sand-50 dark:bg-sand-700
                    border border-sand-200 dark:border-sand-600
                    text-sand-900 dark:text-sand-100
                    placeholder-sand-400
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                  "
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Asking...
                    </>
                  ) : (
                    'Ask'
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {response && (
                <div className="mt-3 p-4 rounded-lg bg-sand-50 dark:bg-sand-700/50 border border-sand-200 dark:border-sand-600 animate-fade-in">
                  <p className="text-xs font-semibold text-sand-500 uppercase tracking-wide mb-2">Response</p>
                  <p className="text-sm text-sand-800 dark:text-sand-200 leading-relaxed whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
