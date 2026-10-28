(() => {
  const master=document.getElementById('master-volume');
  const feedback=document.getElementById('feedback');
  const time=value=>Number.isFinite(value)?`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`:'—:—';
  const message=(text,error=false)=>{feedback.textContent=text;feedback.classList.toggle('error',error);};
  const tracks=[...document.querySelectorAll('[data-track]')].map((card,index)=>{
    const audio=card.querySelector('audio'),play=card.querySelector('.play'),restart=card.querySelector('.restart'),stop=card.querySelector('.stop'),seek=card.querySelector('.seek'),volume=card.querySelector('.volume'),loop=card.querySelector('.loop'),status=card.querySelector('.track-status'),name=card.querySelector('h2').textContent;
    let starting=false,playbackVersion=0;
    const updateVolume=()=>{audio.volume=Number(master.value)/100*Number(volume.value)/100;card.querySelector('.track-level').textContent=volume.value+'%';};
    const updateTime=()=>{card.querySelector('.elapsed').textContent=time(audio.currentTime);card.querySelector('.duration').textContent=time(audio.duration);seek.value=Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration*100:0;};
    const render=()=>{
      const failed=Boolean(audio.error),ready=audio.readyState>=1&&!failed;
      [play,restart,stop,seek].forEach(control=>control.disabled=!ready);
      const playing=!audio.paused&&!audio.ended;
      card.classList.toggle('is-playing',playing);card.classList.toggle('has-error',failed);
      play.replaceChildren(document.createTextNode(playing?'Pausar ':'Tocar '));
      const key=document.createElement('kbd');key.textContent=index<9?String(index+1):'Shift+'+String(index-8);play.append(key);
      play.setAttribute('aria-label',(playing?'Pausar ':'Tocar ')+name);
      status.textContent=failed?'Áudio indisponível':!ready?'Carregando áudio…':playing?'Tocando agora':audio.currentTime>0&&!audio.ended?'Em pausa':'Pronto para tocar';
      updateTime();
    };
    const start=async(fromBeginning=false)=>{
      if(starting||audio.readyState<1||audio.error)return;
      starting=true;
      const version=++playbackVersion;
      try{if(fromBeginning)audio.currentTime=0;await audio.play();if(version===playbackVersion)message(name+' tocando.');}
      catch{if(version===playbackVersion)message('Não foi possível tocar '+name+'. Tente novamente pelo botão Tocar.',true);}
      finally{starting=false;render();}
    };
    const halt=()=>{playbackVersion++;audio.pause();if(audio.readyState>=1)audio.currentTime=0;render();};
    const toggle=()=>{if(!audio.paused){audio.pause();message(name+' pausado.');}else return start();};
    play.addEventListener('click',toggle);restart.addEventListener('click',()=>start(true));stop.addEventListener('click',()=>{halt();message(name+' parado.');});
    volume.addEventListener('input',updateVolume);loop.addEventListener('change',()=>{audio.loop=loop.checked;});
    seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(seek.value)/100*audio.duration;updateTime();});
    ['loadedmetadata','durationchange','play','pause','ended','emptied','canplay'].forEach(event=>audio.addEventListener(event,render));
    audio.addEventListener('timeupdate',updateTime);
    audio.addEventListener('error',()=>{render();message('Não foi possível carregar '+name+'. Atualize a página para tentar novamente.',true);});
    audio.loop=loop.checked;updateVolume();render();
    return {halt,toggle,updateVolume};
  });
  master.addEventListener('input',()=>{document.getElementById('master-level').textContent=master.value+'%';tracks.forEach(track=>track.updateVolume());});
  const stopAll=()=>{tracks.forEach(track=>track.halt());message('Todos os sons foram parados.');};
  document.getElementById('stop-all').addEventListener('click',stopAll);
  document.addEventListener('keydown',event=>{
    if(event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Escape'){event.preventDefault();stopAll();return;}
    if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    const digit=/^Digit[1-9]$/.test(event.code)?Number(event.code.slice(-1)):/^[1-9]$/.test(event.key)?Number(event.key):0;
    const index=event.shiftKey?(digit>=1&&digit<=5?digit+8:-1):digit-1;
    const track=tracks[index];if(track){event.preventDefault();track.toggle();}
  });
  window.addEventListener('pagehide',()=>tracks.forEach(track=>track.halt()));
})();
