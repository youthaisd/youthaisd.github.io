import { apiConfig } from './api-config.js';

const ready = /^https:\/\//.test(apiConfig.endpoint) && Boolean(apiConfig.publishableKey);
if (ready) {
  document.querySelector('#form-availability').textContent = 'Three participation routes · open';
  document.querySelector('#consultation-availability-copy').textContent = 'The consultation is open for voluntary responses. Share your perspective to help shape an initial research agenda.';
  document.querySelector('#consultation-action').textContent = 'Open the consultation';
}
