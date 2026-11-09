import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const moduleURL=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const surveyURL=moduleURL(fs.readFileSync('functions/_lib/chopeira-survey.js','utf8'));
const analyticsURL=moduleURL(fs.readFileSync('functions/_lib/home-analytics.js','utf8'));
const {surveyResults}=await import(surveyURL);
const {onRequest}=await import(moduleURL(fs.readFileSync('functions/api/chopeira-survey.js','utf8').replace("'../_lib/chopeira-survey.js'",JSON.stringify(surveyURL)).replace("'../_lib/home-analytics.js'",JSON.stringify(analyticsURL))));
const sql=new DatabaseSync(':memory:');
const db={prepare(query){const stmt=sql.prepare(query);let args=[];return{bind(...values){args=values;return this;},async run(){return stmt.run(...args);},async first(){return stmt.get(...args);},async all(){return{results:stmt.all(...args)};}};}};
const base={id:'12345678-1234-4123-8123-123456789abc',name:'Cliente de teste',phone:'(91) 99999-1234',reasons:['produto-caro','frete-caro'],other:'',device:'mobile',consent:true};
async function post(data=base,origin='https://bufalogrowler.com.br',method='POST'){
 return onRequest({request:new Request('https://bufalogrowler.com.br/api/chopeira-survey',{method,headers:{Origin:origin},...(method==='POST'?{body:JSON.stringify(data)}:{})}),env:{LIVE_DB:db}});
}
assert.equal((await post()).status,200);
assert.equal((await post()).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM chopeira_surveys').get().n,1,'retry is idempotent');
for(const patch of [{consent:false},{phone:'123'},{name:'<script>'},{reasons:[]},{reasons:['invalid']},{reasons:['outro'],other:''},{other:'x'.repeat(501)},{website:'spam'},{device:'invalid'},{id:'invalid'}])assert.equal((await post({...base,...patch})).status,400);
assert.equal((await post(base,'https://other.test')).status,403);
assert.equal((await post(base,'https://bufalogrowler.com.br','GET')).status,405);
assert.equal((await post({...base,id:'22345678-1234-4123-8123-123456789abc',reasons:['outro'],other:'Prefiro outra cor',device:'desktop'})).status,200);
const range={start:'2000-01-01',end:'2099-12-31'};
const data=await surveyResults(db,range,'all');assert.equal(data.total,2);assert.equal(data.rows[0].phone,'5591999991234');
assert.equal(data.summary.find(x=>x.reason==='frete-caro').total,1);
assert.equal((await surveyResults(db,range,'mobile')).total,1);
assert.equal((await surveyResults(db,{start:'2000-01-01',end:'2000-01-02'},'all')).total,0);
assert.equal((await surveyResults(db,range,'all',1)).rows.length,1);
const campaignsURL=moduleURL(fs.readFileSync('functions/_lib/campaigns.js','utf8'));
const admin=await import(moduleURL(fs.readFileSync('functions/painel/_middleware.js','utf8').replace("'../_lib/chopeira-survey.js'",JSON.stringify(surveyURL)).replace("'../_lib/campaigns.js'",JSON.stringify(campaignsURL)).replace("'../_lib/home-analytics.js'",JSON.stringify(analyticsURL))));
assert.equal((await admin.onRequest({request:new Request('https://bufalogrowler.com.br/painel/api/chopeira-surveys'),env:{LIVE_DB:db}})).status,401,'contacts require admin session');
for(const file of ['produtos/chopeira/index.html','produtos/chopeira/survey.js','produtos/chopeira/survey.css','painel/estatisticas/index.html','painel/home-analytics.js'])assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync('dist/'+file,'utf8'));
console.log('PASS: durable answers, normalization, validation, consent, origin, idempotent retries, date/device filters, pagination, private contacts and synchronized publication.');

// Attendance must persist per survey and remain private.
sql.exec('CREATE TABLE live_sessions (token TEXT PRIMARY KEY, expires INTEGER)');
const token='a'.repeat(64), hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
sql.prepare('INSERT INTO live_sessions VALUES (?,?)').run(hash,Date.now()+60000);
async function attendance(payload, {cookie=true,origin='https://bufalogrowler.com.br'}={}) {
 return admin.onRequest({request:new Request('https://bufalogrowler.com.br/painel/api/chopeira-surveys',{method:'POST',headers:{Origin:origin,...(cookie?{Cookie:'admin_session='+token}:{})},body:JSON.stringify(payload)}),env:{LIVE_DB:db}});
}
const note={id:base.id,result:'  Cliente aceitou a proposta. Retorno amanhã.  '};
assert.equal((await attendance(note,{cookie:false})).status,401);
assert.equal((await attendance(note,{origin:'https://other.test'})).status,403);
for (const result of ['', '  ', 'x'.repeat(1001)]) assert.equal((await attendance({...note,result})).status,400);
assert.equal((await attendance({...note,id:'99999999-9999-4999-8999-999999999999'})).status,404);
assert.equal((await attendance(note)).status,200);
let saved=(await surveyResults(db,range,'all')).rows.find(r=>r.id===base.id);
assert.equal(saved.attendance_result,note.result.trim());assert.ok(saved.responded_at);
assert.equal((await surveyResults(db,range,'all')).rows.find(r=>r.id!==base.id).responded_at,null);
assert.equal((await attendance({...note,result:'Negociação concluída.'})).status,200);
saved=(await surveyResults(db,range,'all')).rows.find(r=>r.id===base.id);
assert.equal(saved.attendance_result,'Negociação concluída.');
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM chopeira_survey_attendance').get().n,1);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM chopeira_surveys').get().n,2);
console.log('PASS: attendance persists, updates only its contact, rejects blanks, requires session and same origin.');
