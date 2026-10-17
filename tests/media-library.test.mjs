import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleMedia,mediaSchema,MEDIA_LIMIT,LIBRARY_LIMIT} from '../functions/_lib/media.js';
const origin='https://www.bufalogrowler.com.br',png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,73,72,68,82]);
async function setup(){
  const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE live_sessions(token TEXT PRIMARY KEY,expires INTEGER)');
  const value='c'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');sql.prepare('INSERT INTO live_sessions VALUES(?,?)').run(hash,Date.now()+60000);
  const db={prepare(query){const s=sql.prepare(query);let v=[];return {bind(...a){v=a;return this;},async first(){return s.get(...v)||null;},async all(){return {results:s.all(...v)};},async run(){return s.run(...v);}};}};
  async function call(path,options={}){const {anonymous,crossOrigin,headers={},...rest}=options;const request=new Request(origin+'/midia'+path,{headers:{Cookie:anonymous?'':'admin_session='+value,Origin:crossOrigin?'https://evil.example':origin,...headers},...rest});return handleMedia({request,env:{LIVE_DB:db},next:async()=>new Response('private page')});}
  const upload=(bytes=png,headers={})=>call('/api/upload',{method:'POST',headers:{'Content-Type':'image/png','X-File-Name':encodeURIComponent('Foto da manada.png'),...headers},body:bytes});
  return {sql,call,upload};
}
test('media schema matches migration; manager and scripts require session',async()=>{
  assert.equal(mediaSchema,readFileSync(new URL('../migrations/0017_media_library.sql',import.meta.url),'utf8').replaceAll('\r\n','\n'));
  const {call,sql}=await setup();for(const path of ['/','/index.html','/app.js','/styles.css','/README.md']){const r=await call(path,{anonymous:true});assert.equal(r.status,302);assert.equal(r.headers.get('location'),origin+'/painel/');}
  for(const path of ['/api/files','/api/upload'])assert.equal((await call(path,{anonymous:true})).status,401);
  const r=await call('/');assert.equal(await r.text(),'private page');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);sql.close();
});
test('uploads return public links, list metadata only and safely serve images and HEAD',async()=>{
  const {call,sql,upload}=await setup();const response=await upload();assert.equal(response.status,201,await response.clone().text());const {file}=await response.json();assert.match(file.url,/\/midia\/arquivos\/[a-f0-9-]{36}\.png$/);
  let r=await call(file.url.slice((origin+'/midia').length),{anonymous:true});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('cache-control'),/max-age=0/);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),png);
  r=await call(file.url.slice((origin+'/midia').length),{method:'HEAD',anonymous:true});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,0);
  r=await call('/api/files');const data=await r.json();assert.equal(data.files.length,1);assert.ok(!('data' in data.files[0]));assert.equal(data.stats.bytes,png.length);sql.close();
});
test('rejects CSRF, oversized streamed uploads, active content and mismatched signatures',async()=>{
  const {call,upload,sql}=await setup();assert.equal((await call('/api/upload',{method:'POST',crossOrigin:true,body:png,headers:{'Content-Type':'image/png'}})).status,403);
  assert.equal((await upload(new Uint8Array(MEDIA_LIMIT+1))).status,413);
  assert.equal((await upload(png,{'Content-Length':String(MEDIA_LIMIT+1)})).status,413);
  assert.equal((await upload(new TextEncoder().encode('<svg onload="alert(1)"></svg>'),{'Content-Type':'image/svg+xml'})).status,415);
  assert.equal((await upload(new TextEncoder().encode('<html><script>alert(1)</script></html>'))).status,400);
  assert.equal((await upload(png,{'Content-Type':'application/pdf'})).status,400);assert.equal((await upload(png,{'X-File-Name':'%malformed'})).status,400);sql.close();
});
test('deletion disables public access and restoration preserves URL, bytes and metadata',async()=>{
  const {call,upload,sql}=await setup();const {file}=await (await upload()).json(),path=file.url.slice((origin+'/midia').length),action=a=>'/api/files/'+file.id+'/'+a;
  const post={method:'POST',headers:{'Content-Type':'application/json'},body:'{}'};
  assert.equal((await call(action('delete'),{...post,anonymous:true})).status,401);assert.equal((await call(action('delete'),{...post,crossOrigin:true})).status,403);
  assert.equal((await call(action('delete'),post)).status,200);assert.equal((await call(path,{anonymous:true})).status,404);assert.equal((await (await call('/api/files')).json()).matched,0);
  const trash=await (await call('/api/files?trash=1')).json();assert.equal(trash.files[0].url,file.url);assert.equal(trash.stats.bytes,png.length);
  assert.equal((await call(action('restore'),post)).status,200);assert.equal((await call(path,{anonymous:true})).status,200);assert.equal((await (await call('/api/files')).json()).files[0].url,file.url);
  assert.equal((await call('/api/files/'+crypto.randomUUID()+'/delete',post)).status,404);sql.close();
});
test('PDFs download safely, names cannot escape paths, filters and pagination are parameterized',async()=>{
  const {call,upload,sql}=await setup();await upload();const pdf=new TextEncoder().encode('%PDF-1.7\nexample pdf fixture\n%%EOF');
  const {file}=await (await upload(pdf,{'Content-Type':'application/pdf','X-File-Name':encodeURIComponent('../../<test>\r\nfile.pdf')})).json();assert.ok(!file.name.includes('/'));assert.ok(!file.name.includes('\n'));
  const r=await call(file.url.slice((origin+'/midia').length),{anonymous:true});assert.match(r.headers.get('content-disposition'),/^attachment;/);assert.match(r.headers.get('content-security-policy'),/sandbox/);
  assert.equal((await (await call('/api/files?kind=pdf')).json()).matched,1);assert.equal((await (await call('/api/files?kind=image')).json()).matched,1);
  assert.equal((await (await call('/api/files?search=%27%20OR%201%3D1--')).json()).matched,0);
  for(let i=0;i<25;i++)await upload(png,{'X-File-Name':encodeURIComponent('Manada '+i+'.png')});
  let data=await (await call('/api/files?page=1')).json();assert.equal(data.files.length,24);assert.equal(data.pages,2);
  data=await (await call('/api/files?page=2')).json();assert.equal(data.files.length,3);assert.equal((await (await call('/api/files?search=Manada')).json()).matched,26);sql.close();
});
test('library capacity includes trash and prevents another write atomically',async()=>{
  const {call,sql,upload}=await setup();const {file}=await (await upload()).json();sql.prepare('UPDATE media_files SET size=?,deleted_at=? WHERE id=?').run(LIBRARY_LIMIT,Date.now(),file.id);
  assert.equal((await upload()).status,409);assert.equal((await (await call('/api/files')).json()).stats.bytes,LIBRARY_LIMIT);sql.close();
});
