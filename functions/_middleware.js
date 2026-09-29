const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const sha=value=>crypto.subtle.digest('SHA-256',encoder.encode(value)).then(hex);
async function authenticated(request,db){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return false;return !!await db.prepare('SELECT token FROM live_sessions WHERE token=? AND expires>?').bind(await sha(token),Date.now()).first();}
export async function onRequest(context){const {request,env}=context;const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'');if(['/live/admin','/blog/admin','/manadaone/admin'].some(prefix=>path===prefix||path.startsWith(prefix+'/'))){if(!env.LIVE_DB||!(await authenticated(request,env.LIVE_DB)))return Response.redirect(new URL('/painel/',url),302);}return context.next();}
