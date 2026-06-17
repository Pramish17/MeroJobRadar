const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function getJobs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) {
      query.set(k, v);
    }
  });
  const qs = query.toString();
  return request(`/jobs${qs ? `?${qs}` : ''}`);
}

export function getStats() {
  return request('/jobs/stats');
}

export function toggleSave(id) {
  return request(`/jobs/${id}/save`, { method: 'POST' });
}

export async function refreshJobs() {
  const res = await fetch(`${BASE}/jobs/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  // 409 means a fetch is already in progress — treat as success, caller will poll
  if (res.status === 409) return { alreadyRunning: true };
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
