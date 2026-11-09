import {identity,ensureTeam,loginTeam,createSession,logoutTeam,sessionCookie,saveCollaborator} from './team-auth.js';
import {surveyResults,saveAttendance} from './chopeira-survey.js';
const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
async function payload(request){try{const raw=await request.text();return raw.length<=8192?JSON.parse(raw):null;}catch{return null;}}
export async function teamRouter(context){
  const {request,env}=context,url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
  const shared=['/painel/api/login','/painel/api/logout','/painel/api/session'];
  if(!path.startsWith('/retorno/api/')&&!path.startsWith('/painel/api/users')&&!shared.includes(path))return null;
  if(!env.LIVE_DB)return json({error:'Sistema temporariamente indisponível.'},503);
  try {
    await ensureTeam(env.LIVE_DB);
    if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
    if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
    if(path.endsWith('/login')&&request.method==='POST'){
      const user=await loginTeam(await payload(request),env);if(!user)return json({error:'Usuário ou senha incorretos.'},401);
      return json({ok:true,user},200,{'Set-Cookie':await createSession(user,request,env.LIVE_DB)});
    }
    const user=await identity(request,env);
    if(path.endsWith('/session')&&request.method==='GET')return json({authenticated:!!user,user});
    if(path.endsWith('/logout')&&request.method==='POST'){
      await logoutTeam(request,env.LIVE_DB);const response=json({ok:true});
      for(const name of ['admin_session','retorno_session'])response.headers.append('Set-Cookie',sessionCookie(name,'',request));return response;
    }
    if(!user)return json({error:'Entre no sistema para continuar.'},401);
    if(path==='/painel/api/users'){
      if(user.role!=='A')return json({error:'Acesso exclusivo do administrador.'},403);
      if(request.method==='POST'){const result=await saveCollaborator(env.LIVE_DB,await payload(request),env);return json(result,result.status||200);}
      const users=await env.LIVE_DB.prepare('SELECT id,username,name,role,active FROM team_users ORDER BY name').all();return json({users:users.results||[]});
    }
    if(path==='/retorno/api/contacts'&&request.method==='GET'){
      // Product sections use existing consented survey sources; currently Chopeira.
      const offset=Number(url.searchParams.get('offset')||0);
      if(!Number.isSafeInteger(offset)||offset<0)return json({error:'Página inválida.'},400);
      const data=await surveyResults(env.LIVE_DB,{start:'2000-01-01',end:'2099-12-31'},'all',offset);
      return json({products:[{id:'chopeira',name:'Chopeira',contacts:data.rows,total:data.total,offset:data.offset,limit:data.limit}],user});
    }
    if(path==='/retorno/api/attendance'&&request.method==='POST'){
      const saved=await saveAttendance(env.LIVE_DB,await payload(request),user);return json(saved,saved.status||200);
    }
    return json({error:'Página não encontrada.'},404);
  }catch{return json({error:'Não foi possível concluir. Tente novamente.'},503);}
}
