import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {handleEmail,verifyWebhook,configuration} from '../functions/_lib/email-marketing.js';
import {schema} from '../functions/_lib/email-schema.js';
import {starter,validateContent,renderEmail,parseCsv,contactsFromRows,normalizeEmail} from '../mkt/email/core.js';
const origin='https://www.bufalogrowler.com.br';
const content={...starter};
const envConfig={RESEND_API_KEY:'test-key',MKT_ENABLED:'true',MKT_FROM_EMAIL:'marketing@bufalogrowler.com.br',MKT_REPLY_TO:'contato@bufalogrowler.com.br',MKT_COMPANY_ADDRESS:'Endereço de teste',RESEND_WEBHOOK_SECRET:'whsec_'+Buffer.from('test-webhook-secret-only').toString('base64')};
function database(){
  const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE live_sessions(token TEXT PRIMARY KEY,expires INTEGER)');
  return {sql,prepare(query){const s=sql.prepare(query);let values=[];return {bind(...args){values=args;return this;},async first(){return s.get(...values)||null;},async all(){return {results:s.all(...values)};},async run(){return s.run(...values);}};},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
async function setup(config={}){
  const db=database(),value='a'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
  db.sql.prepare('INSERT INTO live_sessions VALUES(?,?)').run(hash,Date.now()+60000);
  const cookie='admin_session='+value,env={LIVE_DB:db,...envConfig,...config};
  async function call(path,payload,options={}){
    const request=new Request((options.origin||origin)+'/mkt/email'+path,{method:options.method||(payload===undefined?'GET':'POST'),headers:{Origin:options.requestOrigin||origin,'Content-Type':'application/json',Cookie:options.anonymous?'':cookie,...options.headers},body:payload===undefined?undefined:JSON.stringify(payload)});
    return handleEmail({request,env,next:async()=>new Response('private-page')},options.sendFetch||asyncSend);
  }
  await call('/api/state');return {db,env,call};
}
let sent=[];
async function asyncSend(url,options){sent.push({url,options});const payload=JSON.parse(options.body);return Response.json(Array.isArray(payload)?{data:payload.map(()=>({id:crypto.randomUUID()}))}:{id:crypto.randomUUID()});}
async function list(call,contacts=[{email:'one@example.com',name:'Ana'}]){const r=await call('/api/import',{name:'Lista autorizada',source:'Formulário de teste com autorização',consent:true,contacts});assert.equal(r.status,200,await r.clone().text());return (await r.json()).listId;}
async function draft(call,listId){const r=await call('/api/campaigns',{listId,content});assert.equal(r.status,200,await r.clone().text());return (await r.json()).id;}
async function start(call,id){const r=await call(`/api/campaigns/${id}/start`,{confirm:'ENVIAR',consent:true});assert.equal(r.status,200,await r.clone().text());}

test('schema source matches migration; fresh and repeated creation work',async()=>{
  assert.equal(schema.replaceAll('\r\n','\n'),readFileSync(new URL('../migrations/0015_email_marketing.sql',import.meta.url),'utf8').replaceAll('\r\n','\n'));
  const {call,db}=await setup();assert.equal((await call('/api/state')).status,200);db.sql.close();
});
test('protects page, scripts and all admin APIs with the shared session and CSRF',async()=>{
  const {call,db}=await setup();
  for(const path of ['/','/index.html','/app.js','/core.js','/modelo-contatos.csv']){const r=await call(path,undefined,{anonymous:true});assert.equal(r.status,302);assert.equal(r.headers.get('location'),origin+'/painel/');assert.match(r.headers.get('cache-control'),/no-store/);}
  for(const path of ['/api/state','/api/templates','/api/import','/api/campaigns','/api/test'])assert.equal((await call(path,{}, {anonymous:true})).status,401);
  assert.equal((await call('/api/templates',{content},{requestOrigin:'https://other.test'})).status,403);
  const response=await call('/');assert.equal(await response.text(),'private-page');assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);db.sql.close();
});
test('validates and escapes email content, URLs, personalization and header injection',()=>{
  assert.deepEqual(validateContent(content),content);
  for(const change of [{subject:'subject\r\nBcc: attacker@example.com'},{buttonUrl:'javascript:alert(1)'},{imageUrl:'https://user:pass@example.com/a.png'},{body:''}])assert.throws(()=>validateContent({...content,...change}));
  const r=renderEmail({...content,body:'Olá, {{nome}}!\n\n<img src=x onerror=alert(1)>',heading:'<script>x</script>'},{name:'<b>Ana</b>'});
  assert.ok(!r.html.includes('<script>'));assert.ok(!r.html.includes('<img src=x'));assert.ok(r.html.includes('&lt;b&gt;Ana&lt;/b&gt;'));assert.ok(r.text.includes('Olá, <b>Ana</b>!'));
});
test('CSV BOM, quoted separators/newlines, invalid rows and deduplication',()=>{
  const rows=parseCsv('\uFEFFemail;nome\r\nANA@example.com;"Ana; Silva"\r\nana@example.com;Duplicada\r\ninvalid;Falha\r\nnew@example.com;"Nome\nCompleto"\r\n');
  const result=contactsFromRows(rows.slice(1),0,1);assert.equal(result.contacts.length,2);assert.equal(result.duplicates,1);assert.deepEqual(result.invalid,[4]);assert.equal(result.contacts[0].name,'Ana; Silva');assert.equal(result.contacts[1].name,'NomeCompleto');assert.throws(()=>parseCsv('email,nome\na@example.com,"aberto'));
});
test('CSV accepts exactly 5000 contacts; rejects malformed dot atoms and header injection',()=>{
  const csv='email,nome\n'+Array.from({length:5000},(_,i)=>`p${i}@example.com,Nome`).join('\n')+'\n';
  assert.equal(parseCsv(csv).length,5001);
  for(const email of ['.a@example.com','a.@example.com','a..b@example.com','a@example.com\nBcc:x@example.com'])assert.equal(normalizeEmail(email),null);
});
test('vendored Excel reader imports a real XLSX workbook with two sheets',()=>{
  const XLSX=createRequire(import.meta.url)('../assets/vendor/xlsx-0.20.3.full.min.js');
  assert.equal(XLSX.version,'0.20.3');const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['email','nome'],['ANA@example.com','Ana'],['ana@example.com','Duplicate']]),'Clientes');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['nome','email'],['Beto','beto@example.com']]),'Novidades');
  const parsed=XLSX.read(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}),{type:'buffer',sheetRows:5002,cellHTML:false,cellFormula:false});
  const rows=XLSX.utils.sheet_to_json(parsed.Sheets.Clientes,{header:1,defval:'',raw:false});const result=contactsFromRows(rows.slice(1),0,1);assert.equal(result.contacts.length,1);assert.equal(result.duplicates,1);assert.equal(parsed.SheetNames.length,2);
});
test('import requires consent and reimport preserves suppression and membership uniqueness',async()=>{
  const {call,db}=await setup();assert.equal((await call('/api/import',{name:'Test',contacts:[{email:'x@example.com'}]})).status,400);
  const id=await list(call);db.sql.prepare("UPDATE mkt_contacts SET status='unsubscribed' WHERE email='one@example.com'").run();
  const r=await call('/api/import',{listId:id,name:'Test',source:'Autorização registrada',consent:true,contacts:[{email:'ONE@example.com',name:'Atualizada'},{email:'one@example.com'},{email:'bad'}]});const result=await r.json();assert.equal(result.total,1);assert.equal(result.active,0);assert.equal(result.invalid,1);assert.equal(result.duplicates,1);assert.equal(db.sql.prepare('SELECT status FROM mkt_contacts').get().status,'unsubscribed');db.sql.close();
});
test('templates and drafts persist; missing provider and preview domain cannot start sends',async()=>{
  const {call,db}=await setup({RESEND_API_KEY:undefined});assert.equal((await call('/api/templates',{content})).status,200);assert.equal((await (await call('/api/state')).json()).templates.length,1);
  const id=await draft(call,await list(call));assert.equal((await call(`/api/campaigns/${id}/start`,{confirm:'ENVIAR',consent:true})).status,409);
  assert.equal((await call('/api/test',{email:'test@example.com',content})).status,409);assert.equal(configuration(envConfig,'https://preview.bufalo.pages.dev').ready,false);db.sql.close();
});
test('queue snapshots recipients and content, individual messages and suppression before sending',async()=>{
  sent=[];const {call,db}=await setup();const id=await draft(call,await list(call,[{email:'one@example.com',name:'Ana'},{email:'two@example.com',name:'Beto'}]));
  assert.equal((await call(`/api/campaigns/${id}/start`,{confirm:'WRONG',consent:true})).status,400);await start(call,id);
  assert.equal((await call('/api/campaigns',{id,listId:db.sql.prepare('SELECT list_id FROM mkt_campaigns').get().list_id,content:{...content,subject:'changed'}})).status,409);
  db.sql.prepare("UPDATE mkt_contacts SET status='unsubscribed' WHERE email='two@example.com'").run();
  const response=await call(`/api/campaigns/${id}/process`,{});assert.equal(response.status,200,await response.clone().text());const stats=await response.json();assert.equal(stats.counts.accepted,1);assert.equal(stats.counts.skipped,1);
  const payload=JSON.parse(sent[0].options.body);assert.equal(payload.length,1);assert.deepEqual(payload[0].to,['one@example.com']);assert.ok(payload[0].html.includes('Ana'));assert.ok(payload[0].headers['List-Unsubscribe'].includes('/unsubscribe?token='));assert.ok(!payload[0].html.includes('two@example.com'));
  const done=await (await call(`/api/campaigns/${id}/process`,{})).json();assert.equal(done.status,'completed');db.sql.close();
});
test('uncertain batches retain same idempotency key/payload; no retries past safe window',async()=>{
  const {call,db}=await setup();const id=await draft(call,await list(call));await start(call,id);const attempts=[];
  const failing=async(url,options)=>{attempts.push(options);throw new Error('network');};
  assert.equal((await call(`/api/campaigns/${id}/process`,{}, {sendFetch:failing})).status,502);
  await call(`/api/campaigns/${id}/process`,{}, {sendFetch:failing});assert.equal(attempts[0].headers['Idempotency-Key'],attempts[1].headers['Idempotency-Key']);assert.equal(attempts[0].body,attempts[1].body);
  db.sql.prepare('UPDATE mkt_attempts SET created_at=?').run(Date.now()-24*3600000);assert.equal((await call(`/api/campaigns/${id}/process`,{}, {sendFetch:failing})).status,409);assert.equal(attempts.length,2);db.sql.close();
});
test('pause, resume and global lease prevent overlapping sends',async()=>{
  const {call,db}=await setup();const id=await draft(call,await list(call));await start(call,id);
  db.sql.prepare('UPDATE mkt_runtime SET lease_until=?').run(Date.now()+60000);assert.equal((await call(`/api/campaigns/${id}/process`,{})).status,409);db.sql.prepare('UPDATE mkt_runtime SET lease_until=0').run();
  await call(`/api/campaigns/${id}/pause`,{});assert.equal((await call(`/api/campaigns/${id}/process`,{})).status,409);await call(`/api/campaigns/${id}/resume`,{});assert.equal((await call(`/api/campaigns/${id}/process`,{})).status,200);db.sql.close();
});
test('a suppressed contact blocks retry of an uncertain batch',async()=>{
  const {call,db}=await setup();const id=await draft(call,await list(call));await start(call,id);
  const failing=async()=>{throw new Error('network');};await call(`/api/campaigns/${id}/process`,{}, {sendFetch:failing});
  db.sql.prepare("UPDATE mkt_contacts SET status='unsubscribed'").run();let called=false;
  const result=await call(`/api/campaigns/${id}/process`,{}, {sendFetch:async()=>{called=true;return Response.json({data:[]});}});
  assert.equal(result.status,409);assert.equal(called,false);db.sql.close();
});
test('unsubscribe GET is harmless; POST suppresses without login and reimport never reactivates',async()=>{
  const {call,db}=await setup();await list(call);const t=db.sql.prepare('SELECT token FROM mkt_contacts').get().token;
  await call('/unsubscribe?token='+t,undefined,{anonymous:true});assert.equal(db.sql.prepare('SELECT status FROM mkt_contacts').get().status,'active');
  await call('/unsubscribe?token='+t,{}, {anonymous:true});assert.equal(db.sql.prepare('SELECT status FROM mkt_contacts').get().status,'unsubscribed');await list(call);assert.equal(db.sql.prepare('SELECT status FROM mkt_contacts').get().status,'unsubscribed');db.sql.close();
});
async function signed(event,secret,id=crypto.randomUUID()){
  const raw=JSON.stringify(event),timestamp=String(Math.floor(Date.now()/1000));const key=await crypto.subtle.importKey('raw',Buffer.from(secret.slice(6),'base64'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${id}.${timestamp}.${raw}`))).toString('base64');return {raw,headers:{'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+signature}};
}
test('signed delivery events update reports and suppress bounces; invalid signatures rejected',async()=>{
  const {call,db}=await setup();const id=await draft(call,await list(call));await start(call,id);await call(`/api/campaigns/${id}/process`,{});
  const providerId=db.sql.prepare('SELECT provider_id FROM mkt_recipients').get().provider_id;
  assert.equal((await call('/webhook',{type:'email.bounced',data:{email_id:providerId}},{anonymous:true})).status,401);
  const event={type:'email.bounced',data:{email_id:providerId}},signature=await signed(event,envConfig.RESEND_WEBHOOK_SECRET);
  assert.equal(await verifyWebhook(signature.raw,new Headers(signature.headers),envConfig.RESEND_WEBHOOK_SECRET),true);
  for(let i=0;i<2;i++)assert.equal((await call('/webhook',event,{anonymous:true,headers:signature.headers})).status,200);
  assert.equal(db.sql.prepare('SELECT status FROM mkt_contacts').get().status,'bounced');assert.equal(db.sql.prepare('SELECT status FROM mkt_recipients').get().status,'bounced');assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM mkt_events').get().n,1);db.sql.close();
});
test('acknowledges signed test events but retries early campaign events until IDs are reconciled',async()=>{
  const {call,db}=await setup();
  const event={type:'email.delivered',data:{email_id:'test-outside-campaign'}},signature=await signed(event,envConfig.RESEND_WEBHOOK_SECRET);
  assert.equal((await call('/webhook',event,{anonymous:true,headers:signature.headers})).status,200);
  const id=await draft(call,await list(call));await start(call,id);
  await call(`/api/campaigns/${id}/process`,{},{sendFetch:async()=>{throw new Error('network');}});
  assert.equal((await call('/webhook',event,{anonymous:true,headers:signature.headers})).status,503);
  db.sql.close();
});
