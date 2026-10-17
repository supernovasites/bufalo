import {schema} from './email-schema.js';
import {reportSchema,overview,report} from './email-reports.js';
import {normalizeEmail, validateContent, renderEmail, escapeHtml, safeUrl} from '../../mkt/email/core.js';

const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const sha = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const token = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const changes = result => result.meta?.changes ?? result.changes ?? 0;
const fail = (error,status=400) => { throw Object.assign(new Error(error),{status}); };
const security = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...security,'Content-Type':'application/json; charset=utf-8'}});
const html = body => new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preferências de email · Búfalo</title><link rel="stylesheet" href="/live/admin.css"><main class="shell"><div class="eyebrow">BÚFALO GROWLER</div>${body}</main></html>`,{headers:{...security,'Content-Type':'text/html; charset=utf-8'}});
async function readLimited(request,limit=300000) {
  if(Number(request.headers.get('Content-Length')||0)>limit)fail('Arquivo ou conteúdo grande demais.',413);
  if(!request.body)return '';
  const reader=request.body.getReader(),chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();fail('Arquivo ou conteúdo grande demais.',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(bytes);
}
async function body(request) {
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))fail('Envie JSON.',415);
  let result;try{result=JSON.parse(await readLimited(request));}catch(e){if(e.status)throw e;fail('Pedido inválido.');}
  if(!result||typeof result!=='object'||Array.isArray(result))fail('Pedido inválido.');return result;
}
export async function authenticated(request,db) {
  const value=request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!value)return false;
  return !!await db.prepare('SELECT token FROM live_sessions WHERE token=? AND expires>?').bind(await sha(value),Date.now()).first();
}
export async function ensureSchema(db) {
  for(const statement of (schema+reportSchema).split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
}
export function configuration(env,origin) {
  const publicOrigin=env.MKT_PUBLIC_ORIGIN || 'https://www.bufalogrowler.com.br';
  const missing=[];
  if(!env.RESEND_API_KEY)missing.push('Chave do Resend');
  if(!normalizeEmail(env.MKT_FROM_EMAIL))missing.push('Email do remetente verificado');
  if(!normalizeEmail(env.MKT_REPLY_TO))missing.push('Email para respostas');
  if(!env.MKT_COMPANY_ADDRESS?.trim())missing.push('Endereço da empresa');
  if(!env.RESEND_WEBHOOK_SECRET?.startsWith('whsec_'))missing.push('Webhook de entregas');
  if(env.MKT_ENABLED!=='true')missing.push('Ativação dos envios');
  if(!safeUrl(publicOrigin,false)||new URL(publicOrigin).origin!==publicOrigin)missing.push('Domínio público válido');
  if(origin!==publicOrigin || (env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH!=='main'))missing.push('Envio disponível apenas no domínio de produção');
  return {ready:!missing.length,missing,from:normalizeEmail(env.MKT_FROM_EMAIL)||'',replyTo:normalizeEmail(env.MKT_REPLY_TO)||'',address:env.MKT_COMPANY_ADDRESS||'',publicOrigin};
}
const contentOf = value => {try{return validateContent(value);}catch(e){fail(e.message);}};
const validId = value => typeof value==='string' && /^[a-f0-9-]{36}$/.test(value);
const shortText = (value,max=120) => typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\x00-\x1f]/.test(value);
async function summary(db,id) {
  const campaign=await db.prepare('SELECT * FROM mkt_campaigns WHERE id=?').bind(id).first();
  if(!campaign)fail('Campanha não encontrada.',404);
  const counts=(await db.prepare('SELECT status,COUNT(*) AS count FROM mkt_recipients WHERE campaign_id=? GROUP BY status').bind(id).all()).results;
  return {...campaign,content:JSON.parse(campaign.content),counts:Object.fromEntries(counts.map(c=>[c.status,c.count]))};
}
async function importContacts(db,p) {
  if(!shortText(p.name)||!shortText(p.source,300)||p.consent!==true)fail('Informe o nome, a origem e a autorização dos contatos.');
  if(!Array.isArray(p.contacts)||!p.contacts.length||p.contacts.length>250)fail('Envie de 1 a 250 contatos por lote.');
  const contacts=new Map();let invalid=0,duplicates=0;
  for(const item of p.contacts){const email=normalizeEmail(item?.email);if(!email){invalid++;continue;}if(contacts.has(email)){duplicates++;continue;}contacts.set(email,{email,name:typeof item.name==='string'?item.name.replace(/[\x00-\x1f]/g,'').trim().slice(0,100):''});}
  const id=p.listId||crypto.randomUUID(),now=Date.now();
  if(!validId(id))fail('Lista inválida.');
  if(p.listId){const list=await db.prepare('SELECT id FROM mkt_lists WHERE id=?').bind(id).first();if(!list)fail('Lista não encontrada.',404);}
  else await db.prepare('INSERT INTO mkt_lists(id,name,source,created_at) VALUES(?,?,?,?)').bind(id,p.name.trim(),p.source.trim(),now).run();
  // A reimport never clears an unsubscribe, complaint or bounce.
  for(const group of Array.from({length:Math.ceil(contacts.size/40)},(_,i)=>[...contacts.values()].slice(i*40,i*40+40))){
    await db.batch(group.flatMap(c=>[
      db.prepare("INSERT INTO mkt_contacts(email,name,token,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=CASE WHEN excluded.name<>'' THEN excluded.name ELSE mkt_contacts.name END,updated_at=excluded.updated_at").bind(c.email,c.name,token(),now,now),
      db.prepare('INSERT OR IGNORE INTO mkt_list_contacts(list_id,email,consent_at) VALUES(?,?,?)').bind(id,c.email,now)
    ]));
  }
  const stats=await db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN c.status='active' THEN 1 ELSE 0 END) AS active FROM mkt_list_contacts l JOIN mkt_contacts c ON c.email=l.email WHERE l.list_id=?").bind(id).first();
  return json({listId:id,invalid,duplicates,...stats});
}
function message(env,content,recipient,origin) {
  const unsubscribeUrl=`${origin}/mkt/email/unsubscribe?token=${recipient.token}`;
  const rendered=renderEmail(content,{name:recipient.name,unsubscribeUrl,address:env.MKT_COMPANY_ADDRESS});
  return {from:`Búfalo Growler <${normalizeEmail(env.MKT_FROM_EMAIL)}>`,to:[recipient.email],reply_to:normalizeEmail(env.MKT_REPLY_TO),...rendered,headers:{'List-Unsubscribe':`<${unsubscribeUrl}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
}
async function processBatch(db,env,campaign,origin,sendFetch) {
  const cfg=configuration(env,origin);if(!cfg.ready)fail('Configure o envio antes de continuar.',409);
  if(campaign.status!=='queued')fail('A campanha não está na fila.',409);
  const now=Date.now(),leaseId=crypto.randomUUID();
  const locked=await db.prepare('UPDATE mkt_runtime SET lease_until=?,lease_id=? WHERE id=1 AND lease_until<?').bind(now+90000,leaseId,now).run();
  if(!changes(locked))fail('Outro lote está sendo processado. Aguarde e tente novamente.',409);
  try {
    const current=await db.prepare('SELECT status FROM mkt_campaigns WHERE id=?').bind(campaign.id).first();
    if(current?.status!=='queued')fail('A campanha foi pausada. Nenhum novo lote foi iniciado.',409);
    let attempt=await db.prepare("SELECT * FROM mkt_attempts WHERE campaign_id=? AND status='pending' ORDER BY created_at LIMIT 1").bind(campaign.id).first();
    if(attempt&&now-attempt.created_at>23*60*60*1000)fail('Lote sem confirmação há mais de 23 horas. Revise no Resend antes de qualquer reenvio; o sistema bloqueou a repetição.',409);
    if(attempt){
      for(const email of JSON.parse(attempt.emails)){
        const contact=await db.prepare('SELECT status FROM mkt_contacts WHERE email=?').bind(email).first();
        if(contact?.status!=='active')fail('Um contato do lote pendente foi bloqueado. Revise o lote no Resend antes de retomar; não haverá novo disparo automático.',409);
      }
    }
    if(!attempt){
      await db.prepare("UPDATE mkt_recipients SET status='skipped',detail='Contato suprimido' WHERE campaign_id=? AND status='pending' AND email IN (SELECT email FROM mkt_contacts WHERE status<>'active')").bind(campaign.id).run();
      const recipients=(await db.prepare("SELECT r.email,r.name,c.token FROM mkt_recipients r JOIN mkt_contacts c ON c.email=r.email WHERE r.campaign_id=? AND r.status='pending' AND c.status='active' ORDER BY r.email LIMIT 10").bind(campaign.id).all()).results;
      if(!recipients.length){await db.prepare("UPDATE mkt_campaigns SET status='completed',updated_at=? WHERE id=?").bind(now,campaign.id).run();return json(await summary(db,campaign.id));}
      attempt={id:crypto.randomUUID(),campaign_id:campaign.id,payload:JSON.stringify(recipients.map(r=>message(env,campaign.content,r,cfg.publicOrigin))),emails:JSON.stringify(recipients.map(r=>r.email)),created_at:now};
      await db.prepare('INSERT INTO mkt_attempts(id,campaign_id,payload,emails,created_at) VALUES(?,?,?,?,?)').bind(attempt.id,campaign.id,attempt.payload,attempt.emails,now).run();
    }
    let response;
    try{response=await sendFetch('https://api.resend.com/emails/batch',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`bufalo/${attempt.id}`},body:attempt.payload,signal:AbortSignal.timeout(20000)});}catch{fail('O provedor não confirmou o lote. Pause e tente continuar depois; o mesmo identificador será reutilizado para evitar duplicação.',502);}
    if(!response.ok)fail(`Envio não confirmado pelo Resend (HTTP ${response.status}). Verifique configuração e limites; o lote foi preservado.`,502);
    const result=await response.json(),emails=JSON.parse(attempt.emails);
    if(!Array.isArray(result.data)||result.data.length!==emails.length||result.data.some(r=>typeof r.id!=='string'))fail('Resposta incompleta do provedor. O lote foi preservado para conferência.',502);
    await db.batch([
      ...emails.map((email,i)=>db.prepare("UPDATE mkt_recipients SET status='accepted',provider_id=? WHERE campaign_id=? AND email=? AND status='pending'").bind(result.data[i].id,campaign.id,email)),
      ...emails.map((email,i)=>db.prepare("INSERT OR IGNORE INTO mkt_activity(id,campaign_id,email,type,occurred_at,received_at) VALUES(?,?,?,'accepted',?,?)").bind('accepted/'+result.data[i].id,campaign.id,email,Date.now(),Date.now())),
      db.prepare("UPDATE mkt_attempts SET status='done' WHERE id=?").bind(attempt.id)
    ]);
    // Webhook may arrive before this transaction; a provider replay reconciles it.
    return json(await summary(db,campaign.id));
  } finally {await db.prepare('UPDATE mkt_runtime SET lease_until=0,lease_id=NULL WHERE id=1 AND lease_id=?').bind(leaseId).run();}
}
export async function verifyWebhook(raw,headers,secret,now=Date.now()) {
  const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signatures=headers.get('svix-signature');
  if(!id||id.length>200||!/^\d+$/.test(timestamp||'')||Math.abs(now/1000-Number(timestamp))>300||!signatures||!secret?.startsWith('whsec_'))return false;
  try{
    const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(secret.slice(6)),c=>c.charCodeAt(0)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    for(const entry of signatures.split(' ')){const [version,value]=entry.split(',');if(version!=='v1'||!value)continue;if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(value),c=>c.charCodeAt(0)),encoder.encode(`${id}.${timestamp}.${raw}`)))return true;}
  }catch{}return false;
}
async function webhook(request,env) {
  if(request.method!=='POST')return json({error:'Método não permitido.'},405);
  const raw=await readLimited(request,100000);
  if(!await verifyWebhook(raw,request.headers,env.RESEND_WEBHOOK_SECRET))return json({error:'Assinatura inválida.'},401);
  let event;try{event=JSON.parse(raw);}catch{fail('Evento inválido.');}
  const statuses={'email.delivered':'delivered','email.bounced':'bounced','email.complained':'complained','email.failed':'failed','email.suppressed':'failed'};
  const status=statuses[event.type];
  if(!status&&!['email.sent','email.delivery_delayed','email.opened','email.clicked'].includes(event.type))return json({ok:true});
  const db=env.LIVE_DB;await ensureSchema(db);
  const row=await db.prepare('SELECT email,campaign_id FROM mkt_recipients WHERE provider_id=?').bind(event.data?.email_id||'').first();
  // Tests and other applications do not have campaign recipients. Only retry
  // unmatched events while a campaign batch could still be awaiting its IDs.
  if(!row){
    const pending=await db.prepare("SELECT id FROM mkt_attempts WHERE status='pending' LIMIT 1").first();
    return pending?json({error:'Envio ainda não conciliado. Repetir evento.'},503):json({ok:true});
  }
  const id=request.headers.get('svix-id');
  if(await db.prepare('SELECT id FROM mkt_events WHERE id=?').bind(id).first())return json({ok:true});
  const received=Date.now(),parsed=Date.parse(event.created_at),occurred=Number.isFinite(parsed)&&parsed>0&&parsed<=received+300000?parsed:received;
  let detail=String(event.data?.bounce?.message||event.data?.failed?.reason||event.data?.suppressed?.reason||event.data?.error?.message||'').replace(/[\x00-\x1f]/g,' ').slice(0,500);
  if(event.type==='email.clicked'){
    try{const link=new URL(event.data?.click?.link);detail=['https:','http:'].includes(link.protocol)?(link.origin+link.pathname).slice(0,1000):'';}catch{detail='';}
  }
  const statements=[db.prepare('INSERT OR IGNORE INTO mkt_events(id,created_at) VALUES(?,?)').bind(id,received),
    db.prepare('INSERT OR IGNORE INTO mkt_activity(id,campaign_id,email,type,occurred_at,received_at,detail) VALUES(?,?,?,?,?,?,?)').bind(id,row.campaign_id,row.email,event.type,occurred,received,detail)];
  if(status)statements.push(db.prepare("UPDATE mkt_recipients SET status=?,detail=? WHERE provider_id=? AND (status NOT IN ('complained','bounced') OR ?='complained') AND NOT (status='delivered' AND ?='failed')").bind(status,detail||null,event.data.email_id,status,status));
  if(status==='bounced'||status==='complained')statements.push(db.prepare("UPDATE mkt_contacts SET status=CASE WHEN status='complained' THEN status ELSE ? END,updated_at=? WHERE email=?").bind(status,Date.now(),row.email));
  await db.batch(statements);return json({ok:true});
}
async function unsubscribe(request,env,url) {
  const value=url.searchParams.get('token');
  if(!/^[a-f0-9]{64}$/.test(value||''))return html('<h1>Link inválido.</h1><p>Use o link de descadastro recebido no seu email.</p>');
  if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
  if(request.method==='POST'){
    await env.LIVE_DB.prepare("UPDATE mkt_contacts SET status=CASE WHEN status='active' THEN 'unsubscribed' ELSE status END,updated_at=? WHERE token=?").bind(Date.now(),value).run();
    return html('<h1>Preferência registrada.</h1><p>Este endereço não receberá novas campanhas da Búfalo. Emails já aceitos pelo provedor podem estar a caminho.</p>');
  }
  return html(`<h1>Parar de receber emails?</h1><p>Confirme abaixo para sair das campanhas da Búfalo.</p><form method="post" action="/mkt/email/unsubscribe?token=${escapeHtml(value)}"><button class="btn" type="submit">Confirmar descadastro</button></form>`);
}
async function handle(context,sendFetch) {
  const {request,env}=context,url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
  if(!env.LIVE_DB)return json({error:'Banco administrativo não configurado.'},503);
  if(path==='/mkt/email/webhook')return webhook(request,env);
  if(path==='/mkt/email/unsubscribe')return unsubscribe(request,env,url);
  const api=path.startsWith('/mkt/email/api/');
  if(!await authenticated(request,env.LIVE_DB))return api?json({error:'Sua sessão expirou. Entre pelo painel.'},401):new Response(null,{status:302,headers:{...security,Location:new URL('/painel/',url).href}});
  if(!api){const response=await context.next();return new Response(response.body,{status:response.status,headers:{...Object.fromEntries(response.headers),...security}});}
  if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
  const db=env.LIVE_DB;await ensureSchema(db);
  if(path==='/mkt/email/api/state'&&request.method==='GET'){
    const templates=(await db.prepare('SELECT * FROM mkt_templates WHERE id NOT IN (SELECT template_id FROM mkt_archived_templates) ORDER BY updated_at DESC LIMIT 100').all()).results.map(t=>({...t,content:JSON.parse(t.content)}));
    const archivedTemplates=(await db.prepare('SELECT t.id,t.name,a.archived_at FROM mkt_templates t JOIN mkt_archived_templates a ON a.template_id=t.id ORDER BY a.archived_at DESC LIMIT 100').all()).results;
    const lists=(await db.prepare("SELECT l.*,COUNT(c.email) AS total,COALESCE(SUM(CASE WHEN c.status='active' THEN 1 ELSE 0 END),0) AS active FROM mkt_lists l LEFT JOIN mkt_list_contacts lc ON lc.list_id=l.id LEFT JOIN mkt_contacts c ON c.email=lc.email GROUP BY l.id ORDER BY l.created_at DESC LIMIT 100").all()).results;
    const campaigns=(await db.prepare('SELECT id,name,list_id,status,updated_at FROM mkt_campaigns ORDER BY updated_at DESC LIMIT 100').all()).results;
    return json({config:configuration(env,url.origin),templates,archivedTemplates,lists,campaigns});
  }
  const templateDetail=path.match(/^\/mkt\/email\/api\/templates\/([a-f0-9-]{36})$/);
  if(templateDetail&&request.method==='GET'){
    const template=await db.prepare('SELECT * FROM mkt_templates WHERE id=? AND id NOT IN (SELECT template_id FROM mkt_archived_templates)').bind(templateDetail[1]).first();
    if(!template)fail('Template não encontrado ou excluído.',404);
    return json({...template,content:JSON.parse(template.content)});
  }
  const detail=path.match(/^\/mkt\/email\/api\/campaigns\/([a-f0-9-]{36})$/);
  if(detail&&request.method==='GET')return json(await summary(db,detail[1]));
  if(path==='/mkt/email/api/reports'&&request.method==='GET')return json(await overview(db));
  const resultPath=path.match(/^\/mkt\/email\/api\/reports\/([a-f0-9-]{36})(\/events)?$/);
  if(resultPath&&request.method==='GET'){
    const result=await report(db,resultPath[1],url.searchParams);if(!result)fail('Campanha não encontrada.',404);
    if(resultPath[2])return json({events:(await db.prepare('SELECT type,occurred_at,detail FROM mkt_activity WHERE campaign_id=? AND email=? ORDER BY occurred_at DESC,id DESC LIMIT 100').bind(resultPath[1],(url.searchParams.get('email')||'').slice(0,254)).all()).results});
    return json(result);
  }
  if(request.method!=='POST')return json({error:'Rota não encontrada.'},404);
  const p=await body(request),now=Date.now();
  const templateAction=path.match(/^\/mkt\/email\/api\/templates\/([a-f0-9-]{36})\/(archive|restore)$/);
  if(templateAction){
    if(!await db.prepare('SELECT id FROM mkt_templates WHERE id=?').bind(templateAction[1]).first())fail('Template não encontrado.',404);
    if(templateAction[2]==='archive')await db.prepare('INSERT OR IGNORE INTO mkt_archived_templates(template_id,archived_at) VALUES(?,?)').bind(templateAction[1],now).run();
    else await db.prepare('DELETE FROM mkt_archived_templates WHERE template_id=?').bind(templateAction[1]).run();
    return json({ok:true});
  }
  if(path==='/mkt/email/api/templates'){
    const content=contentOf(p.content),id=p.id||crypto.randomUUID();if(!validId(id))fail('Template inválido.');
    if(await db.prepare('SELECT template_id FROM mkt_archived_templates WHERE template_id=?').bind(id).first())fail('Este template foi excluído. Restaure-o ou salve uma nova mensagem.',409);
    await db.prepare('INSERT INTO mkt_templates(id,name,content,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,content=excluded.content,updated_at=excluded.updated_at').bind(id,content.name,JSON.stringify(content),now).run();return json({id});
  }
  if(path==='/mkt/email/api/import')return importContacts(db,p);
  if(path==='/mkt/email/api/campaigns'){
    const content=contentOf(p.content),id=p.id||crypto.randomUUID();if(!validId(id)||!validId(p.listId))fail('Selecione uma lista.');
    if(!await db.prepare('SELECT id FROM mkt_lists WHERE id=?').bind(p.listId).first())fail('Lista não encontrada.');
    const current=await db.prepare('SELECT status FROM mkt_campaigns WHERE id=?').bind(id).first();if(current&&current.status!=='draft')fail('Campanhas iniciadas não podem ser alteradas. Crie uma nova.',409);
    await db.prepare("INSERT INTO mkt_campaigns(id,name,content,list_id,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,content=excluded.content,list_id=excluded.list_id,updated_at=excluded.updated_at WHERE mkt_campaigns.status='draft'").bind(id,content.name,JSON.stringify(content),p.listId,now,now).run();return json({id});
  }
  if(path==='/mkt/email/api/test'){
    const cfg=configuration(env,url.origin);if(!cfg.ready)fail('Configure o serviço de envio primeiro.',409);
    const email=normalizeEmail(p.email);if(!email)fail('Informe um email de teste válido.');const content=contentOf(p.content);
    // Tests do not create marketing subscriptions. The footer is explicitly a preview.
    const locked=await db.prepare('UPDATE mkt_runtime SET test_after=? WHERE id=1 AND test_after<?').bind(now+30000,now).run();if(!changes(locked))fail('Aguarde 30 segundos entre testes.',429);
    const rendered=renderEmail(content,{name:'equipe Búfalo',address:cfg.address,unsubscribeUrl:cfg.publicOrigin+'/mkt/email/unsubscribe'});
    const response=await sendFetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`bufalo-test/${crypto.randomUUID()}`},body:JSON.stringify({from:`Búfalo Growler <${cfg.from}>`,to:[email],reply_to:cfg.replyTo,...rendered,subject:`[TESTE] ${rendered.subject}`}),signal:AbortSignal.timeout(20000)});
    if(!response.ok)fail('O Resend não aceitou o email de teste. Revise remetente e limites.',502);return json({ok:true});
  }
  const action=path.match(/^\/mkt\/email\/api\/campaigns\/([a-f0-9-]{36})\/(start|process|pause|resume)$/);
  if(action){
    const campaign=await summary(db,action[1]);
    if(action[2]==='start'){
      if(!configuration(env,url.origin).ready)fail('Envio bloqueado até configurar o provedor e o remetente.',409);
      if(p.confirm!=='ENVIAR'||p.consent!==true)fail('Confirme o envio e a autorização da lista.');
      if(campaign.status!=='draft')fail('Esta campanha já foi iniciada.',409);
      const count=await db.prepare("SELECT COUNT(*) AS count FROM mkt_list_contacts l JOIN mkt_contacts c ON c.email=l.email WHERE l.list_id=? AND c.status='active'").bind(campaign.list_id).first();
      if(!count.count)fail('A lista não tem contatos ativos.');if(count.count>5000)fail('Limite de 5.000 destinatários por campanha.');
      await db.batch([
        db.prepare("INSERT OR IGNORE INTO mkt_recipients(campaign_id,email,name) SELECT ?,c.email,c.name FROM mkt_contacts c JOIN mkt_list_contacts l ON l.email=c.email WHERE l.list_id=? AND c.status='active'").bind(campaign.id,campaign.list_id),
        db.prepare("UPDATE mkt_campaigns SET status='queued',updated_at=? WHERE id=? AND status='draft'").bind(now,campaign.id)
      ]);return json(await summary(db,campaign.id));
    }
    if(action[2]==='process')return processBatch(db,env,campaign,url.origin,sendFetch);
    if(action[2]==='pause'&&campaign.status==='queued')await db.prepare("UPDATE mkt_campaigns SET status='paused',updated_at=? WHERE id=? AND status='queued'").bind(now,campaign.id).run();
    else if(action[2]==='resume'&&campaign.status==='paused')await db.prepare("UPDATE mkt_campaigns SET status='queued',updated_at=? WHERE id=? AND status='paused'").bind(now,campaign.id).run();
    else fail('Estado inválido para esta ação.',409);
    return json(await summary(db,campaign.id));
  }
  return json({error:'Rota não encontrada.'},404);
}
export async function handleEmail(context,sendFetch=fetch) {
  try{return await handle(context,sendFetch);}catch(error){return json({error:error.status?error.message:'Não foi possível concluir. Tente novamente.'},error.status||503);}
}
