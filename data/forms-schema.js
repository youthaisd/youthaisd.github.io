import { topics, roles, contributionTypes, countries } from './taxonomy.js';

const choice = (name, label, options, required = true, extra = {}) => ({ name, label, type: 'choice', options, required, ...extra });
const multi = (name, label, options, required = true, extra = {}) => ({ name, label, type: 'multi', options, required, ...extra });
const text = (name, label, required = true, extra = {}) => ({ name, label, type: 'text', required, ...extra });
const area = (name, label, required = false, extra = {}) => ({ name, label, type: 'textarea', required, ...extra });
const other = (name, label = 'Please specify') => text(name, label, true, { maxLength: 150, showIfOther: true });

export const engagement = [
  ['research','Research'], ['coursework','Coursework'], ['project','Project'],
  ['competition_hackathon','Competition / hackathon'], ['conference_workshop','Conference / workshop'],
  ['youth_community','Youth community'], ['professional_work','Professional work'],
  ['policy_consultation','Policy consultation'], ['none','None so far'], ['other','Other'],
];
export const barriers = [
  ['reliable_information','Reliable information'], ['datasets','Datasets'],
  ['research_opportunities','Research opportunities'], ['collaborators','Collaborators'],
  ['mentors_experts','Mentors / experts'], ['technical_skills','Technical skills'],
  ['real_world_problems','Access to real-world problems'], ['institutional_access','Institutional access'],
  ['funding_resources','Funding / resources'], ['time','Time'], ['where_to_start','Knowing where to start'], ['other','Other'],
];
export const resources = [
  ['research_briefs','Research briefs'], ['case_studies','Case studies'],
  ['dataset_directory','Dataset directory'], ['opportunity_directory','Opportunity directory'],
  ['collaboration_matching','Collaboration matching'], ['researcher_mentor_access','Researcher / mentor access'],
  ['practical_guides','Practical guides'], ['small_group_discussions','Small-group discussions'],
  ['training_workshops','Training / workshops'], ['ai_tools_demos','AI tool demonstrations'],
  ['knowledge_platform','Knowledge platform'], ['other','Other'],
];
export const projectNeeds = [
  ['research_collaborators','Research collaborators'], ['technical_collaborators','Technical collaborators'],
  ['domain_experts','Domain experts'], ['mentorship','Mentorship'], ['datasets','Datasets'],
  ['feedback','Feedback'], ['testing_users','Testing users'], ['visibility','Visibility'],
  ['funding','Funding'], ['institutional_connections','Institutional connections'],
  ['nothing_currently','Nothing currently'], ['other','Other'],
];
export const sdgs = Array.from({ length: 17 }, (_, index) => [String(index + 1), `SDG ${index + 1}`]);
export const sourceIds = ['direct', 'consultation', 'projects', 'website'];

