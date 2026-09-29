// Stable IDs are stored; labels are for display only. Do not repurpose an ID.
export const topics = [
  ['health', 'AI & Health'],
  ['climate_environment', 'Climate & Environment'],
  ['circular_economy', 'Circular Economy & Zero Waste'],
  ['education', 'Education'],
  ['cities_infrastructure', 'Cities & Infrastructure'],
  ['responsible_ai', 'Responsible AI'],
  ['governance_policy', 'Governance & Public Policy'],
  ['economic_social_development', 'Economic & Social Development'],
  ['other', 'Other'],
];

export const roles = [
  ['undergraduate', 'Undergraduate student'],
  ['masters', "Master's student"],
  ['doctoral', 'Doctoral student'],
  ['researcher_academic', 'Researcher / academic'],
  ['professional_practitioner', 'Professional / practitioner'],
  ['civil_society_youth', 'Civil society / youth initiative'],
  ['other', 'Other'],
];

export const contributionTypes = [
  ['research_analysis', 'Research & analysis'],
  ['writing', 'Writing'],
  ['literature_review', 'Literature review'],
  ['review', 'Review & feedback'],
  ['data_analysis', 'Data analysis'],
  ['technical', 'Technical development'],
  ['case_mapping', 'Case mapping'],
  ['design_communication', 'Design & communication'],
  ['outreach', 'Outreach'],
  ['convening', 'Convening'],
  ['project_leadership', 'Project leadership'],
  ['other', 'Other'],
];

// ISO 3166-1 alpha-2 codes. Names come from the visitor's Intl locale data.
export const countryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(' ');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const countries = countryCodes
  .map(code => [code, regionNames.of(code)])
  .sort((a, b) => a[1].localeCompare(b[1]));
