(()=>{
 const W=640,H=380,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function maze(rng){
  const cells=Array.from({length:64},()=>[true,true,true,true]),visited=new Set([0]),stack=[0],neighbors=n=>[n>=8?n-8:-1,n%8<7?n+1:-1,n<56?n+8:-1,n%8>0?n-1:-1];
  while(stack.length){const n=stack.at(-1),choices=neighbors(n).map((v,d)=>[v,d]).filter(([v])=>v>=0&&!visited.has(v));if(!choices.length){stack.pop();continue;}const [next,d]=choices[Math.floor(rng()*choices.length)];cells[n][d]=false;cells[next][(d+2)%4]=false;visited.add(next);stack.push(next);}
  const queue=[0],parents=new Map([[0,-1]]);for(let i=0;i<queue.length;i++){const n=queue[i];if(n===63)break;neighbors(n).forEach((v,d)=>{if(v>=0&&!cells[n][d]&&!parents.has(v)){parents.set(v,n);queue.push(v);}});}
  const path=[];for(let n=63;n!==-1;n=parents.get(n))path.unshift(n);
  return{cells,path,cups:[.25,.5,.75].map(f=>path[Math.floor((path.length-1)*f)]),player:0,collected:[]};
 }
 function create(id,rng=Math.random){
  const s={id,rng,status:'running',paused:false,elapsed:0,lives:3,event:'',axis:0};
  if(id==='runner')Object.assign(s,{y:302,vy:0,obstacles:[],spawn:1.6,shield:0});
  if(id==='stack')Object.assign(s,{blocks:[{x:220,y:326,w:200}],x:0,direction:1,width:200,count:0,lives:null});
  if(id==='memory')Object.assign(s,{cards:shuffle(Array.from({length:16},(_,i)=>({face:i%8,open:false,matched:false})),rng),picks:[],wait:0,pairs:0,lives:null});
  if(id==='camp')Object.assign(s,{selected:null,placed:[],lives:null});
  if(id==='catch')Object.assign(s,{x:320,items:[],spawn:.4,count:0});
  if(id==='maze')Object.assign(s,{...maze(rng),lives:null});
  if(id==='balance')Object.assign(s,{angle:.06,velocity:0,phase:0,phaseTime:0});
  return s;
 }
 function win(s){s.status='won';s.event='Desafio concluído! Seu cupom foi liberado.';}
 function hit(s,message){s.lives--;s.event=message;if(s.lives<=0){s.status='lost';s.event='A aventura pode recomeçar. Tente de novo!';}}
 function input(s,action,value){
  if(!s||s.status!=='running'||s.paused)return;
  if(action==='axis'){s.axis=clamp(value,-1,1);return;}
  if(s.id==='runner'&&action==='jump'&&s.y>=301){s.vy=-610;s.event='';}
  if(s.id==='stack'&&action==='drop'){
   const last=s.blocks.at(-1),left=Math.max(s.x,last.x),right=Math.min(s.x+s.width,last.x+last.w),width=right-left;
   if(width<12){s.status='lost';s.event='A caixa caiu. Ajuste o próximo encaixe e tente de novo.';return;}
   s.blocks.push({x:left,y:last.y-24,w:width});s.width=width;s.count++;s.x=s.count%2?W-width:0;s.direction=s.count%2?-1:1;s.event=`${s.count} caixas empilhadas.`;if(s.count===10)win(s);
  }
  if(s.id==='memory'&&action==='flip'){
   const c=s.cards[value];if(!c||c.open||c.matched||s.wait>0)return;c.open=true;s.picks.push(value);
   if(s.picks.length===2){const [a,b]=s.picks;if(s.cards[a].face===s.cards[b].face){s.cards[a].matched=s.cards[b].matched=true;s.picks=[];s.pairs++;s.event='Você encontrou um par!';if(s.pairs===8)win(s);}else{s.wait=.8;s.event='Mais uma tentativa. Lembre desses produtos!';}}
  }
  if(s.id==='camp'&&action==='select'&&!s.placed.includes(value)){s.selected=value;s.event='Agora toque no lugar desse produto.';}
  if(s.id==='camp'&&action==='place'&&s.selected){if(value===s.selected&&!s.placed.includes(value)){s.placed.push(value);s.selected=null;s.event='Mais uma peça do acampamento pronta!';if(s.placed.length===5)win(s);}else s.event='Esse produto combina com outro espaço. Tente novamente.';}
  if(s.id==='catch'&&action==='position')s.x=clamp(value,50,W-50);
  if(s.id==='maze'&&action==='move'){
   const d=value;if(s.cells[s.player][d]){s.event='Há uma cerca aqui. Procure outra passagem.';return;}s.player+=[-8,1,8,-1][d];
   if(s.cups.includes(s.player)&&!s.collected.includes(s.player)){s.collected.push(s.player);s.event='Você encontrou um copo!';}
   if(s.player===63){if(s.collected.length===3)win(s);else s.event='Colete os três copos antes de chegar à barraca.';}
  }
  if(s.id==='balance'&&action==='nudge')s.velocity+=value*.16;
 }
 function update(s,dt){
  if(!s||s.status!=='running'||s.paused)return;dt=clamp(dt,0,.05);s.elapsed+=dt;
  if(s.id==='runner'){
   s.vy+=1550*dt;s.y=Math.min(302,s.y+s.vy*dt);if(s.y===302)s.vy=0;s.shield=Math.max(0,s.shield-dt);s.spawn-=dt;
   if(s.spawn<=0){s.obstacles.push({x:W+40,w:28+Math.floor(s.rng()*14),h:30+Math.floor(s.rng()*18)});s.spawn=1.9+s.rng()*.6;}
   s.obstacles.forEach(o=>{o.x-=230*dt;if(s.shield===0&&o.x<118&&o.x+o.w>78&&s.y>302-o.h){hit(s,'Ops! Um obstáculo. Você ainda pode continuar.');s.shield=1.25;}});s.obstacles=s.obstacles.filter(o=>o.x+o.w>0);if(s.elapsed>=32&&s.status==='running')win(s);
  }
  if(s.id==='stack'){s.x+=s.direction*(170+s.count*6)*dt;if(s.x<0){s.x=0;s.direction=1;}if(s.x+s.width>W){s.x=W-s.width;s.direction=-1;}}
  if(s.id==='memory'&&s.wait>0){s.wait-=dt;if(s.wait<=0){s.picks.forEach(i=>s.cards[i].open=false);s.picks=[];}}
  if(s.id==='catch'){
   s.x=clamp(s.x+s.axis*340*dt,50,W-50);s.spawn-=dt;
   if(s.spawn<=0){s.items.push({x:25+s.rng()*(W-50),y:-25,speed:125+s.rng()*45,rock:s.rng()<.2,face:Math.floor(s.rng()*4)});s.spawn=.65;}
   s.items.forEach(item=>{item.y+=item.speed*dt;if(item.y>=314&&item.y<=352&&Math.abs(item.x-s.x)<54&&!item.done){item.done=true;if(item.rock)hit(s,'Cuidado com as pedras!');else{s.count++;s.event='Produto coletado!';if(s.count>=15)win(s);}}});s.items=s.items.filter(i=>i.y<400&&!i.done);
  }
  if(s.id==='balance'){
   s.phaseTime+=dt;s.velocity+=(Math.sin(s.elapsed*1.6+s.phase)*(.17+s.phase*.05)+s.angle*.58+s.axis*.95)*dt;s.velocity*=Math.exp(-1.65*dt);s.angle+=s.velocity*dt;
   if(Math.abs(s.angle)>.6){hit(s,'A pilha inclinou demais. Reequilibre e tente esta etapa novamente.');s.angle=.02;s.velocity=0;s.phaseTime=0;}
   if(s.phaseTime>=8&&s.status==='running'){s.phase++;s.phaseTime=0;s.angle=.03;s.velocity=0;s.event='Etapa concluída! Mais uma aventura.';if(s.phase===3)win(s);}
  }
 }
 function progress(s){if(!s)return 0;if(s.status==='won')return 1;return clamp(({runner:s.elapsed/32,stack:s.count/10,memory:s.pairs/8,camp:s.placed?.length/5,catch:s.count/15,maze:s.collected?.length/3,balance:(s.phase+s.phaseTime/8)/3})[s.id]||0,0,1);}
 globalThis.ManadaGameCore={create,input,update,progress,maze,W,H};
})();