export const forms = {
  consultation: {
    title: 'Youth Consultation on AI & Sustainable Development',
    subtitle: 'Understanding needs, barriers and opportunities for meaningful youth engagement.',
    intro: 'This exploratory consultation seeks to understand how young people engage with AI and sustainable development, what barriers they encounter, and what resources or opportunities would be most useful. Responses may be analysed in aggregate and used to inform a public consultation brief. Individual responses will not be publicly attributed without explicit permission. Participation is voluntary.',
    duration: '4–6 minutes', version: 'consultation_v1.0',
    steps: [
      { title: 'About You', fields: [
        choice('has_consented','I have read the information above and agree to participate in this consultation.',[['yes','Yes'],['no','No']],true,{ consent: true }),
        { name:'is_adult', label:'I confirm that I am at least 18 years old.', type:'checkbox', required:true },
        { name:'country_code', label:'Where are you currently based?', type:'country', options:[...countries,['prefer_not_to_say','Prefer not to say']], required:true },
        choice('current_role','Which best describes you?',roles),
        multi('interest_topics','Which areas related to AI and sustainable development are you most interested in?',topics,true,{ max:3, otherField:'interest_topics_other' }), other('interest_topics_other'),
      ]},
      { title: 'Experience', fields: [
        choice('familiarity_score','How familiar are you with applications of AI in sustainable development?',[[1,'1 · Not familiar at all'],[2,'2 · Slightly familiar'],[3,'3 · Moderately familiar'],[4,'4 · Very familiar'],[5,'5 · Extremely familiar']]),
        multi('engagement_types','How have you previously engaged with AI and sustainable development?',engagement,true,{ exclusive:'none', otherField:'engagement_other' }), other('engagement_other'),
      ]},
      { title: 'Needs & Barriers', fields: [
        multi('top_barriers','What currently makes it difficult for you to engage more meaningfully with AI and sustainable development?',barriers,true,{ max:3, otherField:'barriers_other' }), other('barriers_other'),
        area('barrier_context','Is there a barrier or challenge you would like to explain further?',false,{ maxLength:500 }),
      ]},
      { title: 'What Would Help', fields: [
        multi('desired_resources','Which types of resources or opportunities would be most useful to you?',resources,true,{ max:3, otherField:'resources_other' }), other('resources_other'),
        area('ideal_solution','If one thing could be created or improved to help young people work more effectively at the intersection of AI and sustainable development, what would you want it to be?',false,{ maxLength:800, emphasized:true }),
      ]},
      { title: 'Looking Ahead', fields: [
        multi('future_priorities','Which areas would you most like to see explored through future research or projects?',topics,true,{ max:3, otherField:'future_priorities_other' }), other('future_priorities_other'),
        choice('contribution_interest','Would you be interested in contributing to future AI×SD research, projects or discussions?',[['yes','Yes'],['maybe','Maybe'],['not_now','Not now']]),
        multi('contribution_preferences','How might you be interested in contributing?',contributionTypes,false,{ showIf:{ field:'contribution_interest', in:['yes','maybe'] } }),
        choice('followup_consent','May we contact you about relevant follow-up opportunities related to this consultation?',[['yes','Yes'],['no','No']]),
        { name:'contact_email', label:'Email address', type:'email', required:true, showIf:{ field:'followup_consent', in:['yes'] } },
        text('contact_name','Name or preferred name',false,{ maxLength:150, showIf:{ field:'followup_consent', in:['yes'] } }),
        area('final_comment','Is there anything else this initiative should understand, explore or do differently?',false,{ maxLength:800 }),
      ]},
    ],
  },
  projects: {
    title:'Share a Project or Case', subtitle:'Map work at the intersection of AI and sustainable development.',
    intro:'We are mapping projects, research, tools and practical cases. Submissions may inform future research, case collections or public resources. Submission does not guarantee publication, endorsement or partnership with AI×SD.',
    duration:'3–5 minutes', version:'projects_v1.0',
    steps:[
      { title:'Project', fields:[
        { name:'is_adult', label:'I confirm that I am at least 18 years old.', type:'checkbox', required:true },
        text('project_title','Project title',true,{ maxLength:150 }),
        choice('project_type','Which best describes this work?',[['research','Research'],['student_project','Student project'],['community_initiative','Community initiative'],['tool_platform','Tool / platform'],['startup_social_enterprise','Startup / social enterprise'],['educational_project','Educational project'],['dataset_open_resource','Dataset / open resource'],['other','Other']],true,{ otherField:'project_type_other' }), other('project_type_other'),
        choice('project_stage','What stage is the project currently at?',[['idea','Idea'],['early_development','Early development'],['prototype','Prototype'],['active','Active'],['ongoing_research','Ongoing research'],['completed','Completed']]),
        { name:'project_region', label:'Where is the project primarily based or implemented?', type:'country', options:[...countries,['international','International'],['online','Online'],['other','Other']], required:true },
        multi('project_topics','Which areas does this project relate to?',topics,true,{ max:3, otherField:'project_topics_other' }), other('project_topics_other'),
        multi('sdgs','Which Sustainable Development Goals, if any, are particularly relevant?',sdgs,false,{ hint:'Optional. You do not need to assign an SDG if it is not useful for describing the project.' }),
      ]},
      { title:'The Work', fields:[
        area('problem_description','What problem or need does the project address?',true,{ maxWords:150 }),
        area('ai_role','How is AI used, studied or considered in the project?',true,{ maxWords:150 }),
        area('progress_description','What has the project done or produced so far?',true,{ maxWords:150, dynamicLabel:{ field:'project_stage', equals:'idea', label:'What do you plan to develop or investigate?' } }),
      ]},
      { title:'Evidence', fields:[{ name:'project_links', label:'Project links', type:'links', required:false, max:3, kinds:[['website','Website'],['github','GitHub'],['paper','Paper'],['demo','Demo'],['other','Other']] }]},
      { title:'Needs', fields:[multi('project_needs','What would help this project move forward?',projectNeeds,true,{ max:3, exclusive:'nothing_currently', otherField:'project_needs_other' }), other('project_needs_other')]},
      { title:'Permission', fields:[
        choice('public_use_permission','May AI×SD consider this submission for inclusion in a future public brief, case collection or project directory?',[['yes','Yes'],['contact_first','Contact me first'],['internal_only','Internal use only']]),
        choice('submitter_relationship','What is your relationship to this project?',[['founder','Founder'],['team_member','Team member'],['researcher','Researcher'],['participant','Participant'],['public_project_third_party','Public-project third party'],['other','Other']],true,{ noticeIf:{ value:'public_project_third_party', text:'Please submit only information that is already publicly available.' } }),
        text('contact_name','Name or preferred name',true,{ maxLength:150 }),
        { name:'contact_email', label:'Email address', type:'email', required:true },
        text('organisation','Organisation / team',false,{ maxLength:150 }),
        { name:'submission_confirmed', label:'I confirm that the information is accurate to the best of my knowledge and that I have the right to share any non-public information included here.', type:'checkbox', required:true },
      ]},
    ],
  },
  contribute: {
    title:'Contribute to AI×SD', subtitle:'Express interest in future research, publications, projects and discussions.',
    intro:'This form expresses interest in substantive research, projects or discussions. Submitting it does not confer Contributor status or a representative role. Recognition follows actual contribution.',
    duration:'3–5 minutes', version:'contribute_v1.0',
    steps:[
      { title:'About You', fields:[
        { name:'is_adult', label:'I confirm that I am at least 18 years old.', type:'checkbox', required:true },
        text('contact_name','Preferred name',true,{ maxLength:150 }),
        { name:'contact_email', label:'Email address', type:'email', required:true },
        { name:'country_code', label:'Country / region', type:'country', options:countries, required:true },
        choice('current_role','Which best describes you?',roles),
        text('main_field','What is your main field, discipline or area of expertise?',true,{ maxLength:150 }),
      ]},
      { title:'Contribution', fields:[
        multi('contribution_types','How might you like to contribute?',contributionTypes,true,{ max:3, otherField:'contribution_types_other' }), other('contribution_types_other'),
        multi('contribution_topics','Which areas are you most interested in contributing to?',topics,true,{ max:3, otherField:'contribution_topics_other' }), other('contribution_topics_other'),
      ]},
      { title:'First Contribution', intro:'Make a small first contribution. Choose one. We are more interested in how you think than in polished writing.', fields:[
        choice('micro_contribution_type','Choose a starting point',[['identify_gap','Identify a gap'],['share_resource','Share a resource'],['suggest_project','Suggest a project']]),
        area('micro_contribution_text','What is one underexplored problem or question at the intersection of AI and sustainable development that deserves more attention?',true,{ maxWords:200, minWords:80, showIf:{ field:'micro_contribution_type', in:['identify_gap'] } }),
        { name:'micro_contribution_url', label:'Resource title or link', type:'text', required:true, maxLength:500, showIf:{ field:'micro_contribution_type', in:['share_resource'] } },
        area('micro_resource_explanation','Why do you think this resource is useful?',true,{ maxWords:150, minWords:50, showIf:{ field:'micro_contribution_type', in:['share_resource'] } }),
        area('micro_project_idea','Suggest one small research or practical project that AI×SD could realistically explore.',true,{ maxWords:200, minWords:80, showIf:{ field:'micro_contribution_type', in:['suggest_project'] } }),
      ]},
      { title:'Availability', fields:[
        choice('time_availability','How much time would you realistically be able to contribute?',[['occasional','Occasionally'],['1_2_hours_month','1–2 hours / month'],['2_4_hours_month','2–4 hours / month'],['4_plus_hours_month','4+ hours / month'],['depends_on_project','Depends on the project']]),
        multi('involvement_types','What type of involvement would you prefer?',[['one_off','One-off contribution'],['short_projects','Short projects'],['ongoing_research','Ongoing research'],['review_advisory','Review / advisory work'],['open_to_different','Open to different formats']]),
      ]},
      { title:'Profile', fields:[{ name:'profile_links', label:'Is there anything you would like us to see?', type:'links', required:false, max:4, kinds:[['orcid','ORCID'],['google_scholar','Google Scholar'],['github','GitHub'],['linkedin','LinkedIn'],['personal_website','Personal website'],['portfolio','Portfolio'],['other','Other']] }]},
    ],
  },
};

export function fieldList(form) { return forms[form].steps.flatMap(step => step.fields); }
export function isVisible(field, values) {
  if (field.showIfOther) {
    const parent = fieldList(currentFormForField(field.name)).find(item => item.otherField === field.name);
    const selected = values[parent?.name];
    return Array.isArray(selected) ? selected.includes('other') : selected === 'other';
  }
  return !field.showIf || field.showIf.in.includes(values[field.showIf.field]);
}
function currentFormForField(name) { return Object.keys(forms).find(key => fieldList(key).some(field => field.name === name)); }

export function cleanSource(source) { return sourceIds.includes(source) ? source : 'direct'; }
