import { ensureHomepageStats, belemDay } from '../_lib/home-analytics.js';

const deny = (status, error) => new Response(JSON.stringify({error}), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequestPost({ request, env }) {
  if (!env.LIVE_DB) return deny(503, 'Contador indisponível.');
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const site = request.headers.get('Sec-Fetch-Site');
  if ((origin && origin !== url.origin) || (site && !['same-origin','none'].includes(site))) return deny(403, 'Origem inválida.');
  if (/bot|crawler|spider|headless|preview/i.test(request.headers.get('User-Agent') || '')) return new Response(null, {status:204});
  const raw = await request.text();
  if (raw.length > 700) return deny(413, 'Evento muito grande.');
  let data;
  try { data = JSON.parse(raw); } catch { return deny(400, 'Evento inválido.'); }
  if (!data || !['click','view'].includes(data.kind) || !['mobile','tablet','desktop'].includes(data.device)) return deny(400, 'Evento inválido.');
  if (typeof data.section !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(data.section) ||
      typeof data.key !== 'string' || !/^[a-zA-Z0-9_:/.%-]{1,180}$/.test(data.key)) return deny(400, 'Identificador inválido.');
  if (data.kind === 'view' && (data.section !== 'homepage' || data.key !== 'page-load')) return deny(400, 'Visualização inválida.');
  if (typeof data.label !== 'string' || typeof data.target !== 'string') return deny(400, 'Campos inválidos.');
  const label = data.label.replace(/\s+/g,' ').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,100);
  const target = data.target.replace(/[?#].*$/,'').trim().slice(0,180);
  if (!label || /@|\b\d{8,}\b/.test(label) || !/^[a-zA-Z0-9/:._%-]*$/.test(target)) return deny(400, 'Rótulo inválido.');
  await ensureHomepageStats(env.LIVE_DB);
  await env.LIVE_DB.prepare("INSERT INTO homepage_interactions (day,device,kind,section,element_key,label,target,total) VALUES (?,?,?,?,?,?,?,1) ON CONFLICT(day,device,kind,section,element_key) DO UPDATE SET total=total+1,label=excluded.label,target=excluded.target")
    .bind(belemDay(),data.device,data.kind,data.section,data.key,label,target).run();
  return new Response(null, {status:204, headers:{'Cache-Control':'no-store'}});
}
export function onRequestGet() { return deny(405, 'Método não permitido.'); }
