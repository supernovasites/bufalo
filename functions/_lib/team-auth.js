const encoder=new TextEncoder();
export const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const cookieToken=(request,name)=>request.headers.get('Cookie')?.match(new RegExp('(?:^|;\\s*)'+name+'=([a-f0-9]{64})(?:;|$)'))?.[1];
export async function ensureTeam(db){
  await db.prepare('CREATE TABLE IF NOT EXISTS live_sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)').run();
  await db.prepare("CREATE TABLE IF NOT EXISTS team_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role='C'), password_hash TEXT NOT NULL, salt TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)").run();
  await db.prepare('CREATE TABLE IF NOT EXISTS team_password_changes (user_id TEXT PRIMARY KEY, required INTEGER NOT NULL DEFAULT 1)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS team_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL)').run();
}
export async function passwordHash(password,salt){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function identity(request,env){
  const db=env.LIVE_DB;if(!db)return null;
  await ensureTeam(db);
  const admin=cookieToken(request,'admin_session');
  if(admin&&await db.prepare('SELECT token FROM live_sessions WHERE token=? AND expires>?').bind(await sha(admin),Date.now()).first())return {id:'administrator',username:env.PANEL_USERNAME||'Alexsos',name:env.PANEL_NAME||env.PANEL_USERNAME||'Alexsos',role:'A'};
  const token=cookieToken(request,'retorno_session');if(!token)return null;
  return await db.prepare('SELECT u.id,u.username,u.name,u.role,COALESCE((SELECT required FROM team_password_changes WHERE user_id=u.id),0) AS must_change_password FROM team_sessions s JOIN team_users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1').bind(await sha(token),Date.now()).first()||null;
}
export async function loginTeam(payload,env){
  if(!payload||typeof payload.username!=='string'||typeof payload.password!=='string'||payload.username.length>128||payload.password.length>128)return null;
  const username=payload.username.trim(),admin=env.PANEL_USERNAME||'Alexsos';
  if(username===admin){
    const hash=env.PANEL_PASSWORD?await sha(env.PANEL_PASSWORD):'095fdc1e44699663a46ea67708756b179a7c5e672b41c8213e187c6fbc31bfa7';
    if(await sha(payload.password)!==hash)return null;
    return {id:'administrator',username:admin,name:env.PANEL_NAME||admin,role:'A'};
  }
  const user=await env.LIVE_DB.prepare('SELECT * FROM team_users WHERE username=? COLLATE NOCASE AND active=1').bind(username).first();
  if(!user||await passwordHash(payload.password,user.salt)!==user.password_hash)return null;
  const change=await env.LIVE_DB.prepare('SELECT required FROM team_password_changes WHERE user_id=?').bind(user.id).first();
  return {id:user.id,username:user.username,name:user.name,role:'C',must_change_password:!!change?.required||payload.password==='1234'};
}
export async function createSession(user,request,db){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const expires=Date.now()+30*86400000;
  if(user.role==='A')await db.prepare('INSERT INTO live_sessions (token,expires) VALUES (?,?)').bind(await sha(token),expires).run();
  else await db.prepare('INSERT INTO team_sessions (token,user_id,expires) VALUES (?,?,?)').bind(await sha(token),user.id,expires).run();
  return sessionCookie(user.role==='A'?'admin_session':'retorno_session',token,request);
}
export function sessionCookie(name,token,request){return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict${new URL(request.url).protocol==='https:'?'; Secure':''}${token?'':'; Max-Age=0'}`;}
export async function logoutTeam(request,db){for(const [name,table] of [['admin_session','live_sessions'],['retorno_session','team_sessions']]){const token=cookieToken(request,name);if(token)await db.prepare('DELETE FROM '+table+' WHERE token=?').bind(await sha(token)).run();}}
export async function saveCollaborator(db,payload,env){
  if(!payload||typeof payload.username!=='string'||typeof payload.name!=='string'||typeof payload.active!=='boolean'||(payload.role&&payload.role!=='C'))return {error:'Dados inválidos.',status:400};
  const username=payload.username.trim(),name=payload.name.trim();
  if(!/^[a-zA-Z0-9._-]{3,64}$/.test(username)||username.toLowerCase()===(env.PANEL_USERNAME||'Alexsos').toLowerCase()||!name||name.length>100)return {error:'Informe nome, usuário (3 a 64 caracteres).',status:400};
  const old=payload.id?await db.prepare('SELECT id FROM team_users WHERE id=?').bind(payload.id).first():null;
  if(payload.id&&!old)return {error:'Colaborador não encontrado.',status:404};
  const duplicate=await db.prepare('SELECT id FROM team_users WHERE username=? COLLATE NOCASE').bind(username).first();
  if(duplicate&&duplicate.id!==payload.id)return {error:'Este usuário já existe.',status:409};
  const id=payload.id||crypto.randomUUID(),salt=crypto.randomUUID();
  if(!old)await db.batch([db.prepare("INSERT INTO team_users (id,username,name,role,password_hash,salt,active) VALUES (?,?,?,'C',?,?,?)").bind(id,username,name,await passwordHash('1234',salt),salt,payload.active?1:0),db.prepare('INSERT INTO team_password_changes (user_id,required) VALUES (?,1)').bind(id)]);
  else {
    await db.prepare('UPDATE team_users SET username=?,name=?,active=? WHERE id=?').bind(username,name,payload.active?1:0,id).run();
    await db.prepare('DELETE FROM team_sessions WHERE user_id=?').bind(id).run();
  }
  return {ok:true,id};
}

export async function resetCollaboratorPassword(db,id){
 if(typeof id!=='string'||!await db.prepare('SELECT id FROM team_users WHERE id=?').bind(id).first())return {error:'Colaborador não encontrado.',status:404};
 const salt=crypto.randomUUID(),hash=await passwordHash('1234',salt);
 await db.batch([db.prepare('UPDATE team_users SET password_hash=?,salt=? WHERE id=?').bind(hash,salt,id),db.prepare('INSERT INTO team_password_changes (user_id,required) VALUES (?,1) ON CONFLICT(user_id) DO UPDATE SET required=1').bind(id),db.prepare('DELETE FROM team_sessions WHERE user_id=?').bind(id)]);
 return {ok:true};
}
export async function changeOwnPassword(db,user,data){
 if(user.role!=='C')return {error:'Operação disponível para colaboradores.',status:403};
 if(!data||typeof data.current_password!=='string'||typeof data.new_password!=='string'||data.new_password.length<10||data.new_password.length>128||data.new_password!==data.confirm_password||data.new_password===data.current_password)return {error:'Confirme uma nova senha diferente da atual, com 10 a 128 caracteres.',status:400};
 const row=await db.prepare('SELECT password_hash,salt FROM team_users WHERE id=? AND active=1').bind(user.id).first();
 if(!row||await passwordHash(data.current_password,row.salt)!==row.password_hash)return {error:'Senha atual incorreta.',status:400};
 const salt=crypto.randomUUID(),hash=await passwordHash(data.new_password,salt);
 await db.batch([db.prepare('UPDATE team_users SET password_hash=?,salt=? WHERE id=?').bind(hash,salt,user.id),db.prepare('INSERT INTO team_password_changes (user_id,required) VALUES (?,0) ON CONFLICT(user_id) DO UPDATE SET required=0').bind(user.id),db.prepare('DELETE FROM team_sessions WHERE user_id=?').bind(user.id)]);
 return {ok:true};
}
