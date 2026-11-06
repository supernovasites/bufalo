import {ensureSurvey,validateSurvey} from '../_lib/chopeira-survey.js';
import {belemDay} from '../_lib/home-analytics.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequest({request,env}) {
  if (request.method !== 'POST') return json({error:'Método não permitido.'},405);
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({error:'Origem não permitida.'},403);
  if (!env.LIVE_DB) return json({error:'Pesquisa indisponível. Tente novamente.'},503);
  if (Number(request.headers.get('Content-Length')||0)>4096) return json({error:'Resposta muito longa.'},413);
  try {
    const raw=await request.text();
    if(raw.length>4096)return json({error:'Resposta muito longa.'},413);
    let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Resposta inválida.'},400);}
    const data=validateSurvey(payload);
    if (!data) return json({error:'Confira seu nome, WhatsApp com DDD, motivo e autorização de contato.'},400);
    await ensureSurvey(env.LIVE_DB);
    await env.LIVE_DB.prepare('INSERT OR IGNORE INTO chopeira_surveys (id,name,phone,reasons,other,device,day,created_at,consent) VALUES (?,?,?,?,?,?,?,?,1)').bind(data.id,data.name,data.phone,JSON.stringify(data.reasons),data.other,data.device,belemDay(),new Date().toISOString()).run();
    return json({ok:true});
  } catch { return json({error:'Não foi possível salvar. Tente novamente.'},503); }
}
