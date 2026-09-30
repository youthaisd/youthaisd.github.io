import { apiConfig } from './api-config.js';

const list = document.querySelector('#contributor-list');
const empty = document.querySelector('#contributors-empty');

try {
  const response = await fetch(apiConfig.contributorsEndpoint, { cache:'no-store', headers:{ apikey:apiConfig.publishableKey } });
  if (!response.ok) throw new Error('Acknowledgements unavailable');
  const result = await response.json();
  const entries = result.contributors;
  if (!Array.isArray(entries)) throw new Error('Invalid acknowledgements');
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || typeof entry.contribution !== 'string' || !entry.contribution.trim()) continue;
    const card = document.createElement('article'); card.className = 'contributor-card';
    const name = document.createElement('h3'); name.textContent = entry.name; card.append(name);
    for (const value of [entry.affiliation, entry.region]) {
      if (typeof value === 'string' && value.trim()) { const line = document.createElement('p'); line.textContent = value; card.append(line); }
    }
    const credit = document.createElement('p'); credit.className = 'contribution-credit'; credit.textContent = `Contributed to: ${entry.contribution}`; card.append(credit);
    list.append(card);
  }
  empty.hidden = list.childElementCount > 0;
} catch {
  empty.textContent = 'Public acknowledgements are temporarily unavailable.';
}
