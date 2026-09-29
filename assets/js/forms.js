import { forms, fieldList, isVisible, cleanSource } from '../../data/forms-schema.js';
import { normalizeAndValidate, submissionPayload, wordCount } from '../../data/validation.js';
import { apiConfig } from './api-config.js';

const root = document.querySelector('[data-form]');
const formName = root?.dataset.form;
const definition = forms[formName];
if (!definition) throw new Error('Unknown form');

const storageKey = `aixsd:draft:${formName}:${definition.version}`;
const saved = (() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
const state = {
  step: Math.max(0, Math.min(definition.steps.length - 1, Number(saved?.step) || 0)),
  values: saved?.values && typeof saved.values === 'object' ? saved.values : {},
  errors: {},
  busy: false,
  started: Boolean(saved?.started),
};
const $ = selector => document.querySelector(selector);
const stepContent = $('#step-content');
const notice = $('#form-notice');
const wizard = $('#wizard');
const ready = /^https:\/\//.test(apiConfig.endpoint) && Boolean(apiConfig.publishableKey);
const source = cleanSource(new URLSearchParams(location.search).get('source') || 'direct');

$('#form-intro').textContent = definition.intro;
$('#duration').textContent = `Estimated time · ${definition.duration}`;
if (!ready) showNotice('This form is available to preview. Submissions will open after the privacy information and final checks are complete.', 'info');

function showNotice(message, kind = 'error') {
  notice.textContent = message;
  notice.dataset.kind = kind;
  notice.hidden = !message;
}
function save() { sessionStorage.setItem(storageKey, JSON.stringify({ step:state.step, values:state.values, started:state.started })); }
function emit(name) { document.dispatchEvent(new CustomEvent(name)); }
function touch() { if (!state.started) { state.started = true; emit(`${formName === 'projects' ? 'project' : formName === 'contribute' ? 'contributor' : 'consultation'}_started`); } save(); }
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function fieldError(wrapper, name) { if (state.errors[name]) { wrapper.classList.add('has-error'); const e = el('p','field-error',state.errors[name]); e.id = `error-${name}`; wrapper.append(e); } }
function markChanged(name, value, rerender = false) {
  state.values[name] = value;
  delete state.errors[name];
  const field = fieldList(formName).find(item => item.name === name);
  if (field?.otherField && !(Array.isArray(value) ? value.includes('other') : value === 'other')) state.values[field.otherField] = '';
  if (name === 'followup_consent' && value === 'no') { state.values.contact_email = ''; state.values.contact_name = ''; }
  if (name === 'contribution_interest' && value === 'not_now') state.values.contribution_preferences = [];
  touch();
  if (rerender) render();
}
function addHeading(wrapper, field, tag = 'p') {
  const heading = el(tag,'field-label',field.dynamicLabel && state.values[field.dynamicLabel.field] === field.dynamicLabel.equals ? field.dynamicLabel.label : field.label);
  wrapper.append(heading);
  if (field.required) heading.append(el('span','required-mark',' *'));
  if (field.max) wrapper.append(el('p','field-hint',field.hint || `Select up to ${field.max}.`));
  else if (field.hint) wrapper.append(el('p','field-hint',field.hint));
  return heading;
}
function renderChoice(field, wrapper) {
  const group = el('fieldset','choice-group');
  const legend = el('legend','field-label',field.label);
  if (field.required) legend.append(el('span','required-mark',' *'));
  group.append(legend);
  const selected = state.values[field.name];
  const grid = el('div','choice-options');
  for (const [id, label] of field.options) {
    const option = el('label','choice-option');
    const input = el('input'); input.type = 'radio'; input.name = field.name; input.value = String(id); input.checked = String(selected) === String(id);
    input.addEventListener('change', () => markChanged(field.name, String(id), true));
    option.append(input, el('span','',label)); grid.append(option);
  }
  group.append(grid); wrapper.append(group);
  if (field.noticeIf && selected === field.noticeIf.value) wrapper.append(el('p','inline-notice',field.noticeIf.text));
}
function renderMulti(field, wrapper) {
  const group = el('fieldset','choice-group');
  const legend = el('legend','field-label',field.label);
  if (field.required) legend.append(el('span','required-mark',' *'));
  group.append(legend);
  const selected = Array.isArray(state.values[field.name]) ? state.values[field.name] : [];
  if (field.max) group.append(el('p','selection-count',`${selected.length} of ${field.max} selected`));
  if (field.hint) group.append(el('p','field-hint',field.hint));
  const grid = el('div','choice-options multi-options');
  for (const [id, label] of field.options) {
    const option = el('label','choice-option');
    const input = el('input'); input.type = 'checkbox'; input.name = field.name; input.value = String(id); input.checked = selected.includes(String(id));
    input.disabled = Boolean(field.max && selected.length >= field.max && !input.checked) || Boolean(field.exclusive && selected.includes(field.exclusive) && id !== field.exclusive);
    input.addEventListener('change', () => {
      let next = input.checked ? [...selected, String(id)] : selected.filter(item => item !== String(id));
      if (field.exclusive && input.checked) next = id === field.exclusive ? [String(id)] : next.filter(item => item !== field.exclusive);
      markChanged(field.name, next, true);
    });
    option.append(input, el('span','',label)); grid.append(option);
  }
  group.append(grid); wrapper.append(group);
}
function renderCountry(field, wrapper) {
  const label = el('label','field-label',field.label);
  if (field.required) label.append(el('span','required-mark',' *'));
  const input = el('input','text-input'); input.type = 'search'; input.name = field.name; input.placeholder = 'Start typing a country or region'; input.autocomplete = 'off';
  const listId = `list-${field.name}`; input.setAttribute('list',listId);
  const current = field.options.find(([id]) => id === state.values[field.name]);
  input.value = current?.[1] || '';
  const dataList = el('datalist'); dataList.id = listId;
  for (const [, name] of field.options) { const option = el('option'); option.value = name; dataList.append(option); }
  input.addEventListener('input', () => {
    const match = field.options.find(([, name]) => name.toLowerCase() === input.value.trim().toLowerCase());
    markChanged(field.name, match?.[0] || '');
  });
  label.append(input); wrapper.append(label,dataList,el('p','field-hint','Choose a suggestion from the list.'));
}
function renderLinks(field, wrapper) {
  addHeading(wrapper, field);
  wrapper.append(el('p','field-hint',`Optional · up to ${field.max} links · http:// or https:// only.`));
  const list = Array.isArray(state.values[field.name]) ? state.values[field.name] : [];
  for (let index = 0; index < field.max; index++) {
    const row = el('div','link-row');
    const select = el('select','text-input'); select.setAttribute('aria-label',`Link ${index + 1} type`);
    for (const [id,label] of field.kinds) { const option = el('option','',label); option.value = id; select.append(option); }
    select.value = list[index]?.type || field.kinds[0][0];
    const input = el('input','text-input'); input.type = 'url'; input.placeholder = `Link ${index + 1} URL`; input.setAttribute('aria-label',`Link ${index + 1} URL`); input.value = list[index]?.url || '';
    const update = () => { const current = Array.isArray(state.values[field.name]) ? state.values[field.name] : []; const next = Array.from({length:field.max},(_,i) => i === index ? {type:select.value,url:input.value} : (current[i] || {type:field.kinds[0][0],url:''})); markChanged(field.name,next); };
    select.addEventListener('change',update); input.addEventListener('input',update);
    row.append(select,input); wrapper.append(row);
  }
}
function renderSimple(field, wrapper) {
  if (field.type === 'checkbox') {
    const label = el('label','confirmation-option'); const input = el('input'); input.type='checkbox'; input.name=field.name; input.checked=state.values[field.name] === true;
    input.addEventListener('change',() => markChanged(field.name,input.checked)); label.append(input,el('span','',field.label)); wrapper.append(label); return;
  }
  const label = el('label','field-label',field.dynamicLabel && state.values[field.dynamicLabel.field] === field.dynamicLabel.equals ? field.dynamicLabel.label : field.label);
  if (field.required) label.append(el('span','required-mark',' *'));
  const input = field.type === 'textarea' ? el('textarea','text-input') : el('input','text-input');
  if (field.type !== 'textarea') input.type = field.type === 'email' ? 'email' : 'text';
  else input.rows = field.emphasized ? 6 : 5;
  input.name = field.name; input.value = state.values[field.name] || '';
  if (field.maxLength) input.maxLength = field.maxLength;
  if (field.type === 'email') input.autocomplete = 'email';
  const count = field.maxLength || field.maxWords ? el('span','field-count','') : null;
  const refreshCount = () => { if (count) count.textContent = field.maxLength ? `${input.value.length} / ${field.maxLength} characters` : `${wordCount(input.value)} / ${field.maxWords} words`; };
  input.addEventListener('input',() => { markChanged(field.name,input.value); refreshCount(); });
  label.append(input); wrapper.append(label);
  if (count) { refreshCount(); wrapper.append(count); }
}
function renderField(field) {
  if (!isVisible(field,state.values)) return null;
  const wrapper = el('div','field'); wrapper.dataset.field = field.name;
  if (field.type === 'choice') renderChoice(field,wrapper);
  else if (field.type === 'multi') renderMulti(field,wrapper);
  else if (field.type === 'country') renderCountry(field,wrapper);
  else if (field.type === 'links') renderLinks(field,wrapper);
  else renderSimple(field,wrapper);
  fieldError(wrapper,field.name); return wrapper;
}
function render() {
  const step = definition.steps[state.step];
  const list = $('#step-list'); list.replaceChildren();
  definition.steps.forEach((item,index) => { const li = el('li',index === state.step ? 'active' : index < state.step ? 'complete' : '',`${String(index+1).padStart(2,'0')}  ${item.title}`); if(index === state.step) li.setAttribute('aria-current','step'); list.append(li); });
  $('#step-position').textContent = `Step ${state.step+1} of ${definition.steps.length} · ${step.title}`;
  $('#progress-fill').style.width = `${(state.step+1)/definition.steps.length*100}%`;
  stepContent.replaceChildren();
  stepContent.append(el('p','step-kicker',`0${state.step+1} / ${step.title}`),el('h2','step-title',step.title));
  if (step.intro) stepContent.append(el('p','step-intro',step.intro));
  for (const field of step.fields) {
    if (formName === 'consultation' && state.step === 0 && field.name !== 'has_consented' && state.values.has_consented !== 'yes') continue;
    const node = renderField(field); if(node) stepContent.append(node);
  }
  if (formName === 'consultation' && state.values.has_consented === 'no' && state.step === 0) stepContent.append(el('p','decline-note','You have chosen not to participate. No response will be submitted.'));
  $('#back-button').hidden = state.step === 0;
  const next = $('#next-button'); next.textContent = state.step === definition.steps.length - 1 ? (formName === 'contribute' ? 'Express Interest' : 'Submit response') : 'Continue';
  next.disabled = state.busy || (state.step === 0 && formName === 'consultation' && state.values.has_consented === 'no') || (state.step === definition.steps.length - 1 && !ready);
  if (state.step === definition.steps.length - 1 && !ready) next.textContent = 'Submissions not open yet';
  save();
}
function showErrors(errors) {
  state.errors = errors; render();
  const first = stepContent.querySelector('.has-error');
  first?.scrollIntoView({ behavior:'smooth', block:'center' });
  first?.querySelector('input,textarea,select')?.focus();
}
async function advance() {
  if (state.busy || (state.step === definition.steps.length - 1 && !ready)) return;
  const { errors } = formName === 'consultation' && state.step === 0 && state.values.has_consented !== 'yes'
    ? { errors:{ has_consented:'Consent is required to participate.' } }
    : normalizeAndValidate(formName,state.values,state.step);
  if (Object.keys(errors).length) { showErrors(errors); return; }
  state.errors = {};
  if (state.step < definition.steps.length - 1) { state.step++; render(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  const checked = submissionPayload(formName,state.values,source);
  if (Object.keys(checked.errors).length) { showNotice('Please review your answers before submitting.','error'); state.step = definition.steps.findIndex(step => step.fields.some(field => checked.errors[field.name])); render(); return; }
  state.busy = true; render(); showNotice('Sending your response…','info');
  try {
    const response = await fetch(apiConfig.endpoint, { method:'POST', headers:{ 'Content-Type':'application/json', apikey:apiConfig.publishableKey }, body:JSON.stringify({ form:formName, ...checked.payload, website_confirm:wizard.elements.website_confirm.value }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Your response could not be sent. Please try again.');
    sessionStorage.removeItem(storageKey);
    sessionStorage.setItem(`aixsd:submitted:${formName}`,String(Date.now()));
    emit(`${formName === 'projects' ? 'project' : formName === 'contribute' ? 'contributor' : 'consultation'}_completed`);
    location.href = 'success/';
  } catch (error) { showNotice(error.message || 'Your response could not be sent. Please try again.','error'); state.busy=false; render(); }
}

$('#back-button').addEventListener('click',() => { if (state.step > 0) { state.step--; state.errors={}; render(); window.scrollTo({top:0,behavior:'smooth'}); } });
$('#next-button').addEventListener('click',advance);
wizard.addEventListener('submit',event => { event.preventDefault(); advance(); });
render();
