import { withSupabase } from 'npm:@supabase/server@^1';
import { forms } from '../../../data/forms-schema.js';
import { submissionPayload } from '../../../data/validation.js';

const tables: Record<string,string> = {
  consultation: 'consultation_responses',
  projects: 'project_submissions',
  contribute: 'contributor_interests',
};
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control':'no-store' } });

async function rateKey(ip: string, salt: string, form: string) {
  const encoder = new TextEncoder();
  const secret = await crypto.subtle.importKey('raw',encoder.encode(salt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const hour = new Date().toISOString().slice(0,13);
  const digest = await crypto.subtle.sign('HMAC',secret,encoder.encode(`${form}:${hour}:${ip}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,'0')).join('');
}

export default {
  fetch: withSupabase({ auth:'publishable' }, async (request, context) => {
    if (request.method !== 'POST') return reply({ error:'Method not allowed.' },405);
    const origin = request.headers.get('origin');
    const origins = (Deno.env.get('PUBLIC_SITE_ORIGINS') || '').split(',').map(item => item.trim()).filter(Boolean);
    if (!origin || !origins.includes(origin)) return reply({ error:'Origin not allowed.' },403);
    const salt = Deno.env.get('RATE_LIMIT_SALT');
    const ip = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
    if (!salt || !ip) return reply({ error:'Submission service is not fully configured.' },503);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply({ error:'JSON is required.' },415);
    let raw: Record<string,unknown>;
    try {
      const body = await request.text();
      if (body.length > 64_000) return reply({ error:'Response is too large.' },413);
      raw = JSON.parse(body);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid body');
    } catch { return reply({ error:'Invalid JSON.' },400); }
    if (raw.website_confirm) return reply({ ok:true }); // honeypot: discard silently
    const form = String(raw.form || '');
    if (!tables[form] || raw.form_version !== forms[form].version) return reply({ error:'Unknown form version.' },400);
    const { errors, payload } = submissionPayload(form,raw,raw.source);
    if (Object.keys(errors).length) return reply({ error:'Please review the marked answers.', fields:Object.keys(errors) },422);
    const key = await rateKey(ip,salt,form);
    const { data: permitted, error: rateError } = await context.supabaseAdmin.rpc('consume_submission_rate',{p_rate_key:key});
    if (rateError) { console.error('Rate limit service failed'); return reply({ error:'Submission service is temporarily unavailable.' },503); }
    if (!permitted) return reply({ error:'Too many submissions. Please try again later.' },429);
    const { data, error } = await context.supabaseAdmin.from(tables[form]).insert(payload).select('id').single();
    if (error) { console.error('Submission insert failed', error.code); return reply({ error:'Your response could not be saved. Please try again.' },503); }
    return reply({ ok:true, reference:data.id });
  }),
};
