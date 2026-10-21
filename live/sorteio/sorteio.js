(() => {
  const $=id=>document.getElementById(id);
  let state, busy=true, audio, animation;
  const controls=['draw','clear-names','confirm','names'];
  const feedback=(text,error=false)=>{ $('feedback').textContent=text; $('feedback').classList.toggle('error',error); };
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
  function prepareSound() {
    if(!$('sound').checked)return;
    try { audio ||= new (window.AudioContext||window.webkitAudioContext)(); audio.resume().catch(()=>{}); } catch { /* Visual celebration remains available. */ }
  }
  function playSound() {
    if(!audio||!$('sound').checked)return;
    try {
      const now=audio.currentTime;
      // Short original fanfare, generated locally without external audio files.
      [523.25,659.25,783.99,1046.5].forEach((frequency,index)=>{
        const oscillator=audio.createOscillator(), gain=audio.createGain(), start=now+index*.16;
        oscillator.type='triangle';oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.13,start+.02);gain.gain.exponentialRampToValueAtTime(.001,start+.65);
        oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start);oscillator.stop(start+.7);
      });
      [.1,.7,1.3].forEach(delay=>{
        const buffer=audio.createBuffer(1,audio.sampleRate*.6,audio.sampleRate), data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**3;
        const source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();
        source.buffer=buffer;filter.type='lowpass';filter.frequency.value=750;gain.gain.value=.22;
        source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start(now+delay);
      });
    } catch { /* Browser audio restrictions must not interrupt a confirmed result. */ }
  }
  function celebrate(name) {
    $('celebration-name').textContent=name;
    $('celebration').showModal();playSound();
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
  async function act(action,extra={}) {
    if(busy||!state)return;
    busy=true;render();feedback(action==='draw'?'Sorteando…':'Salvando…');
    try {
      state=await request({action,revision:state.revision,...extra,...(action==='draw'?{names:$('names').value}:{})});
      $('names').value=state.participants.join('\n');
      feedback({'draw':'Nome sorteado. Confirme para publicar ou sorteie novamente.','confirm':'Ganhador confirmado! O nome já está disponível na live.','clear-participants':'Lista de participantes limpa.','clear-winner':`${extra.slot}º sorteado removido desta página e da live. Os outros resultados foram mantidos.`}[action]);
      if(action==='confirm')celebrate(state.winners.at(-1).name);
    } catch(error) {
      if(error.status===409)try{await load(true);}catch{/* Preserve original error. */}
      feedback(error.message,true);
    } finally {busy=false;render();}
  }
  $('names').addEventListener('input',render);
  $('draw').addEventListener('click',()=>act('draw'));
  $('confirm').addEventListener('click',()=>{prepareSound();act('confirm');});
  $('clear-names').addEventListener('click',()=>act('clear-participants'));
  document.querySelectorAll('[data-clear-slot]').forEach(button=>button.addEventListener('click',()=>{
    const slot=Number(button.dataset.clearSlot);
    if(window.confirm(`Limpar somente o ${slot}º sorteado? O nome também será removido desse espaço na live.`))act('clear-winner',{slot});
  }));
  $('close-celebration').addEventListener('click',()=>$('celebration').close());
  $('celebration').addEventListener('close',()=>{cancelAnimationFrame(animation);});
  load().then(()=>feedback('Tudo pronto. Adicione os nomes e faça o primeiro sorteio.')).catch(error=>feedback(error.message,true)).finally(()=>{busy=false;render();});
})();
