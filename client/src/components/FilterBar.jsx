const DATE_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Today',    value: 'today' },
  { label: '3 days',  value: '3d' },
  { label: '7 days',  value: '7d' },
];

const SOURCE_OPTIONS = [
  { label: 'All Sources', value: '' },
  { label: 'Adzuna',      value: 'adzuna' },
  { label: 'Remotive',    value: 'remotive' },
  { label: 'Arbeitnow',   value: 'arbeitnow' },
  { label: 'RemoteOK',    value: 'remoteok' },
];

const LOCATION_OPTIONS = [
  { label: 'All Locations',  value: '' },
  { label: 'Remote',         value: 'Remote' },
  // UK
  { label: 'London',         value: 'London' },
  { label: 'Manchester',     value: 'Manchester' },
  { label: 'Birmingham',     value: 'Birmingham' },
  { label: 'Leeds',          value: 'Leeds' },
  { label: 'Glasgow',        value: 'Glasgow' },
  { label: 'Edinburgh',      value: 'Edinburgh' },
  { label: 'Cardiff',        value: 'Cardiff' },
  { label: 'Belfast',        value: 'Belfast' },
  // Global regions
  { label: 'United States',  value: 'United States' },
  { label: 'Europe',         value: 'Europe' },
  { label: 'Canada',         value: 'Canada' },
  { label: 'Australia',      value: 'Australia' },
  { label: 'Asia',           value: 'Asia' },
];

const SELECT_CLASS = `
  px-3 py-1.5 rounded-lg text-xs font-medium border border-sand-200 dark:border-sand-700
  bg-white dark:bg-sand-800 text-sand-600 dark:text-sand-400
  focus:outline-none focus:ring-1 focus:ring-sand-400 dark:focus:ring-sand-500
`.trim();

function getDateFrom(value) {
  if (!value) return '';
  const d = new Date();
  if (value === 'today') return d.toISOString().split('T')[0];
  if (value === '3d')  { d.setDate(d.getDate() - 3);  return d.toISOString().split('T')[0]; }
  if (value === '7d')  { d.setDate(d.getDate() - 7);  return d.toISOString().split('T')[0]; }
  return '';
}

export default function FilterBar({ filters, onChange, hideSponsorToggle = false }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  const handleDate = (v) => {
    onChange({ ...filters, dateFrom: getDateFrom(v), _dateLabel: v, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-5">

      {/* Source */}
      <select
        value={filters.source || ''}
        onChange={(e) => set('source', e.target.value)}
        className={SELECT_CLASS}
      >
        {SOURCE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Location */}
      <select
        value={filters.location || ''}
        onChange={(e) => set('location', e.target.value)}
        className={SELECT_CLASS}
      >
        {LOCATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex rounded-lg overflow-hidden border border-sand-200 dark:border-sand-700">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleDate(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              (filters._dateLabel || '') === opt.value
                ? 'bg-sand-900 dark:bg-sand-100 text-white dark:text-sand-900'
                : 'bg-white dark:bg-sand-800 text-sand-600 dark:text-sand-400 hover:bg-sand-50 dark:hover:bg-sand-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Visa sponsor toggle — hidden on the Visa Sponsored tab */}
      {!hideSponsorToggle && (
        <button
          onClick={() => set('sponsorship', !filters.sponsorship)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            filters.sponsorship
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-600 dark:text-sand-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300'
          }`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Visa Sponsors Only
        </button>
      )}

      {/* Saved toggle */}
      <button
        onClick={() => set('saved', !filters.saved)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          filters.saved
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
