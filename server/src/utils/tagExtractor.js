const TECH_KEYWORDS = [
  'Java', 'Spring Boot', 'Spring', 'Hibernate',
  'Python', 'JavaScript', 'TypeScript',
  'React', 'Angular', 'Vue', 'Node.js', 'Express',
  'Django', 'Flask', 'Next.js',
  'AWS', 'GCP', 'Azure',
  'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle',
  'GraphQL', 'REST', 'Microservices', 'CI/CD',
  'Git', 'Linux', 'Kafka', 'Elasticsearch',
  'Go', 'Rust', 'Kotlin', 'C#', '.NET',
  'Machine Learning', 'Selenium', 'Cypress', 'Agile',
];

// Sort by length descending so "Spring Boot" matches before "Spring"
const SORTED_KEYWORDS = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);

export function extractTags(title = '', description = '') {
  const text = `${title} ${description}`;
  const found = new Set();

  for (const keyword of SORTED_KEYWORDS) {
    if (found.size >= 10) break;

    // Escape special regex chars in keyword
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word boundary — handles both "Node.js" and "C#"
    const pattern = new RegExp(`(?<![\\w.#])${escaped}(?![\\w.#])`, 'i');

    if (pattern.test(text)) {
      // Store the canonical casing from our list
      found.add(keyword);
    }
  }

  return [...found].slice(0, 10);
}
