import assert from 'node:assert/strict';
import { countryCodes, countries, chinaRegionCodes, reportingCountryCode, countryLabel } from '../data/taxonomy.js';
import { forms, fieldList } from '../data/forms-schema.js';
import { normalizeAndValidate } from '../data/validation.js';

assert.equal(countryCodes.length, 249);
assert.equal(new Set(countryCodes).size, 249);
assert.deepEqual(countries.slice(0, 4).map(([id]) => id), ['CN', 'HK', 'MO', 'TW']);
assert.deepEqual(countries.slice(0, 4).map(([, label]) => label), [
  'Chinese mainland', 'Hong Kong SAR, China', 'Macao SAR, China', 'Taiwan, China',
]);
assert.equal(chinaRegionCodes.length, 4);
for (const id of countryCodes) assert.equal(typeof countryLabel(id), 'string', `Missing label for ${id}`);
for (const id of chinaRegionCodes) assert.equal(reportingCountryCode(id), 'CN');
assert.equal(reportingCountryCode('US'), 'US');

for (const [name, form] of Object.entries(forms)) {
  assert.equal(form.version, `${name}_v1.2`);
  const fields = fieldList(name);
  const publicRegion = fields.find(field => field.name === 'public_region_code');
  assert.equal(publicRegion.type, 'country');
  assert.deepEqual(publicRegion.options, countries);
  for (const id of chinaRegionCodes) {
    const result = normalizeAndValidate(name, { public_acknowledgement:'name', public_display_name:'Sample name', public_region_code:id });
    assert.equal(result.errors.public_region_code, undefined);
    assert.equal(result.values.public_region_code, id);
  }
  const unknown = normalizeAndValidate(name, { public_acknowledgement:'name', public_display_name:'Sample name', public_region_code:'XX' });
  assert.ok(unknown.errors.public_region_code);
  const unlisted = normalizeAndValidate(name, { public_acknowledgement:'unlisted', public_region_code:'CN' });
  assert.equal(unlisted.values.public_region_code, null);
}

assert.deepEqual(forms.consultation.steps[0].fields.find(field => field.name === 'country_code').options.at(-1), ['prefer_not_to_say', 'Prefer not to say']);
assert.deepEqual(forms.projects.steps[0].fields.find(field => field.name === 'project_region').options.slice(-3).map(([id]) => id), ['international', 'online', 'other']);
console.log('Geography contract passed');
