(()=>{const root=document.querySelector('#manada-stories-stage');if(!root)return;
/* Upload the media files to /produtos/chopeira/media/stories/ to activate them. */
const items=[
{type:'video',src:'media/stories/manada-01.mp4'},
{type:'video',src:'media/stories/manada-02.mp4'},
{type:'video',src:'media/stories/manada-03.mp4'},
{type:'video',src:'media/stories/manada-04.mp4'},
{type:'video',src:'media/stories/manada-05.mp4'},
{type:'video',src:'media/stories/manada-06.mp4'},
{type:'video',src:'media/stories/manada-07.mp4'},
{type:'video',src:'media/stories/manada-08.mp4'},
{type:'image',src:'media/stories/manada-foto-01.jpg'},
{type:'image',src:'media/stories/manada-foto-02.jpg'}];
let available=[],index=0,paused=false,timer=null,start=0,remaining=3000;
const prev=root.querySelector('.manada-story-prev'),next=root.querySelector('.manada-story-next'),center=root.querySelector('.manada-story-current'),media=center.querySelector('.manada-story-media'),pause=center.querySelector('.manada-story-pause');
const wrap=n=>(n+available.length)%available.length;
function thumb(el,item){el.replaceChildren();if(!item)return;const node=document.createElement(item.type==='image'?'img':'video');node.src=item.src;node.muted=true;node.playsInline=true;if(item.type==='image')node.alt='Momento da Manada Búfalo';else node.preload='metadata';el.append(node)}
function stop(){clearTimeout(timer);const v=media.querySelector('video');if(v)v.pause()}
function advance(n=1){if(!available.length)return;index=wrap(index+n);render()}
function progress(){center.style.setProperty('--story-progress','0%');const duration=available[index].type==='image'?3000:0;if(duration&&!paused){start=Date.now();timer=setTimeout(()=>advance(),duration);center.style.setProperty('--story-progress','100%')}}
function render(){stop();if(!available.length){root.hidden=true;return}thumb(prev,available[wrap(index-1)]);thumb(next,available[wrap(index+1)]);media.replaceChildren();const item=available[index];const el=document.createElement(item.type==='image'?'img':'video');el.src=item.src;if(item.type==='image'){el.alt='Story da comunidade Búfalo';}else{el.playsInline=true;el.muted=true;el.autoplay=true;el.preload='auto';el.addEventListener('ended',()=>advance());el.addEventListener('error',()=>advance());}media.append(el);pause.textContent=paused?'▶':'Ⅱ';if(!paused){if(item.type==='video')el.play().catch(()=>{});else progress()}}
prev.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));pause.addEventListener('click',()=>{paused=!paused;if(paused){clearTimeout(timer);remaining=Math.max(0,3000-(Date.now()-start));media.querySelector('video')?.pause()}else{const v=media.querySelector('video');if(v)v.play().catch(()=>{});else{start=Date.now();timer=setTimeout(()=>advance(),remaining)}}pause.textContent=paused?'▶':'Ⅱ'});
let sx=0;root.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX},{passive:true});root.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>45)advance(d<0?1:-1)},{passive:true});root.addEventListener('keydown',e=>{if(e.key==='ArrowRight')advance();if(e.key==='ArrowLeft')advance(-1)});
document.addEventListener('visibilitychange',()=>{const v=media.querySelector('video');if(document.hidden){v?.pause();clearTimeout(timer)}else if(!paused){if(v)v.play().catch(()=>{});else{start=Date.now();timer=setTimeout(()=>advance(),3000)}}});
Promise.all(items.map(async item=>{try{const r=await fetch(item.src,{method:'HEAD'});return r.ok?item:null}catch{return null}})).then(found=>{available=found.filter(Boolean);if(available.length){index=0;render()}else {root.closest('.manada-stories').classList.add('manada-stories-awaiting');root.querySelector('.manada-story-current .manada-story-media').textContent='Em breve, os stories da Manada por aqui.';root.querySelector('.manada-story-prev').hidden=true;root.querySelector('.manada-story-next').hidden=true;root.querySelector('.manada-story-pause').hidden=true;}});
})();