import {readLimited} from './live-content.js';

export const raffleSchema = `CREATE TABLE IF NOT EXISTS live_raffle (
  id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0,
  participants TEXT NOT NULL DEFAULT '[]', candidate TEXT,
  winners TEXT NOT NULL DEFAULT '[]'
)`;
const headers = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
const key = name => name.normalize('NFKC').toLocaleLowerCase('pt-BR');
export function participantNames(text) {
  if(typeof text!=='string'||text.length>150000)throw new Error('Informe até 5.000 nomes, um por linha.');
  const names=text.split(/\r?\n/).map(name=>name.trim().replace(/\s+/g,' ')).filter(Boolean);
  if(names.length>5000||names.some(name=>name.length>120||/[\u0000-\u001f\u007f]/.test(name)))throw new Error('Use até 5.000 nomes com no máximo 120 caracteres cada.');
  return [...new Map(names.map(name=>[key(name),name])).values()];
}
function randomIndex(length) {
  const value=new Uint32Array(1), limit=2**32-(2**32%length);
  do { crypto.getRandomValues(value); } while(value[0]>=limit);
  return value[0]%length;
}
async function state(db) {
  const row=await db.prepare('SELECT * FROM live_raffle WHERE id=1').first();
  return {revision:row.revision,participants:JSON.parse(row.participants),candidate:row.candidate,winners:JSON.parse(row.winners)};
}
export async function handleRaffle(request,db,authenticated) {
  const url=new URL(request.url), path=url.pathname.replace(/\/$/,'');
  if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
  const publicRead=path==='/live/api/raffle'&&request.method==='GET';
  if(!publicRead&&!await authenticated())return json({error:'Entre no painel para continuar.'},401);
  await db.prepare(raffleSchema).run();
  await db.prepare('INSERT OR IGNORE INTO live_raffle(id) VALUES(1)').run();
  const current=await state(db);
  if(publicRead)return json({revision:current.revision,winners:current.winners});
  if(path==='/live/api/raffle/admin'&&request.method==='GET')return json(current);
  if(request.method!=='POST'||path!=='/live/api/raffle/admin')return json({error:'Página não encontrada.'},404);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato inválido.'},415);
  let body;
  try { body=JSON.parse(new TextDecoder().decode(await readLimited(request,650000))); }
  catch { return json({error:'Pedido inválido ou muito grande.'},400); }
  if(!body||!Number.isSafeInteger(body.revision))return json({error:'Atualize os dados antes de continuar.'},400);
  if(body.revision!==current.revision)return json({error:'Os sorteios foram alterados em outra janela. Atualize antes de continuar.'},409);
  let {participants,candidate,winners}=current;
  if(body.action==='draw') {
    if(winners.length===3)return json({error:'Os três ganhadores já foram confirmados.'},409);
    try { participants=participantNames(body.names); } catch(error) { return json({error:error.message},400); }
    const eligible=participants.filter(name=>!winners.some(winner=>key(winner.name)===key(name)));
    if(!eligible.length)return json({error:'Adicione pelo menos um participante que ainda não ganhou.'},400);
    candidate=eligible[randomIndex(eligible.length)];
  } else if(body.action==='confirm') {
    if(!candidate||winners.length>=3)return json({error:'Sorteie um nome antes de confirmar.'},409);
    const slot=[1,2,3].find(slot=>!winners.some(winner=>winner.slot===slot));
    winners=[...winners,{slot,name:candidate,confirmed_at:Date.now()}];
    candidate=null;
  } else if(body.action==='clear-participants') {
    participants=[];candidate=null;
  } else if(body.action==='clear-winner') {
    if(!Number.isInteger(body.slot)||body.slot<1||body.slot>3)return json({error:'Informe o sorteio que deseja limpar.'},400);
    if(!winners.some(winner=>winner.slot===body.slot))return json({error:'Este sorteio já está vazio. Atualize os resultados.'},409);
    winners=winners.filter(winner=>winner.slot!==body.slot);candidate=null;
  } else return json({error:'Ação inválida.'},400);
  // Compare-and-swap also protects confirmation/reset against simultaneous requests.
  const updated=await db.prepare('UPDATE live_raffle SET revision=revision+1,participants=?,candidate=?,winners=? WHERE id=1 AND revision=? RETURNING revision')
    .bind(JSON.stringify(participants),candidate,JSON.stringify(winners),body.revision).first();
  if(!updated)return json({error:'Outra operação acabou de alterar os sorteios. Atualize antes de continuar.'},409);
  return json({revision:updated.revision,participants,candidate,winners});
}
