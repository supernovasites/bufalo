(() => {
  const $=id=>document.getElementById(id);
  let state, busy=true, audio, animation;
  const controls=['draw','clear-names','confirm','names'];
  const feedback=(text,error=false)=>{ $('feedback').textContent=text; $('feedback').classList.toggle('error',error); };
  let inkKey=null,inkRevealed=false,lastInkPoint=null;
  function revealName() {
    inkRevealed=true;lastInkPoint=null;
    $('candidate-ink').hidden=true;$('reveal-name').hidden=true;
  }
  function coverName(key) {
    if(key===inkKey)return;
    inkKey=key;inkRevealed=false;lastInkPoint=null;
    const canvas=$('candidate-ink');
    canvas.hidden=true;$('reveal-name').hidden=true;
    if(!key)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const rect=$('candidate-reveal').getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.ceil(rect.width*dpr);canvas.height=Math.ceil(rect.height*dpr);
    ctx.scale(dpr,dpr);
    ctx.fillStyle='#926b20';ctx.fillRect(0,0,rect.width,rect.height);
    ctx.fillStyle='#b68b37';
    for(let i=0;i<100;i++){ctx.beginPath();ctx.arc(Math.random()*rect.width,Math.random()*rect.height,1+Math.random()*3,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff8e7';ctx.font='600 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Passe o mouse ou o dedo para revelar',rect.width/2,rect.height/2,rect.width-24);
    canvas.hidden=false;$('reveal-name').hidden=false;
  }
  function eraseInk(event) {
    const canvas=$('candidate-ink');
    if(canvas.hidden||!inkKey||inkRevealed)return;
    if(event.pointerType!=='mouse'&&event.type!=='pointerdown'&&!event.buttons)return;
    const rect=canvas.getBoundingClientRect(),ctx=canvas.getContext('2d');
    const x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-out';
    ctx.lineWidth=48*canvas.width/rect.width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(lastInkPoint?.x??x,lastInkPoint?.y??y);ctx.lineTo(x,y);ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();ctx.restore();
    lastInkPoint={x,y};
  }
  $('candidate-ink').addEventListener('pointerdown',event=>{lastInkPoint=null;$('candidate-ink').setPointerCapture(event.pointerId);eraseInk(event);});
  $('candidate-ink').addEventListener('pointermove',eraseInk);
  for(const type of ['pointerleave','pointerup','pointercancel'])$('candidate-ink').addEventListener(type,()=>{lastInkPoint=null;});
  $('reveal-name').addEventListener('click',revealName);
  window.addEventListener('resize',()=>{if(inkKey&&!inkRevealed){const key=inkKey;inkKey=null;coverName(key);}});
  function render() {
    controls.forEach(id=>$(id).disabled=busy||!state);
    if(!state)return;
    const complete=state.winners.length===3;
    const edited=$('names').value!==state.participants.join('\n');
    $('draw').disabled=busy||complete||!$('names').value.trim();
    $('draw').textContent=state.candidate&&!edited?'Sortear novamente':'Sortear';
    $('confirm').disabled=busy||complete||!state.candidate||edited;
    $('clear-names').disabled=busy||(!$('names').value&&!state.participants.length&&!state.candidate);
    const nextSlot=[1,2,3].find(slot=>!state.winners.some(winner=>winner.slot===slot));
    $('round-label').textContent=complete?'02 · SORTEIOS CONCLUÍDOS':`02 · ${nextSlot}º SORTEIO · ${['15h15','16h','16h40'][nextSlot-1]}`;
    $('candidate').textContent=complete?'Três ganhadores. Uma Manada em festa.':state.candidate&&!edited?state.candidate:'O próximo nome pode ser o seu.';
    $('candidate-note').textContent=state.candidate&&!edited?'Confira o nome e confirme para publicar na live.':'Sorteie um participante e confira o nome antes de confirmar.';
    coverName(!complete&&state.candidate&&!edited?state.revision+':'+state.candidate:null);
    document.querySelectorAll('[data-slot]').forEach(card=>{
      const winner=state.winners.find(item=>item.slot===Number(card.dataset.slot));
      card.querySelector('h3').textContent=winner?.name||'Aguardando sorteio';
      card.querySelector('[data-clear-slot]').disabled=busy||!winner;
    });
  }
  async function request(body) {
    const response=await fetch('/live/api/raffle/admin',{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    if(response.status===401){location.assign('/painel/');throw new Error('Entre no painel para continuar.');}
    const data=await response.json();
    if(!response.ok)throw Object.assign(new Error(data.error||'Não foi possível concluir. Tente novamente.'),{status:response.status});
    return data;
  }
  async function load(preserveNames=false) {
    state=await request();
    if(!preserveNames)$('names').value=state.participants.join('\n');
  }
  const tracks={
    reveal:{},
    countdown:{url:'/live/mesadj/sons/contagem-bateria.mp3'},
    celebration:{url:'/live/mesadj/sons/celebracao.mp3'}
  };
  for(const track of Object.values(tracks).filter(track=>track.url)) {
    track.bytes=fetch(track.url).then(response=>{
      if(!response.ok)throw new Error('Áudio indisponível');
      return response.arrayBuffer();
    }).catch(()=>null);
  }
  function prepareSound() {
    if(!$('sound').checked)return;
    try {
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      audio.resume().catch(()=>{});
      if(!tracks.reveal.buffer) {
        const duration=1.05;
        const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);
        const samples=buffer.getChannelData(0);
        // Vitória curta: the ascending notes selected in preview option 3.
        for(let i=0;i<samples.length;i++) {
          const time=i/audio.sampleRate;
          const fade=Math.min(time/.008,1,Math.max((duration-time)/.04,0));
          samples[i]=fade*.22*[523.25,659.25,783.99,1046.5].reduce((sum,hz,index)=>{
            const elapsed=time-index*.105;
            return sum+(elapsed>=0?Math.sin(2*Math.PI*hz*elapsed)*Math.min(elapsed/.008,1)*Math.exp(-elapsed*7):0);
          },0);
        }
        tracks.reveal.buffer=Promise.resolve(buffer);
      }
      for(const track of Object.values(tracks).filter(track=>track.url))track.buffer ||= track.bytes.then(bytes=>bytes?audio.decodeAudioData(bytes):null).catch(()=>null);
    } catch { /* A visual sequence remains available without audio. */ }
  }
  function stopSound(key) {
    const track=tracks[key];
    track.token=(track.token||0)+1;
    if(track.source){try{track.source.stop();}catch{}track.source=null;}
  }
  async function playSound(key) {
    stopSound(key);
    if(!audio||!$('sound').checked)return;
    const track=tracks[key],token=track.token;
    try {
      const buffer=await track.buffer;
      if(!buffer||token!==track.token||!$('sound').checked)return;
      const source=audio.createBufferSource();
      source.buffer=buffer;source.connect(audio.destination);
      track.source=source;source.start();return source;
    } catch { /* Audio failure must not interrupt a draw or confirmation. */ }
  }
  function celebrate(name) {
    $('celebration-name').textContent=name;
    $('celebration').showModal();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const canvas=$('fireworks'),ctx=canvas.getContext('2d');
    if(!ctx)return;
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);
    const particles=[];let start,last=0,burst=-1;
    function frame(time) {
      if(!$('celebration').open)return;
      start??=time;
      const elapsed=time-start,delta=Math.min((time-last)/16.67||1,2);last=time;
      ctx.clearRect(0,0,width,height);
      const next=Math.floor(elapsed/500);
      if(next!==burst&&elapsed<4500){
        burst=next;const x=width*(.12+Math.random()*.76),y=height*(.12+Math.random()*.45);
        for(let i=0;i<65;i++){
          const angle=Math.PI*2*i/65,speed=1.5+Math.random()*3.3;
          particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,color:['#b78520','#deb858','#987020','#f2cf79'][i%4]});
        }
      }
      for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=.035*delta;p.life-=.012*delta;if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;
      if(elapsed<6500)animation=requestAnimationFrame(frame);else ctx.clearRect(0,0,width,height);
    }
    cancelAnimationFrame(animation);animation=requestAnimationFrame(frame);
  }
  async function countdown() {
    coverName(null);
    const stage=document.querySelector('.stage');
    stage.classList.add('is-counting');
    stage.setAttribute('aria-busy','true');
    try {
      $('candidate-note').textContent='Prepare o coração. A sorte está chegando!';
      $('candidate').textContent=3;
      await playSound('countdown');
      $('candidate').style.animationDuration='1s';
      for(const number of [3,2,1]) {
        $('candidate').textContent=number;
        $('candidate').classList.remove('countdown-beat');
        void $('candidate').offsetWidth;
        $('candidate').classList.add('countdown-beat');
        feedback('Contagem regressiva: '+number);
        await new Promise(resolve=>setTimeout(resolve,1000));
      }
    } finally {
      stopSound('countdown');
      $('candidate').classList.remove('countdown-beat');
      $('candidate').style.animationDuration='';
      stage.classList.remove('is-counting');
      stage.removeAttribute('aria-busy');
    }
  }
  async function act(action,extra={}) {
    if(busy||!state)return;
    if(action==='draw'||action==='confirm'){stopSound('reveal');prepareSound();}
    if(action==='confirm')playSound('celebration');
    busy=true;render();feedback(action==='draw'?'Contagem regressiva…':'Salvando…');
    try {
      const body={action,revision:state.revision,...extra,...(action==='draw'?{names:$('names').value}:{})};
      if(action==='draw') {
        // Resolve the request during the countdown, keeping errors handled until it ends.
        const pending=request(body).then(state=>({state}),error=>({error}));
        await countdown();
        const result=await pending;
        if(result.error)throw result.error;
        state=result.state;
      } else state=await request(body);
      $('names').value=state.participants.join('\n');
      feedback({'draw':'Nome sorteado. Confirme para publicar ou sorteie novamente.','confirm':'Ganhador confirmado! O nome já está disponível na live.','clear-participants':'Lista de participantes limpa.','clear-winner':`${extra.slot}º sorteado removido desta página e da live. Os outros resultados foram mantidos.`}[action]);
      if(action==='draw'){render();playSound('reveal');}
      if(action==='confirm')celebrate(state.winners.at(-1).name);
    } catch(error) {
      if(action==='confirm')stopSound('celebration');
      if(error.status===409)try{await load(true);}catch{/* Preserve original error. */}
      feedback(error.message,true);
    } finally {busy=false;render();}
  }
  $('sound').addEventListener('change',()=>{if(!$('sound').checked){stopSound('countdown');stopSound('reveal');stopSound('celebration');}});
  $('names').addEventListener('input',render);
  $('draw').addEventListener('click',()=>act('draw'));
  $('confirm').addEventListener('click',()=>act('confirm'));
  $('clear-names').addEventListener('click',()=>act('clear-participants'));
  document.querySelectorAll('[data-clear-slot]').forEach(button=>button.addEventListener('click',()=>{
    const slot=Number(button.dataset.clearSlot);
    if(window.confirm(`Limpar somente o ${slot}º sorteado? O nome também será removido desse espaço na live.`))act('clear-winner',{slot});
  }));
  $('close-celebration').addEventListener('click',()=>$('celebration').close());
  $('celebration').addEventListener('close',()=>{cancelAnimationFrame(animation);stopSound('celebration');});
  load().then(()=>feedback('Tudo pronto. Adicione os nomes e faça o primeiro sorteio.')).catch(error=>feedback(error.message,true)).finally(()=>{busy=false;render();});
})();
