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

export function refreshJobs() {
  return request('/jobs/refresh', { method: 'POST' });
}

export async function askAiAdvisor(query, jobs = []) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Summarise jobs for the prompt — keep tokens reasonable
  const jobSummaries = jobs.slice(0, 20).map((j) => ({
    title: j.title,
    company: j.company,
    salary: j.salary,
    tags: j.tags,
    sponsorship: j.sponsorship,
    source: j.source,
  }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:
        'You are a helpful career advisor specialising in UK tech roles and visa sponsorship. ' +
        'The user has the following skills: Java, Spring Boot, Hibernate, GCP, Docker, Kubernetes, MySQL, REST APIs. ' +
        'Answer concisely and practically. When referencing jobs from the list, mention the company and title.',
      messages: [
        {
          role: 'user',
          content:
            `Here are the current job listings:\n\`\`\`json\n${JSON.stringify(jobSummaries, null, 2)}\n\`\`\`\n\n${query}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response received.';
}
