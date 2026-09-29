import { countries, roles, topics } from './taxonomy.js';

export const membershipVersion = 'join_v0.2';
export const membershipCountries = countries;
export const membershipRoles = roles;
export const membershipTopics = topics;

const countryIds = new Set(countries.map(([id]) => id));
const roleIds = new Set(roles.map(([id]) => id));
const topicIds = new Set(topics.map(([id]) => id));
const sourceIds = new Set(['direct', 'website', 'consultation', 'projects']);
const tidy = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const validUrl = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) && value.length <= 1000; }
  catch { return false; }
};

export function validateMembership(raw) {
  const errors = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: { form: 'Invalid submission.' }, payload: null };
  const requiredText = (name, limit) => {
    const value = tidy(raw[name]);
    if (!value) errors[name] = 'Please complete this field.';
    else if (value.length > limit) errors[name] = `Use ${limit} characters or fewer.`;
    return value;
  };
  const full_name = requiredText('full_name', 150);
  const contact_email = requiredText('contact_email', 254).toLowerCase();
  if (contact_email && !validEmail(contact_email)) errors.contact_email = 'Enter a valid email address.';
  const country_code = requiredText('country_code', 60);
  if (country_code && !countryIds.has(country_code)) errors.country_code = 'Choose a listed country or region.';
  const institution = requiredText('institution', 150);
  const current_role = requiredText('current_role', 60);
  if (current_role && !roleIds.has(current_role)) errors.current_role = 'Choose a listed role.';

  const interest_topics = Array.isArray(raw.interest_topics) ? [...new Set(raw.interest_topics.map(tidy))] : [];
  if (!interest_topics.length || interest_topics.length > 3 || interest_topics.some(id => !topicIds.has(id))) {
    errors.interest_topics = 'Choose one to three listed areas.';
  }
  const interest_topics_other = interest_topics.includes('other') ? requiredText('interest_topics_other', 150) : null;
  const profile_url = tidy(raw.profile_url) || null;
  if (profile_url && !validUrl(profile_url)) errors.profile_url = 'Enter a valid http:// or https:// URL.';
  const note = tidy(raw.note) || null;
  if (note && note.length > 500) errors.note = 'Use 500 characters or fewer.';
  if (raw.terms_ack !== true) errors.terms_ack = 'Please acknowledge the membership terms.';
  if (raw.directory_consent !== true && raw.directory_consent !== false && raw.directory_consent !== undefined) {
    errors.directory_consent = 'Choose whether to opt in.';
  }
  if (raw.form_version !== membershipVersion) errors.form_version = 'Unknown form version.';

  return {
    errors,
    payload: Object.keys(errors).length ? null : {
      source: sourceIds.has(raw.source) ? raw.source : 'direct',
      form_version: membershipVersion,
      full_name, contact_email, country_code, institution, current_role,
      interest_topics, interest_topics_other, profile_url, note,
      directory_consent: raw.directory_consent === true,
      terms_ack: true,
    },
  };
}
