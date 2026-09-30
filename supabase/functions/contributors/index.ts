import { withSupabase } from 'npm:@supabase/server@^1';
import { countryLabel } from '../../../data/taxonomy.js';

const sources = [
  { table:'consultation_responses', label:'Youth Consultation', approval:'public_listing_status' },
  { table:'project_submissions', label:'Project Mapping', approval:'public_listing_status' },
  { table:'contributor_interests', label:'First Contribution', approval:'review_status' },
] as const;

export default {
  fetch: withSupabase({ auth:'publishable' }, async (request, context) => {
    if (request.method !== 'GET') return Response.json({ error:'Method not allowed.' }, { status:405 });
    const origin = request.headers.get('origin');
    const origins = (Deno.env.get('PUBLIC_SITE_ORIGINS') || '').split(',').map(item => item.trim()).filter(Boolean);
    if (!origin || !origins.includes(origin)) return Response.json({ error:'Origin not allowed.' }, { status:403 });

    const cutoff = new Date();
    cutoff.setUTCMonth(cutoff.getUTCMonth() - 12);
    const contributors: Array<{name:string; affiliation?:string; region?:string; contribution:string; sortDate:string}> = [];
    for (const source of sources) {
      let query = context.supabaseAdmin.from(source.table)
        .select('created_at, public_acknowledgement, public_display_name, public_affiliation, public_region_code')
        .eq(source.approval,'approved')
        .neq('public_acknowledgement','unlisted')
        .gte('created_at',cutoff.toISOString())
        .order('created_at',{ ascending:false })
        .limit(500);
      const { data, error } = await query;
      if (error) { console.error('Contributor listing query failed', error.code); return Response.json({ error:'Acknowledgements unavailable.' }, { status:503 }); }
      for (const row of data || []) {
        if (!row.public_display_name || !row.created_at) continue;
        const date = new Date(row.created_at);
        if (Number.isNaN(date.getTime())) continue;
        const month = new Intl.DateTimeFormat('en',{ month:'short', year:'numeric', timeZone:'UTC' }).format(date);
        contributors.push({
          name:row.public_display_name,
          ...(row.public_acknowledgement === 'name_affiliation' && row.public_affiliation ? { affiliation:row.public_affiliation } : {}),
          ...(row.public_region_code && countryLabel(row.public_region_code) ? { region:countryLabel(row.public_region_code)! } : {}),
          contribution:`${source.label} · ${month}`,
          sortDate:row.created_at,
        });
      }
    }
    contributors.sort((a,b) => b.sortDate.localeCompare(a.sortDate));
    return Response.json({ contributors:contributors.map(({sortDate: _sortDate, ...entry}) => entry) }, { headers:{ 'Cache-Control':'no-store' } });
  }),
};
