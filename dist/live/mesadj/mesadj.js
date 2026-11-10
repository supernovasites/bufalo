(() => {
  const master=document.getElementById('master-volume');
  const feedback=document.getElementById('feedback');
  const time=value=>Number.isFinite(value)?`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`:'—:—';
  const message=(text,error=false)=>{feedback.textContent=text;feedback.classList.toggle('error',error);};
  const cards=[...document.querySelectorAll('[data-track]')];
  const backgroundCount=cards.filter(card=>card.closest('.sound-group').getAttribute('aria-labelledby')==='background-title').length;
  const tracks=cards.map((card,index)=>{
    const audio=card.querySelector('audio'),play=card.querySelector('.play'),restart=card.querySelector('.restart'),stop=card.querySelector('.stop'),seek=card.querySelector('.seek'),volume=card.querySelector('.volume'),loop=card.querySelector('.loop'),status=card.querySelector('.track-status'),name=card.querySelector('h2').textContent;
    let starting=false,playbackVersion=0;
    const startAt=Math.max(0,Number(card.dataset?.startAt)||0);
    const loopEnd=Number(card.dataset?.loopEnd)||0;
    const duration=()=>loop.checked&&loopEnd>0?Math.min(loopEnd,audio.duration):audio.duration;
    const background=card.closest('.sound-group').getAttribute('aria-labelledby')==='background-title';
    const maxVolume=background?3:20;
    volume.max=String(maxVolume);volume.step='0.1';volume.value=String(maxVolume);
    const updateVolume=()=>{const level=Math.max(0,Math.min(maxVolume,Number(volume.value)));audio.volume=Math.max(0,Math.min(100,Number(master.value)))/100*level/100;card.querySelector('.track-level').textContent=level+'%';};
    const updateTime=()=>{const end=duration();card.querySelector('.elapsed').textContent=time(audio.currentTime);card.querySelector('.duration').textContent=time(end);seek.value=Number.isFinite(end)&&end>0?audio.currentTime/end*100:0;};
    const render=()=>{
      const failed=Boolean(audio.error),ready=audio.readyState>=1&&!failed;
      [play,restart,stop,seek].forEach(control=>control.disabled=!ready);
      const playing=!audio.paused&&!audio.ended;
      card.classList.toggle('is-playing',playing);card.classList.toggle('has-error',failed);
      play.replaceChildren(document.createTextNode(playing?'Pausar ':'Tocar '));
      const key=document.createElement('kbd');key.textContent=background?String(index+1):'Shift+'+String(index-backgroundCount+1);play.append(key);
      play.setAttribute('aria-label',(playing?'Pausar ':'Tocar ')+name);
      status.textContent=failed?'Áudio indisponível':!ready?'Carregando áudio…':playing?'Tocando agora':audio.currentTime>0&&!audio.ended?'Em pausa':'Pronto para tocar';
      updateTime();
    };
    const start=async(fromBeginning=false)=>{
      if(starting||audio.readyState<1||audio.error)return;
      if(background)tracks.forEach(track=>{if(track.background&&track.audio!==audio)track.pause();});
      starting=true;
      const version=++playbackVersion;
      try{if(fromBeginning||audio.ended||audio.currentTime<startAt||(loop.checked&&loopEnd>0&&audio.currentTime>=duration()))audio.currentTime=startAt;await audio.play();if(version===playbackVersion)message(name+' tocando.');}
      catch{if(version===playbackVersion)message('Não foi possível tocar '+name+'. Tente novamente pelo botão Tocar.',true);}
      finally{starting=false;render();}
    };
    const halt=()=>{playbackVersion++;audio.pause();if(audio.readyState>=1)audio.currentTime=startAt;render();};
    const pause=()=>{playbackVersion++;audio.pause();render();};
    const toggle=()=>{if(!audio.paused){audio.pause();message(name+' pausado.');}else return start();};
    play.addEventListener('click',toggle);restart.addEventListener('click',()=>start(true));stop.addEventListener('click',()=>{halt();message(name+' parado.');});
    volume.addEventListener('input',updateVolume);loop.addEventListener('change',()=>{audio.loop=loop.checked;if(loop.checked&&loopEnd>0&&audio.currentTime>=duration())audio.currentTime=0;updateTime();});
    seek.addEventListener('input',()=>{const end=duration();if(Number.isFinite(end)&&end>0)audio.currentTime=Number(seek.value)/100*end;updateTime();});
    ['loadedmetadata','durationchange','play','pause','ended','emptied','canplay'].forEach(event=>audio.addEventListener(event,render));
    audio.addEventListener('loadedmetadata',()=>{if(startAt>0&&audio.currentTime<startAt)audio.currentTime=startAt;render();});
    audio.addEventListener('timeupdate',()=>{if(startAt>0&&!audio.paused&&audio.currentTime<startAt)audio.currentTime=startAt;if(loop.checked&&loopEnd>0&&!audio.paused&&audio.currentTime>=duration())audio.currentTime=0;updateTime();});
    audio.addEventListener('error',()=>{render();message('Não foi possível carregar '+name+'. Atualize a página para tentar novamente.',true);});
    audio.loop=loop.checked;updateVolume();render();
    return {halt,pause,toggle,updateVolume,background,audio};
  });
  master.addEventListener('input',()=>{document.getElementById('master-level').textContent=master.value+'%';tracks.forEach(track=>track.updateVolume());});
  const stopAll=()=>{tracks.forEach(track=>track.halt());message('Todos os sons foram parados.');};
  document.getElementById('stop-all').addEventListener('click',stopAll);
  document.addEventListener('keydown',event=>{
    if(event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Escape'){event.preventDefault();stopAll();return;}
    if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    const digit=/^Digit[1-9]$/.test(event.code)?Number(event.code.slice(-1)):/^[1-9]$/.test(event.key)?Number(event.key):0;
    const index=digit>=1?(event.shiftKey?backgroundCount+digit-1:digit<=backgroundCount?digit-1:-1):-1;
    const track=tracks[index];if(track){event.preventDefault();track.toggle();}
  });
  window.addEventListener('pagehide',()=>tracks.forEach(track=>track.halt()));
})();
