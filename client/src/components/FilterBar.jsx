const DATE_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Today', value: 'today' },
  { label: '3 days', value: '3d' },
  { label: '7 days', value: '7d' },
];

function getDateFrom(value) {
  if (!value) return '';
  const d = new Date();
  const tz = 'Europe/London';
  if (value === 'today') return d.toLocaleDateString('en-CA', { timeZone: tz });
  if (value === '3d') { d.setDate(d.getDate() - 3); return d.toLocaleDateString('en-CA', { timeZone: tz }); }
  if (value === '7d') { d.setDate(d.getDate() - 7); return d.toLocaleDateString('en-CA', { timeZone: tz }); }
  return '';
}

export default function FilterBar({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  const handleDate = (v) => {
    onChange({ ...filters, dateFrom: getDateFrom(v), _dateLabel: v, page: 1 });
  };

  const currentDateLabel = filters._dateLabel || '';

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {/* Source filters */}
      <div className="flex rounded-lg overflow-hidden border border-sand-200 dark:border-sand-700">
        {['all', 'reed', 'adzuna'].map((s) => (
          <button
            key={s}
            onClick={() => set('source', s === 'all' ? '' : s)}
            className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors
              ${(filters.source || '') === (s === 'all' ? '' : s)
                ? 'bg-sand-900 dark:bg-sand-100 text-white dark:text-sand-900'
                : 'bg-white dark:bg-sand-800 text-sand-600 dark:text-sand-400 hover:bg-sand-50 dark:hover:bg-sand-700'
              }`}
          >
            {s === 'all' ? 'All Sources' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="flex rounded-lg overflow-hidden border border-sand-200 dark:border-sand-700">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleDate(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors
              ${currentDateLabel === opt.value
                ? 'bg-sand-900 dark:bg-sand-100 text-white dark:text-sand-900'
                : 'bg-white dark:bg-sand-800 text-sand-600 dark:text-sand-400 hover:bg-sand-50 dark:hover:bg-sand-700'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Visa sponsor toggle */}
      <button
        onClick={() => set('sponsorship', !filters.sponsorship)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${filters.sponsorship
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300'
          }`}
      >
        <span>VISA</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Sponsors Only
      </button>

      {/* Saved toggle */}
      <button
        onClick={() => set('saved', !filters.saved)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${filters.saved
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300'
          }`}
      >
        <svg className="w-3 h-3" fill={filters.saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Saved Only
      </button>
    </div>
  );
}
