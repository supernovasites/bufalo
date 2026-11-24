import {ensureNps} from '../_lib/chopeira-nps.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'none'; sandbox"};
const json=(data,status=200)=>Response.json(data,{status,headers});
export async function onRequest({request,env}){
 if(request.method!=='GET')return json({error:'Método não permitido.'},405);
 const id=new URL(request.url).searchParams.get('id')||'';
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))return json({error:'Foto inválida.'},400);
 if(!env.LIVE_DB)return json({error:'Pesquisa temporariamente indisponível.'},503);
 try{
  const db=env.LIVE_DB;await ensureNps(db);
  const row=await db.prepare("SELECT p.content_type,p.data FROM chopeira_nps_photos p INNER JOIN chopeira_nps n ON n.id=p.id INNER JOIN chopeira_nps_consents c ON c.id=n.id WHERE p.id=? AND n.has_photo=1 AND c.version='review-publication-20261124'").bind(id).first();
  if(!row)return json({error:'Foto não encontrada.'},404);
  return new Response(Uint8Array.from(row.data),{headers:{...headers,'Content-Type':row.content_type}});
 }catch{return json({error:'Não foi possível carregar a foto.'},503);}
}
