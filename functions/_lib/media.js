import {authenticated} from './email-marketing.js';
import {readLimited} from '../../lib/live-content.js';
export const mediaSchema=`CREATE TABLE IF NOT EXISTS media_files (id TEXT PRIMARY KEY,name TEXT NOT NULL,content_type TEXT NOT NULL,extension TEXT NOT NULL,size INTEGER NOT NULL,data BLOB NOT NULL,created_at INTEGER NOT NULL,deleted_at INTEGER);
CREATE INDEX IF NOT EXISTS media_files_listing ON media_files(deleted_at,created_at);
`;
export const MEDIA_LIMIT=1500000,LIBRARY_LIMIT=50000000;
const secure={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const json=(data,status=200)=>Response.json(data,{status,headers:secure});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
async function ensure(db){for(const query of mediaSchema.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(query).run();}
export function detectMedia(bytes){
  const text=new TextDecoder('ascii'),starts=(n,s)=>text.decode(bytes.slice(n,n+s.length))===s;
  if(bytes.length<12)return null;
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return {type:'image/jpeg',extension:'jpg'};
  if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return {type:'image/png',extension:'png'};
  if(starts(0,'RIFF')&&starts(8,'WEBP'))return {type:'image/webp',extension:'webp'};
  if(starts(0,'GIF87a')||starts(0,'GIF89a'))return {type:'image/gif',extension:'gif'};
  if(starts(0,'%PDF-'))return {type:'application/pdf',extension:'pdf'};
  return null;
}
function fileInfo(row,origin){const {data,...info}=row;return {...info,url:origin+'/midia/arquivos/'+row.id+'.'+row.extension};}
async function handle(context){
  const {request,env}=context,url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
  if(!env.LIVE_DB)fail('Biblioteca temporariamente indisponível.',503);
  const db=env.LIVE_DB,publicFile=path.match(/^\/midia\/arquivos\/([a-f0-9-]{36})\.(jpg|png|webp|gif|pdf)$/);
  if(publicFile){
    if(!['GET','HEAD'].includes(request.method))return json({error:'Método não permitido.'},405);
    await ensure(db);
    const row=await db.prepare('SELECT * FROM media_files WHERE id=? AND extension=? AND deleted_at IS NULL').bind(publicFile[1],publicFile[2]).first();
    if(!row)return new Response('Arquivo não encontrado.',{status:404,headers:secure});
    const headers={...secure,'Cache-Control':'public, max-age=0, must-revalidate','Content-Type':row.content_type,'Content-Length':String(row.size),'Content-Disposition':`${row.content_type==='application/pdf'?'attachment':'inline'}; filename="${row.id}.${row.extension}"; filename*=UTF-8''${encodeURIComponent(row.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'Content-Security-Policy':"default-src 'none'; sandbox"};
    return new Response(request.method==='HEAD'?null:Uint8Array.from(row.data),{headers});
  }
  const api=path.startsWith('/midia/api/');
  if(!await authenticated(request,db))return api?json({error:'Entre pelo painel para gerenciar a mídia.'},401):new Response(null,{status:302,headers:{...secure,Location:new URL('/painel/',url).href}});
  if(!api){if(path.startsWith('/midia/arquivos'))return json({error:'Arquivo não encontrado.'},404);const result=await context.next();return new Response(result.body,{status:result.status,headers:{...Object.fromEntries(result.headers),...secure,'Content-Security-Policy':csp}});}
  if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
  await ensure(db);
  if(path==='/midia/api/files'&&request.method==='GET'){
    const page=Math.max(1,Math.min(10000,parseInt(url.searchParams.get('page'),10)||1)),trash=url.searchParams.get('trash')==='1',search=(url.searchParams.get('search')||'').trim().slice(0,180),kind=url.searchParams.get('kind');
    let where='deleted_at IS '+(trash?'NOT NULL':'NULL'),values=[];
    if(search){where+=' AND instr(lower(name),lower(?))>0';values.push(search);}
    if(kind==='image')where+=" AND content_type LIKE 'image/%'";else if(kind==='pdf')where+=" AND content_type='application/pdf'";
    const {count}=await db.prepare(`SELECT COUNT(*) AS count FROM media_files WHERE ${where}`).bind(...values).first();
    const files=(await db.prepare(`SELECT id,name,content_type,extension,size,created_at,deleted_at FROM media_files WHERE ${where} ORDER BY created_at DESC,id LIMIT 24 OFFSET ?`).bind(...values,(page-1)*24).all()).results;
    const stats=await db.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(size),0) AS bytes,COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END),0) AS active FROM media_files').first();
    return json({files:files.map(r=>fileInfo(r,url.origin)),page,pages:Math.ceil(count/24),matched:count,stats,limit:MEDIA_LIMIT,capacity:LIBRARY_LIMIT});
  }
  if(path==='/midia/api/upload'&&request.method==='POST'){
    const expected=request.headers.get('Content-Type')?.split(';')[0];
    if(!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(expected))fail('Envie JPG, PNG, WebP, GIF ou PDF.',415);
    if(Number(request.headers.get('Content-Length')||0)>MEDIA_LIMIT)fail('O arquivo deve ter até 1,5 MB.',413);
    let bytes;try{bytes=await readLimited(request,MEDIA_LIMIT);}catch{fail('O arquivo deve ter até 1,5 MB.',413);}
    const detected=detectMedia(bytes);if(!detected||detected.type!==expected)fail('O conteúdo do arquivo não corresponde ao formato informado.');
    let name;try{name=decodeURIComponent(request.headers.get('X-File-Name')||'arquivo');}catch{fail('Nome de arquivo inválido.');}
    name=name.replace(/[\x00-\x1f\x7f/\\]/g,'').trim().slice(0,170).replace(/\.[^.]*$/,'')||'arquivo';name+='.'+detected.extension;
    const row={id:crypto.randomUUID(),name,content_type:detected.type,extension:detected.extension,size:bytes.length,created_at:Date.now(),deleted_at:null};
    const result=await db.prepare('INSERT INTO media_files(id,name,content_type,extension,size,data,created_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM media_files)+?<=?').bind(row.id,name,row.content_type,row.extension,row.size,bytes,row.created_at,row.size,LIBRARY_LIMIT).run();
    if(!(result.meta?.changes??result.changes))fail('A biblioteca atingiu 50 MB, incluindo a lixeira. Entre em contato com a equipe técnica para ampliar o armazenamento.',409);
    return json({file:fileInfo(row,url.origin)},201);
  }
  const action=path.match(/^\/midia\/api\/files\/([a-f0-9-]{36})\/(delete|restore)$/);
  if(action&&request.method==='POST'){
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))fail('Envie JSON.',415);
    let p;try{p=JSON.parse(new TextDecoder().decode(await readLimited(request,2048)));}catch{fail('Pedido inválido.');}
    if(!p||typeof p!=='object'||Array.isArray(p))fail('Pedido inválido.');
    if(!await db.prepare('SELECT id FROM media_files WHERE id=?').bind(action[1]).first())fail('Arquivo não encontrado.',404);
    await db.prepare('UPDATE media_files SET deleted_at=? WHERE id=?').bind(action[2]==='delete'?Date.now():null,action[1]).run();
    return json({ok:true});
  }
  return json({error:'Rota não encontrada.'},404);
}
export async function handleMedia(context){try{return await handle(context);}catch(error){return json({error:error.status?error.message:'Não foi possível acessar a mídia. Tente novamente.'},error.status||503);}}
