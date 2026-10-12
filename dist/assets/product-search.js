export const referenceVersion='2026-10-12';
export const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9.,\s]/g,' ').replace(/\s+/g,' ').trim();
export function wantsHuman(text){
 const q=normalize(text);
 if(/\b(whatsapp|whats|zap|wpp|atendente|atendimento|vendedor|vendedora|consultor|consultora|suporte|humano|humana|pessoa real|gente de verdade)\b/.test(q))return true;
 if(/\b(falar|conversar|chamar|contato|telefone|numero)\b/.test(q)&&/\b(alguem|pessoa|equipe|loja|bufalo|voces|funcionario|funcionaria|representante)\b/.test(q))return true;
 return /\b(nao quero|cansei de|pare de)\b.*\b(robo|bot|ia)\b/.test(q);
}
// Referências de intenção e nomes alternativos; não representam especificações.
export const references={
 'garrafas':['garrafa','garrafas','squeeze','cantil','termo','bottle','hidratar','hidratacao','academia','treino','agua','beber agua','garrafa termica'],
 'copos-bg':['copo','copos','caneca','canecas','tumbler','mug','cafe','cafezinho','copo termico','copo de cerveja'],
 'chopeiras':['chopeira','chopeiras','chopera','choppeira','chopp','chope','cerveja','cervejeira','barril','torneira','ontap','on tap','tirar chope'],
 'carabinho-kids':['escola','escolar','crianca','criancas','infantil','kids','filho','filha','colegio','lancheira','garrafa infantil'],
 'mochilas':['mochila','mochilas','estanque','dry bag','drybag','bolsa impermeavel','saco impermeavel','trilha','chuva','remar','canoagem','guardar celular'],
 'nagpro':['cooler','caixa termica','caixa de gelo','geleira','isopor','cooler rigido'],
 'pandhar':['bolsa termica','soft cooler','sacola termica','wine tote'],
 'cutelaria':['faca','facas','canivete','churrasco','churrasqueira','tabua','cortar carne','cutelaria','bbq'],
 'cadeiras':['cadeira','cadeiras','sentar','cadeira de praia'],
 'camisas-shorts':['camisa','camiseta','bermuda','short','shorts','roupa','chinelo'],
 'alcas-e-bags':['alca','bag','neoprene','unibag','bolsa para copo','bolsa para garrafa','capa de tecido'],
 'tampas-e-acessorios':['tampa','tampas','canudo','bico','borracha','vedacao','base de silicone','tirante','acessorio'],
 'adesivos':['adesivo','adesivos','sticker'],
 'souvenir-e-jogos':['frescobol','jogo','souvenir']
};
export const modelAliases={niliravi:['nili','nili ravi','niliravy','nilirave'],bhadwari:['bhadawari','badwari','badawari'],jafarabadi:['jafa','jafarabady','jafarabadi'],harpuri:['harpure','harpury'],carabinho:['carabim','carabinho teen'],garca:['garsa'],guara:['guarra'],murrah:['mura','murra'],banni:['bani','banny'],mediterraneo:['med','mediterraneo'],surti:['surty'],nagneck:['nag neck','long neck','longneck'],marajo:['marajo dry'],'easy drink':['easydrink'],hotdrink:['hot drink']};
const ignored=new Set('quero preciso procura procurar busco buscar produto produtos para uma um com de da do o a e em meu minha favor voce tem qual que mais menos nao sim era isso outro outra acordo pedido encontre por ate'.split(' '));
const generic=new Set('bufalo growler garrafa copo caneca tampa capa alca bag inox termica termico portatil combo kids padrão padrao silicone madeira kit base original premium pro para com na de e ml'.split(' '));
function distance(a,b){const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]!==b[j-1]));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[a.length][b.length];}
function similar(a,b){if(a===b)return 1;if(a.length<4||b.length<4||/\d/.test(a+b))return 0;const d=distance(a,b);return d<=(Math.min(a.length,b.length)>=7?2:1)?1-d/Math.max(a.length,b.length):0;}
function phrase(q,s){return (' '+q+' ').includes(' '+normalize(s)+' ');}
function family(p){const n=normalize(p.name);if(p.category==='carabinho-kids')return p.category;if(/^(tampa|canudo|capa|base|tirante|escovinha|extrator|argola|bomba|chaveiro)/.test(n))return 'tampas-e-acessorios';if(/^(alca|bag|unibag)/.test(n))return 'alcas-e-bags';if(/^(copo|caneca)/.test(n))return 'copos-bg';if(/growler de vidro/.test(n))return 'garrafas';return p.category;}
export function buildReferenceIndex(products){return products.map(p=>({id:p.id,name:p.name,category:family(p),references:[p.name,...(references[family(p)]||[]),...Object.entries(modelAliases).filter(([m])=>normalize(p.name).includes(m)||modelAliases[m].some(a=>normalize(p.name).includes(a))).flatMap(([m,a])=>[m,...a])]}));}
export function searchProducts(products,messages,rejected=[]){
 const users=messages.filter(m=>m.role==='user');const q=normalize(users.at(-1)?.content||'');if(wantsHuman(q))return {message:'Claro! Toque abaixo para falar com a equipe Búfalo no WhatsApp.',productIds:[],category:null,model:null,matchType:'human',needsHuman:true};const terms=q.split(/\s+/).filter(t=>t.length>2&&!ignored.has(t));
 const colorNames=[...new Set([...products.flatMap(p=>p.colors).map(normalize),'azul','verde','preto','branco','rosa','vermelho','creme','magenta','chocolate','pistache','petroleo','mirtilo','nuvem','pitaya','areia','celeste'])];
 const colors=colorNames.filter(c=>phrase(q,c));
 const cap=q.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|litros?|litre)\b/);const capacity=cap?Number(cap[1].replace(',','.'))*(cap[2]==='ml'?1:1000):null;
 const categoryWords=new Set(Object.values(references).flat().flatMap(s=>normalize(s).split(' ')));
 const models=[...new Set(products.flatMap(p=>normalize(p.name).split(/\s+/)).filter(t=>t.length>=4&&!generic.has(t)&&!categoryWords.has(t)&&!colorNames.some(c=>phrase(c,t))&&!/[0-9]/.test(t)))];
 let model=Object.entries(modelAliases).find(([m,a])=>phrase(q,m)||a.some(s=>phrase(q,s)))?.[0];let modelQuality=model?1:0;
 if(!model)for(const t of terms)for(const m of models){const s=similar(t,m);if(s>modelQuality){model=m;modelQuality=s;}}
 const intents=Object.entries(references).map(([cat,aliases])=>({cat,score:aliases.reduce((n,a)=>Math.max(n,phrase(q,a)?normalize(a).split(' ').length*4:(!a.includes(' ')&&terms.some(t=>similar(t,a)>.65)?2:0)),0)})).sort((a,b)=>b.score-a.score);
 let category=intents[0]?.score?intents[0].cat:null;
 if(!model&&/\b(escola|escolar|colegio|infantil|crianca|criancas|kids|filho|filha)\b/.test(q))category='carabinho-kids';
 // Nome de modelo prevalece sobre ocasião; acessórios explícitos prevalecem sobre o modelo.
 const accessory=/\b(tampa|tampas|canudo|bico|borracha|capa|tirante|alca|bag|neoprene)\b/.test(q);
 if(model&&!accessory){const main=products.find(p=>normalize(p.name).includes(model)&&!['tampas-e-acessorios','alcas-e-bags'].includes(family(p)));if(main)category=family(main);}
 if(/\b(tampa|tampas|canudo|bico|borracha|tirante)\b/.test(q))category='tampas-e-acessorios';
 if(!category&&(colors.length||capacity!==null||/\b(menor|maior|pequena|grande)\b/.test(q))&&users.length>1){const prior=searchProducts(products,users.slice(0,-1));category=prior.category;model=prior.model;}
 const guidance='Diga o tipo ou modelo e para que vai usar. Ex.: garrafa para academia, copo Niliravi 900 ml ou tampa para Garça 500 ml.';
 if(!terms.length&&!category)return {message:guidance,productIds:[],category:null,model:null,matchType:'none',needsHuman:false};
 if(category==='tampas-e-acessorios'&&!model&&!/\b(hotdrink|easydrink|esporte|canudo|tirante|escovinha)\b/.test(q))return {message:'Qual é o modelo do copo ou garrafa? Ex.: tampa para Garça 500 ml. Confirme a compatibilidade na loja.',productIds:[],category,model:model||null,matchType:'clarification',needsHuman:false};
 const rows=products.map(p=>{if(rejected.includes(p.id))return {p,score:-1};const n=normalize(p.name),f=family(p);let score=category===f?8:0;if(category&&f!==category)return {p,score:-1};if(model){const aliases=modelAliases[model]||[];if(!phrase(n,model)&&!aliases.some(a=>phrase(n,a)))return {p,score:-1};score+=18;}if(capacity!==null&&!(f==='tampas-e-acessorios'&&!p.volume)){const raw=normalize(p.volume).replace(/(\d)\.(\d{3})\s*ml/,'$1$2ml');const v=raw.match(/(\d+(?:[.,]\d+)?)\s*(ml|l)\b/);if(!v||Math.abs(Number(v[1].replace(',','.'))*(v[2]==='ml'?1:1000)-capacity)>0.1)return {p,score:-1};score+=5;}if(colors.length&&!colors.some(c=>p.colors.some(pc=>phrase(normalize(pc),c))||phrase(n,c)))return {p,score:-1};for(const t of terms)if(phrase(n,t))score+=2;return {p,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 const seen=new Set();const hits=rows.filter(x=>{if(seen.has(x.p.url))return false;seen.add(x.p.url);return true;}).slice(0,4);
 return {message:hits.length?'Veja as opções para o seu pedido.':guidance,productIds:hits.map(x=>x.p.id),category,model:model||null,matchType:hits.length?(modelQuality>0&&modelQuality<1?'typo':model?'model':'context'):'none',needsHuman:false};
}
