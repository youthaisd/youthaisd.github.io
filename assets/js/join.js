import { apiConfig } from './api-config.js';
import { joinConfig } from './join-config.js';
import { membershipCountries, membershipRoles, membershipTopics, membershipVersion, validateMembership } from '../../data/membership.js';

const form = document.querySelector('#join-form');
const notice = document.querySelector('#join-notice');
const availability = document.querySelector('#join-availability');
const ready = /^https:\/\//.test(joinConfig.endpoint) && Boolean(apiConfig.publishableKey) && joinConfig.privacyReady === true;
const draftKey = `youthaisd:join:draft:${membershipVersion}`;
const countryInput = form.elements.country;
const countryList = document.querySelector('#country-options');
const roleSelect = form.elements.current_role;
const topicsBox = document.querySelector('#topic-options');
const topicCount = document.querySelector('#topic-count');
const otherWrap = document.querySelector('#other-topic-wrap');
const sourceCandidate = new URLSearchParams(location.search).get('source') || 'direct';
const source = ['direct','website','consultation','projects'].includes(sourceCandidate) ? sourceCandidate : 'direct';

for (const [, label] of membershipCountries) {
  const option = document.createElement('option'); option.value = label; countryList.append(option);
}
for (const [id, label] of membershipRoles) {
  const option = document.createElement('option'); option.value = id; option.textContent = label; roleSelect.append(option);
}
for (const [id, label] of membershipTopics) {
  const option = document.createElement('label'); option.className = 'choice-option';
  const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'interest_topics'; input.value = id;
  const caption = document.createElement('span'); caption.textContent = label;
  option.append(input, caption); topicsBox.append(option);
}

function selectedTopics() { return [...form.querySelectorAll('input[name="interest_topics"]:checked')].map(input => input.value); }
function updateTopics() {
  const selected = selectedTopics();
  topicCount.textContent = `${selected.length} of 3 selected`;
  for (const input of form.querySelectorAll('input[name="interest_topics"]')) input.disabled = selected.length >= 3 && !input.checked;
  otherWrap.hidden = !selected.includes('other');
  if (otherWrap.hidden) form.elements.interest_topics_other.value = '';
}
function getValues() {
  const countryLabel = countryInput.value.trim().toLowerCase();
  const country_code = membershipCountries.find(([, label]) => label.toLowerCase() === countryLabel)?.[0] || '';
  return {
    form:'join', form_version:membershipVersion, source,
    full_name:form.elements.full_name.value,
    contact_email:form.elements.contact_email.value,
    country_code,
    institution:form.elements.institution.value,
    current_role:roleSelect.value,
    interest_topics:selectedTopics(),
    interest_topics_other:form.elements.interest_topics_other.value,
    profile_url:form.elements.profile_url.value,
    note:form.elements.note.value,
    directory_consent:form.elements.directory_consent.checked,
    terms_ack:form.elements.terms_ack.checked,
    website_confirm:form.elements.website_confirm.value,
  };
}
function saveDraft() {
  const { website_confirm, ...values } = getValues();
  try { sessionStorage.setItem(draftKey, JSON.stringify({ ...values, country_label:countryInput.value })); } catch {}
}
function restoreDraft() {
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null'); } catch { return; }
  if (!saved || typeof saved !== 'object') return;
  for (const name of ['full_name','contact_email','institution','interest_topics_other','profile_url','note']) {
    if (typeof saved[name] === 'string') form.elements[name].value = saved[name];
  }
  countryInput.value = saved.country_label || '';
  roleSelect.value = saved.current_role || '';
  for (const input of form.querySelectorAll('input[name="interest_topics"]')) input.checked = Array.isArray(saved.interest_topics) && saved.interest_topics.includes(input.value);
  form.elements.directory_consent.checked = saved.directory_consent === true;
  form.elements.terms_ack.checked = saved.terms_ack === true;
  updateTopics();
}
function showErrors(errors) {
  for (const element of form.querySelectorAll('[data-error-for]')) { element.textContent = ''; element.hidden = true; }
  for (const [name, message] of Object.entries(errors)) {
    const element = form.querySelector(`[data-error-for="${name}"]`);
    if (element) { element.textContent = message; element.hidden = false; }
  }
  const first = form.querySelector('[data-error-for]:not([hidden])');
  first?.scrollIntoView({ behavior:'smooth', block:'center' });
}
function showNotice(message, kind = 'error') { notice.textContent = message; notice.dataset.kind = kind; notice.hidden = !message; }

if (ready) {
  document.querySelector('#membership-open-copy').textContent = 'Membership is free and open to students, early-career researchers, practitioners and other young people interested in AI and sustainable development.';
  availability.hidden = true;
  form.hidden = false;
  restoreDraft();
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', event => { if (event.target.name === 'interest_topics') updateTopics(); saveDraft(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = getValues();
    const checked = validateMembership(values);
    if (Object.keys(checked.errors).length) { showErrors(checked.errors); return; }
    showErrors({});
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; showNotice('Recording your membership…', 'info');
    try {
      const response = await fetch(joinConfig.endpoint, {
        method:'POST', headers:{ 'Content-Type':'application/json', apikey:apiConfig.publishableKey },
        body:JSON.stringify({ form:'join', ...checked.payload, website_confirm:values.website_confirm }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Your details could not be sent. Please try again.');
      sessionStorage.removeItem(draftKey);
      sessionStorage.setItem('aixsd:submitted:join', String(Date.now()));
      location.href = 'success/';
    } catch (error) { showNotice(error.message || 'Your details could not be sent. Please try again.'); button.disabled = false; }
  });
} else {
  form.hidden = true;
  availability.hidden = false;
}
