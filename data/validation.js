import { forms, fieldList, isVisible, cleanSource } from './forms-schema.js';

export const wordCount = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tidy = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const isWebUrl = value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };

export function normalizeAndValidate(formName, raw, stepIndex = null) {
  const form = forms[formName];
  if (!form || !raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors:{ form:'Invalid submission.' }, values:{} };
  const errors = {};
  const values = {};
  const fields = stepIndex === null ? fieldList(formName) : form.steps[stepIndex]?.fields || [];
  for (const field of fields) {
    if (!isVisible(field, raw)) continue;
    const original = raw[field.name];
    const missingMessage = 'Please answer this question.';
    if (field.type === 'multi') {
      const selected = Array.isArray(original) ? [...new Set(original.map(String))] : [];
      const allowed = new Set(field.options.map(([id]) => String(id)));
      if (selected.some(id => !allowed.has(id))) errors[field.name] = 'Please choose a listed option.';
      else if (field.required && !selected.length) errors[field.name] = missingMessage;
      else if (field.max && selected.length > field.max) errors[field.name] = `Select no more than ${field.max}.`;
      else if (field.exclusive && selected.includes(field.exclusive) && selected.length > 1) errors[field.name] = 'This option cannot be combined with others.';
      values[field.name] = selected;
    } else if (field.type === 'choice') {
      const value = original === undefined || original === null ? '' : String(original);
      const allowed = field.options.map(([id]) => String(id));
      if (field.required && !value) errors[field.name] = missingMessage;
      else if (value && !allowed.includes(value)) errors[field.name] = 'Please choose a listed option.';
      values[field.name] = value || null;
    } else if (field.type === 'country') {
      const value = tidy(original);
      if (field.required && !value) errors[field.name] = missingMessage;
      else if (value && !field.options.some(([id]) => id === value)) errors[field.name] = 'Choose a country or listed alternative.';
      values[field.name] = value || null;
    } else if (field.type === 'checkbox') {
      const value = original === true;
      if (field.required && !value) errors[field.name] = 'Please confirm before continuing.';
      values[field.name] = value;
    } else if (field.type === 'links') {
      const links = Array.isArray(original) ? original.filter(item => item && tidy(item.url)) : [];
      const allowedKinds = new Set(field.kinds.map(([id]) => id));
      if (links.length > field.max) errors[field.name] = `Add no more than ${field.max} links.`;
      else if (links.some(item => !allowedKinds.has(item.type) || !isWebUrl(tidy(item.url)) || tidy(item.url).length > 1000)) errors[field.name] = 'Each link needs a valid http:// or https:// URL and type.';
      values[field.name] = links.map(item => ({ type:item.type, url:tidy(item.url) }));
    } else {
      const value = tidy(original);
      if (field.required && !value) errors[field.name] = missingMessage;
      else if (field.maxLength && value.length > field.maxLength) errors[field.name] = `Use ${field.maxLength} characters or fewer.`;
      else if (field.maxWords && wordCount(value) > field.maxWords) errors[field.name] = `Use ${field.maxWords} words or fewer.`;
      else if (field.minWords && value && wordCount(value) < field.minWords) errors[field.name] = `Please write at least ${field.minWords} words.`;
      else if (field.type === 'email' && value && (!emailPattern.test(value) || value.length > 254)) errors[field.name] = 'Enter a valid email address.';
      values[field.name] = value || null;
    }
  }
  if (stepIndex === null) {
    if (values.public_acknowledgement === 'unlisted') {
      values.public_display_name = null;
      values.public_affiliation = null;
      values.public_region = null;
    } else if (values.public_acknowledgement === 'name') {
      values.public_affiliation = null;
    }
    if (formName === 'consultation') {
      if (values.has_consented !== 'yes') errors.has_consented = 'Consent is required to participate.';
      values.has_consented = values.has_consented === 'yes';
      values.familiarity_score = Number(values.familiarity_score);
      values.followup_consent = values.followup_consent === 'yes';
      if (!values.followup_consent) { values.contact_email = null; values.contact_name = null; }
      if (!['yes','maybe'].includes(values.contribution_interest)) values.contribution_preferences = [];
    }
    if (formName === 'projects') values.sdgs = (values.sdgs || []).map(Number);
    if (formName === 'contribute') {
      const type = values.micro_contribution_type;
      if (type === 'share_resource') {
        const resource = values.micro_contribution_url || '';
        const explanation = values.micro_resource_explanation || '';
        if (isWebUrl(resource)) values.micro_contribution_text = explanation;
        else { values.micro_contribution_text = `Resource: ${resource}\n\n${explanation}`; values.micro_contribution_url = null; }
      } else if (type === 'suggest_project') { values.micro_contribution_text = values.micro_project_idea; values.micro_contribution_url = null; }
      else values.micro_contribution_url = null;
      delete values.micro_resource_explanation;
      delete values.micro_project_idea;
    }
  }
  return { errors, values };
}

export function submissionPayload(formName, raw, source) {
  const { errors, values } = normalizeAndValidate(formName, raw);
  return { errors, payload:{ ...values, source:cleanSource(source), form_version:forms[formName].version } };
}
