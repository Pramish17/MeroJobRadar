export default function StatsPanel({ stats, loading }) {
  const cards = [
    {
      label: 'Total Listings',
      value: stats?.total ?? '—',
      sub: 'across all sources',
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      valueColor: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    {
      label: 'Visa Sponsored',
      value: stats?.sponsors ?? '—',
      sub: 'UK register · worldwide',
      color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      valueColor: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    {
      label: 'New Today',
      value: stats?.today ?? '—',
      sub: 'posted today',
      color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      valueColor: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${card.color} transition-all`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${card.dot}`} />
            <span className="text-xs font-medium text-sand-600 dark:text-sand-400 uppercase tracking-wide">
              {card.label}
            </span>
          </div>
          <div className={`font-mono text-3xl font-bold ${card.valueColor} ${loading ? 'animate-pulse-soft' : ''}`}>
            {loading ? '···' : (stats ? card.value.toLocaleString() : '—')}
          </div>
          <div className="text-xs text-sand-500 dark:text-sand-500 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
