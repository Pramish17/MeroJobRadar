import { useState } from 'react';

// Deterministic color from company name
function companyColor(name = '') {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD',
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
    '#4DB6AC', '#81C784', '#AED581', '#FFD54F',
    '#FFB74D', '#FF8A65', '#A1887F', '#90A4AE',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobCard({ job, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const color = companyColor(job.company);
  const initials = job.company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <article
      className={`
        relative bg-white dark:bg-sand-800 rounded-xl border
        border-sand-200 dark:border-sand-700
        transition-all duration-200 overflow-hidden
        hover:shadow-md hover:border-sand-300 dark:hover:border-sand-600
        ${expanded ? 'shadow-md' : ''}
        animate-fade-in
      `}
    >
      {/* Colored top accent on expand */}
      <div
        className="h-0.5 w-full transition-all duration-300"
        style={{ backgroundColor: expanded ? color : 'transparent' }}
      />

      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
            style={{ backgroundColor: color }}
          >
            {initials || '?'}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sand-900 dark:text-sand-100 text-sm leading-tight truncate">
                  {job.title}
                </h3>
                <p className="text-sand-600 dark:text-sand-400 text-xs mt-0.5">
                  {job.company}
                </p>
              </div>

              {/* Badges top-right */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {job.sponsorship && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    VISA ✓
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    job.source === 'reed'
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {job.source === 'reed' ? 'Reed' : 'Adzuna'}
                </span>
              </div>
            </div>

            {/* Location + salary + time */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-sand-500 dark:text-sand-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
              {job.salary && (
                <span className="text-xs font-semibold text-sand-800 dark:text-sand-200">
                  {job.salary}
                </span>
              )}
              <span className="text-xs text-sand-400 dark:text-sand-600 font-mono ml-auto">
                {timeAgo(job.posted_date || job.postedDate)}
              </span>
            </div>

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-xs bg-sand-100 dark:bg-sand-700 text-sand-600 dark:text-sand-400"
                  >
                    {tag}
                  </span>
                ))}
                {job.tags.length > 6 && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-sand-100 dark:bg-sand-700 text-sand-500">
                    +{job.tags.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Expand chevron */}
          <svg
            className={`w-4 h-4 text-sand-400 flex-shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-sand-100 dark:border-sand-700 px-4 pb-4 pt-3 animate-fade-in">
          {/* Full description */}
          {job.description && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-sand-500 dark:text-sand-500 uppercase tracking-wide mb-2">
                Description
              </p>
              <p className="text-sm text-sand-700 dark:text-sand-300 leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                {job.description.replace(/<[^>]*>/g, '').trim()}
              </p>
            </div>
          )}

          {/* All tags */}
          {job.tags?.length > 6 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-xs bg-sand-100 dark:bg-sand-700 text-sand-600 dark:text-sand-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: color }}
              onClick={(e) => e.stopPropagation()}
            >
              Apply Now →
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(job.id); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                job.saved
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-700 dark:text-amber-400'
                  : 'bg-white dark:bg-sand-700 border-sand-200 dark:border-sand-600 text-sand-600 dark:text-sand-400 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              <svg className="w-4 h-4" fill={job.saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {job.saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
