(()=>{
 const C=ManadaGameCore,$=id=>document.getElementById(id),icons=['🥤','🧊','🎒','🍶','⛺','🪑','☕','🦬'];
 const games=[
  {id:'runner',title:'Corrida da Manada',icon:'🦬',kind:'Um toque',target:'Chegue ao acampamento',instructions:'Toque na pista ou em Pular para passar por pedras e coolers. No computador, use Espaço ou ↑. Sobreviva por 32 segundos para chegar ao acampamento.',code:'DEMO-CORRIDA20'},
  {id:'stack',title:'Empilhe a Aventura',icon:'🧊',kind:'Precisão',target:'Empilhe 10 caixas',instructions:'A caixa desliza de um lado para outro. Toque na pista ou em Empilhar quando ela estiver alinhada com a caixa abaixo. Complete uma torre de 10 caixas.',code:'DEMO-TORRE20'},
  {id:'memory',title:'Memória da Manada',icon:'🃏',kind:'Memória',target:'Encontre os 8 pares',instructions:'Vire duas cartas por vez e encontre todos os pares. Sem limite de tempo: observe os produtos e complete os oito pares para liberar o cupom.',code:'DEMO-MEMORIA20'},
  {id:'camp',title:'Monte seu Acampamento',icon:'⛺',kind:'Toque ou arraste',target:'Organize 5 produtos',instructions:'Arraste cada produto para seu espaço. Você também pode tocar no produto e depois no lugar correspondente. Monte o acampamento completo.',code:'DEMO-CAMP20'},
  {id:'catch',title:'Pegue sua Companhia',icon:'🎒',kind:'Agilidade',target:'Colete 15 produtos',instructions:'Arraste a mochila para pegar os produtos que caem e evitar as pedras. Use os botões ou as setas ← e → no computador. Você tem três chances.',code:'DEMO-MOCHILA20'},
  {id:'maze',title:'Trilha dos Copos',icon:'🥤',kind:'Exploração',target:'3 copos + a barraca',instructions:'Percorra as passagens, pegue os três copos e chegue à barraca. Deslize o dedo na pista, use os botões de direção ou as setas do teclado.',code:'DEMO-TRILHA20'},
  {id:'balance',title:'Desafio do Equilíbrio',icon:'🏕️',kind:'Equilíbrio',target:'Complete 3 etapas',instructions:'Mantenha a pilha perto do centro. Segure ← para corrigir a inclinação à direita e → para corrigir à esquerda. Complete três etapas de oito segundos.',code:'DEMO-EQUILIBRIO20'}
 ];
 const gear=[{id:'tent',icon:'⛺',name:'Barraca'},{id:'chair',icon:'🪑',name:'Cadeira'},{id:'cooler',icon:'🧊',name:'Cooler'},{id:'bag',icon:'🎒',name:'Mochila'},{id:'bottle',icon:'🍶',name:'Garrafa'}];
 let completed=[];try{completed=JSON.parse(localStorage.getItem('manada-games-demo')||'[]');if(!Array.isArray(completed))completed=[];}catch{}
 let active=games[0],state=null,canvas=null,ctx=null,last=0,uiTime=0,signature='',announced='',rewardShown=false,dragStart=null;
 function message(text){$('game-message').textContent=text;}
 function cards(){
  $('game-grid').replaceChildren();games.forEach((g,i)=>{const b=document.createElement('button');b.className='game-card';b.setAttribute('aria-pressed',String(g.id===active.id));b.innerHTML=`<span class="game-icon" aria-hidden="true">${g.icon}</span><strong>${g.title}</strong><small>${g.target}</small>${completed.includes(g.id)?'<small class="completed-mark">✓ Concluído</small>':''}`;b.addEventListener('click',()=>{select(g.id);$('play-area').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});$('game-grid').append(b);});
  $('completion-count').textContent=completed.filter(id=>games.some(g=>g.id===id)).length+' de 7 desafios concluídos';
 }
 function control(label,action,value,hold=false){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);
  if(hold){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);C.input(state,'axis',value);if(active.id==='balance')C.input(state,'nudge',value);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(state)state.axis=0;});}
  else b.addEventListener('click',()=>act(action,value));$('game-controls').append(b);
 }
 function buildStage(){
  $('stage').replaceChildren();$('game-controls').replaceChildren();canvas=null;ctx=null;
  if(active.id==='memory'){
   const board=document.createElement('div');board.className='memory-board';board.setAttribute('aria-label','Cartas da memória');
   for(let i=0;i<16;i++){const b=document.createElement('button');b.className='memory-tile';b.dataset.index=i;b.textContent='?';b.setAttribute('aria-label','Carta '+(i+1)+' oculta');b.addEventListener('click',()=>act('flip',i));board.append(b);}$('stage').append(board);
  }else if(active.id==='camp'){
   const scene=document.createElement('div');scene.className='camp-scene';scene.innerHTML='<h3>Seu acampamento começa aqui</h3><div class="camp-slots"></div>';
   gear.forEach(item=>{const b=document.createElement('button');b.className='camp-slot';b.dataset.slot=item.id;b.innerHTML=`<span aria-hidden="true">＋</span>${item.name}`;b.setAttribute('aria-label','Espaço da '+item.name);b.addEventListener('click',()=>act('place',item.id));scene.querySelector('.camp-slots').append(b);});
   const items=document.createElement('div');items.className='camp-items';
   gear.forEach(item=>{const b=document.createElement('button');b.className='camp-item';b.dataset.item=item.id;b.textContent=item.icon;b.setAttribute('aria-label',item.name);b.addEventListener('click',()=>act('select',item.id));b.addEventListener('pointerdown',e=>{if(state?.status!=='running')return;act('select',item.id);b.setPointerCapture(e.pointerId);b.style.transform='scale(1.12)';});b.addEventListener('pointerup',e=>{b.style.transform='';const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');if(slot)act('place',slot.dataset.slot);});b.addEventListener('pointercancel',()=>b.style.transform='');items.append(b);});$('stage').append(scene,items);
  }else{
   canvas=document.createElement('canvas');canvas.width=C.W;canvas.height=C.H;canvas.tabIndex=0;canvas.setAttribute('aria-label',active.title+'. '+active.instructions);ctx=canvas.getContext('2d');$('stage').append(canvas);
   canvas.addEventListener('pointerdown',e=>{if(state?.status!=='running')return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);const pos=point(e);dragStart=pos;if(active.id==='runner')act('jump');if(active.id==='stack')act('drop');if(active.id==='catch')act('position',pos.x);if(active.id==='balance'){const dir=pos.x<C.W/2?-1:1;act('axis',dir);act('nudge',dir);}});
   canvas.addEventListener('pointermove',e=>{if(dragStart&&active.id==='catch')act('position',point(e).x);});
   canvas.addEventListener('pointerup',e=>{if(dragStart&&active.id==='maze'){const p=point(e),dx=p.x-dragStart.x,dy=p.y-dragStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>15)act('move',Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?2:0);}dragStart=null;if(state)state.axis=0;});canvas.addEventListener('pointercancel',()=>{dragStart=null;if(state)state.axis=0;});
   if(active.id==='runner')control('Pular ↑','jump');
   if(active.id==='stack')control('Empilhar ↓','drop');
   if(active.id==='catch'||active.id==='balance'){control('Esquerda ←','axis',-1,true);control('Direita →','axis',1,true);}
   if(active.id==='maze'){control('Esquerda ←','move',3);control('Cima ↑','move',0);control('Baixo ↓','move',2);control('Direita →','move',1);}
  }
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*C.W/r.width,y:(e.clientY-r.top)*C.H/r.height};}
 function overlay(title,detail){const div=document.createElement('div');div.className='stage-overlay';div.innerHTML='<div><strong></strong><p></p></div>';div.querySelector('strong').textContent=title;div.querySelector('p').textContent=detail;$('stage').append(div);}
 function select(id){
  active=games.find(g=>g.id===id)||games[0];state=null;signature='';announced='';rewardShown=false;dragStart=null;
  $('play-title').textContent=active.title;$('play-category').textContent='DESAFIO '+String(games.indexOf(active)+1).padStart(2,'0');$('play-badge').textContent=active.kind;$('play-instructions').textContent=active.instructions;$('game-reward').hidden=true;$('game-progress').style.width='0%';$('game-score').textContent=active.target;$('game-lives').textContent='';$('game-start').textContent='Começar desafio';$('game-start').disabled=false;$('game-pause').disabled=true;$('game-pause').textContent='Pausar';$('play-area').classList.remove('paused');message('Selecione “Começar desafio” para jogar.');cards();buildStage();if(canvas)draw(C.create(active.id,()=>.5));overlay(active.title,'Clique em Começar desafio. '+active.target+'.');
 }
 function start(){state=C.create(active.id);signature='';announced='';rewardShown=false;$('game-reward').hidden=true;$('stage').querySelectorAll('.stage-overlay').forEach(e=>e.remove());$('play-area').classList.remove('paused');$('game-start').disabled=true;$('game-start').textContent='Jogando';$('game-pause').disabled=false;$('game-pause').textContent='Pausar';message('Valendo! '+active.target+'.');if(canvas)canvas.focus({preventScroll:true});renderDOM();updateUI();}
 function act(action,value){C.input(state,action,value);renderDOM();updateUI();if(canvas&&state)draw(state);}
 function togglePause(){if(!state||state.status!=='running')return;state.paused=!state.paused;state.axis=0;$('play-area').classList.toggle('paused',state.paused);$('game-pause').textContent=state.paused?'Continuar':'Pausar';message(state.paused?'Desafio pausado. Continue quando quiser.':'A aventura continua.');}
 function renderDOM(){
  if(!state)return;
  if(active.id==='memory'){
   const next=state.cards.map(c=>(c.matched?'m':c.open?'o':'x')).join('');if(signature===next)return;signature=next;
   $('stage').querySelectorAll('.memory-tile').forEach((b,i)=>{const c=state.cards[i];b.textContent=c.open||c.matched?icons[c.face]:'?';b.classList.toggle('is-face',c.open);b.classList.toggle('is-match',c.matched);b.disabled=c.matched||state.status!=='running';b.setAttribute('aria-label',c.open||c.matched?'Carta '+(i+1)+': '+['copo','cooler','mochila','garrafa','barraca','cadeira','caneca','búfalo'][c.face]+(c.matched?', par encontrado':''):'Carta '+(i+1)+' oculta');});
  }
  if(active.id==='camp'){
   $('stage').querySelectorAll('.camp-item').forEach(b=>{b.disabled=state.placed.includes(b.dataset.item);b.classList.toggle('is-selected',state.selected===b.dataset.item);b.setAttribute('aria-pressed',String(state.selected===b.dataset.item));});
   $('stage').querySelectorAll('.camp-slot').forEach(b=>{const filled=state.placed.includes(b.dataset.slot);b.classList.toggle('is-filled',filled);b.querySelector('span').textContent=filled?gear.find(g=>g.id===b.dataset.slot).icon:'＋';});
  }
 }
 function updateUI(){
  if(!state)return;const progress=C.progress(state);$('game-progress').style.width=Math.round(progress*100)+'%';
  const scores={runner:`${Math.min(32,Math.floor(state.elapsed))} / 32 segundos`,stack:`${state.count} / 10 caixas`,memory:`${state.pairs} / 8 pares`,camp:`${state.placed?.length} / 5 produtos`,catch:`${state.count} / 15 produtos`,maze:`${state.collected?.length} / 3 copos`,balance:`Etapa ${Math.min(3,state.phase+1)} / 3 · ${Math.floor(state.phaseTime||0)} / 8 segundos`};
  $('game-score').textContent=scores[state.id];$('game-lives').textContent=state.lives===null?'Sem limite de tentativas':'♥'.repeat(Math.max(0,state.lives))+'♡'.repeat(Math.max(0,3-state.lives));
  if(state.event&&state.event!==announced){message(state.event);announced=state.event;}
  if(state.status==='won'&&!rewardShown){rewardShown=true;completed=[...new Set([...completed,active.id])];try{localStorage.setItem('manada-games-demo',JSON.stringify(completed));}catch{}cards();$('reward-code').textContent=active.code;$('copy-coupon').textContent='Copiar cupom';$('game-reward').hidden=false;$('game-start').textContent='Jogar novamente';$('game-start').disabled=false;$('game-pause').disabled=true;message('Desafio concluído! Seu cupom demonstrativo está logo abaixo.');}
  if(state.status==='lost'){$('game-start').textContent='Tentar novamente';$('game-start').disabled=false;$('game-pause').disabled=true;if(!$('stage').querySelector('.stage-overlay'))overlay('Mais uma aventura?',state.event);}
 }
 function landscape(time=0){
  ctx.fillStyle='#edf1e5';ctx.fillRect(0,0,C.W,C.H);ctx.fillStyle='#f4c27f';ctx.beginPath();ctx.arc(535,68,27,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d5deca';ctx.beginPath();ctx.moveTo(0,240);for(let x=0;x<=C.W;x+=20)ctx.lineTo(x,220+Math.sin(x/100)*35);ctx.lineTo(C.W,C.H);ctx.lineTo(0,C.H);ctx.fill();
  for(let i=0;i<5;i++){const x=((i*170-time*25)%820+820)%820-70;ctx.fillStyle='#9bad8d';ctx.beginPath();ctx.moveTo(x,150);ctx.lineTo(x-28,220);ctx.lineTo(x+28,220);ctx.fill();ctx.fillRect(x-3,210,6,42);}
  ctx.fillStyle='#c3d1b5';ctx.fillRect(0,303,C.W,77);ctx.fillStyle='#829476';ctx.fillRect(0,301,C.W,3);
 }
 function buffalo(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#142e32';ctx.fillRect(-17,-30,40,22);ctx.fillRect(-14,-10,7,10);ctx.fillRect(12,-10,7,10);ctx.beginPath();ctx.arc(28,-29,13,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-5,-34,16,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#142e32';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(23,-38);ctx.quadraticCurveTo(17,-55,14,-43);ctx.moveTo(33,-39);ctx.quadraticCurveTo(44,-51,45,-40);ctx.stroke();ctx.fillStyle='#ffb777';ctx.fillRect(37,-28,3,3);ctx.restore();}
 function cooler(x,y,w,h=24){ctx.fillStyle='#ffb777';ctx.fillRect(x,y,w,h);ctx.fillStyle='#142e32';ctx.fillRect(x,y,w,5);if(w>50){ctx.font='bold 8px Arial';ctx.textAlign='center';ctx.fillText('BÚFALO',x+w/2,y+17);}ctx.strokeStyle='#142e32';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);}
 function draw(s){
  if(!ctx)return;ctx.clearRect(0,0,C.W,C.H);ctx.textAlign='center';landscape(s.id==='runner'?s.elapsed:0);
  if(s.id==='runner'){s.obstacles.forEach(o=>cooler(o.x,302-o.h,o.w,o.h));ctx.globalAlpha=s.shield>0?.5:1;buffalo(95,s.y,1);ctx.globalAlpha=1;ctx.fillStyle='#142e32';ctx.font='bold 15px Arial';ctx.fillText('ACAMPAMENTO →',510,285);}
  if(s.id==='stack'){s.blocks.forEach(b=>cooler(b.x,b.y,b.w));if(s.status==='running')cooler(s.x,s.blocks.at(-1).y-24,s.width);ctx.strokeStyle='#e77939';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(s.blocks.at(-1).x,20);ctx.lineTo(s.blocks.at(-1).x,326);ctx.stroke();ctx.setLineDash([]);}
  if(s.id==='catch'){ctx.font='30px Arial';s.items.forEach(i=>ctx.fillText(i.rock?'🪨':icons[i.face],i.x,i.y));ctx.fillStyle='#142e32';ctx.beginPath();ctx.roundRect(s.x-45,322,90,45,12);ctx.fill();ctx.strokeStyle='#ffb777';ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,330,22,Math.PI,0);ctx.stroke();ctx.fillStyle='#ffb777';ctx.font='bold 10px Arial';ctx.fillText('MANADA',s.x,355);}
  if(s.id==='maze'){
   ctx.fillStyle='#edf1e5';ctx.fillRect(0,0,C.W,C.H);const size=40,ox=160,oy=28;ctx.strokeStyle='#142e32';ctx.lineWidth=3;
   s.cells.forEach((walls,n)=>{const x=ox+n%8*size,y=oy+Math.floor(n/8)*size;walls.forEach((wall,d)=>{if(!wall)return;const a=[[x,y],[x+size,y],[x+size,y+size],[x,y+size]][d],b=[[x+size,y],[x+size,y+size],[x,y+size],[x,y]][d];ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();});});
   ctx.font='24px Arial';s.cups.filter(c=>!s.collected.includes(c)).forEach(n=>ctx.fillText('🥤',ox+n%8*size+20,oy+Math.floor(n/8)*size+28));ctx.fillText('⛺',ox+7*size+20,oy+7*size+29);buffalo(ox+s.player%8*size+17,oy+Math.floor(s.player/8)*size+29,.45);
  }
  if(s.id==='balance'){
   ctx.save();ctx.translate(320,308);ctx.rotate(s.angle);ctx.fillStyle='#142e32';ctx.fillRect(-100,0,200,12);for(let i=0;i<4;i++)cooler(-65+i*3,-28-i*29,130-i*6,26);ctx.restore();ctx.fillStyle='#142e32';ctx.beginPath();ctx.moveTo(320,315);ctx.lineTo(300,349);ctx.lineTo(340,349);ctx.fill();ctx.font='bold 13px Arial';ctx.fillText('MANTENHA O EQUILÍBRIO',320,47);ctx.fillStyle='#dde4d7';ctx.fillRect(210,67,220,8);ctx.fillStyle='#e77939';ctx.fillRect(315+s.angle*170,62,10,18);
  }
 }
 function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(state&&!document.hidden){C.update(state,dt);if(canvas)draw(state);renderDOM();if(now-uiTime>120||state.status!=='running'){updateUI();uiTime=now;}}requestAnimationFrame(frame);}
 const directions={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
 document.addEventListener('keydown',e=>{if(!state||state.status!=='running'||!document.activeElement?.closest('.play-area'))return;if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft',' '].includes(e.key))e.preventDefault();if(active.id==='runner'&&(e.key===' '||e.key==='ArrowUp'))act('jump');if(active.id==='stack'&&(e.key===' '||e.key==='ArrowDown')&&!e.repeat)act('drop');if(active.id==='maze'&&e.key in directions)act('move',directions[e.key]);if(['catch','balance'].includes(active.id)&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))act('axis',e.key==='ArrowLeft'?-1:1);});
 document.addEventListener('keyup',e=>{if(state&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))state.axis=0;});window.addEventListener('blur',()=>{if(state)state.axis=0;});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&state?.status==='running'&&!state.paused)togglePause();});
 $('game-start').addEventListener('click',start);$('game-reset').addEventListener('click',start);$('game-pause').addEventListener('click',togglePause);
 $('copy-coupon').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(active.code);$('copy-coupon').textContent='Copiado!';}catch{message('Seu cupom de exemplo: '+active.code+'. Selecione o código para copiar.');}});
 select('runner');requestAnimationFrame(frame);
})();
