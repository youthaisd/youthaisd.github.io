import { apiConfig } from './api-config.js';
import { joinConfig } from './join-config.js';

const ready = /^https:\/\//.test(apiConfig.endpoint) && Boolean(apiConfig.publishableKey) && apiConfig.formsOpen === true;
const joinReady = /^https:\/\//.test(joinConfig.endpoint) && Boolean(apiConfig.publishableKey) && joinConfig.privacyReady === true;
if (ready) {
  document.querySelector('#form-availability').textContent = joinReady ? 'Four participation routes · open' : 'LISTEN · MAP · CONTRIBUTE open; JOIN preparing';
  document.querySelector('#consultation-availability-copy').textContent = 'The consultation is open for voluntary responses. Share your perspective to help shape an initial research agenda.';
  document.querySelector('#consultation-action').textContent = 'Open the consultation';
}
if (joinReady) document.querySelector('#join-card-status').textContent = 'JOIN · 2–3 MIN';
