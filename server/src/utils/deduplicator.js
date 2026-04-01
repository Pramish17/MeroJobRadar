/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Returns true if newJob is a duplicate of any job in existingJobs.
 * Duplicate = same company (case-insensitive) + same location +
 *             title Levenshtein distance < 4
 */
export function isDuplicate(newJob, existingJobs) {
  const newCompany = newJob.company.toLowerCase().trim();
  const newLocation = (newJob.location || '').toLowerCase().trim();
  const newTitle = newJob.title.toLowerCase().trim();

  for (const existing of existingJobs) {
    const existingCompany = existing.company.toLowerCase().trim();
    const existingLocation = (existing.location || '').toLowerCase().trim();
    const existingTitle = existing.title.toLowerCase().trim();

    if (
      newCompany === existingCompany &&
      newLocation === existingLocation &&
      levenshtein(newTitle, existingTitle) < 4
    ) {
      return true;
    }
  }

  return false;
}
