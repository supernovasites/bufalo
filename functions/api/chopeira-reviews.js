import {ensureNps} from '../_lib/chopeira-nps.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'};
const json=(data,status=200)=>Response.json(data,{status,headers});
export async function onRequest({request,env}){
 if(request.method!=='GET')return json({error:'Método não permitido.'},405);
 if(!env.LIVE_DB)return json({reviews:[]},503);
 try{
  const db=env.LIVE_DB;await ensureNps(db);
  const rows=(await db.prepare("SELECT n.id,n.name,n.score,n.review,n.created_at FROM chopeira_nps n WHERE n.has_photo=1 AND EXISTS(SELECT 1 FROM chopeira_nps_consents c WHERE c.id=n.id AND c.version='review-publication-20261124') AND EXISTS(SELECT 1 FROM chopeira_nps_photos p WHERE p.id=n.id) ORDER BY n.created_at DESC,n.id DESC LIMIT 50").all()).results||[];
  return json({reviews:rows.map(({id,name,score,review,created_at})=>({id,name,score,review}))});
 }catch{return json({error:'Não foi possível carregar as avaliações.'},503);}
}
