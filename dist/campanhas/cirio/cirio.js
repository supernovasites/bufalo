const menu=document.getElementById('mobile-menu');
document.getElementById('open-menu')?.addEventListener('click',()=>menu?.showModal());
document.getElementById('close-menu')?.addEventListener('click',()=>menu?.close());
menu?.addEventListener('click',event=>{if(event.target===menu)menu.close();});
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.close()));
document.getElementById('mobile-search')?.addEventListener('click',()=>{menu?.showModal();menu?.querySelector('input[type="search"]')?.focus();});
document.querySelectorAll('.nav-button').forEach(button=>button.addEventListener('click',()=>{
  const panel=document.getElementById(button.dataset.menu);
  const opened=!panel.hidden;
  document.querySelectorAll('.mega').forEach(item=>item.hidden=true);
  document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));
  panel.hidden=opened;
  button.setAttribute('aria-expanded',String(!opened));
}));
document.addEventListener('click',event=>{if(!event.target.closest('.nav-button,.mega')){
  document.querySelectorAll('.mega').forEach(item=>item.hidden=true);
  document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));
}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.mega').forEach(item=>item.hidden=true);document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));}});


const video=document.getElementById('cirio-video'),play=document.getElementById('video-play'),sound=document.getElementById('video-sound');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
function syncVideo(){const paused=video.paused;play.setAttribute('aria-pressed',String(paused));play.setAttribute('aria-label',paused?'Reproduzir vídeo':'Pausar vídeo');play.innerHTML=paused?'Reproduzir <span aria-hidden="true">▶</span>':'Pausar <span aria-hidden="true">Ⅱ</span>';}
play.addEventListener('click',()=>{if(video.paused)video.play().catch(syncVideo);else video.pause();});
sound.addEventListener('click',()=>{video.muted=!video.muted;sound.setAttribute('aria-pressed',String(!video.muted));sound.setAttribute('aria-label',video.muted?'Ativar som do vídeo':'Desativar som do vídeo');sound.innerHTML=video.muted?'Ativar som <span aria-hidden="true">♫</span>':'Sem som <span aria-hidden="true">♫</span>';});
video.addEventListener('pause',syncVideo);video.addEventListener('play',syncVideo);
if(motion.matches){video.autoplay=false;video.pause();}else video.play().catch(syncVideo);
motion.addEventListener('change',()=>{if(motion.matches)video.pause();});
syncVideo();