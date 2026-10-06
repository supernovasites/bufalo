(()=>{
const topButton=document.querySelector('.back-to-top');
const updateTopButton=()=>{topButton.hidden=window.scrollY<300;};
window.addEventListener('scroll',updateTopButton,{passive:true});updateTopButton();
topButton.addEventListener('click',()=>{window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
})();

(()=>{const bull='<svg class="mc-dock-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 27c2-8 5-16 11-22 4-4 9-5 15-1-3 0-6 1-8 2 4 0 8 1 10 3 1 1 1 3 0 5-1 2-3 3-6 4l-1 4-4 3-4-4-3 1-5 5-2-5-3 5Z"/><path fill="none" d="M19 7c1 2 3 3 6 3 3 0 5-1 6-3M20 18c2 0 4-1 6-2M8 25l5-5m-2 7 4-6"/></svg>';const dock=document.querySelector('.dock-cash'),popup=document.querySelector('#mc-popup');if(!dock||!popup)return;dock.href='#mc';dock.removeAttribute('target');dock.innerHTML=bull+'<span>ManadaCash</span>';const open=()=>{if(!popup.open)popup.showModal();document.body.style.overflow='hidden'};const close=()=>{if(popup.open)popup.close()};document.querySelectorAll('[data-open-mc],.dock-cash').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();open()}));document.querySelector('[data-close-mc]').addEventListener('click',close);popup.addEventListener('close',()=>document.body.style.overflow='');popup.addEventListener('click',e=>{if(e.target===popup)close()});const openFromHash=()=>{if(location.hash==='#mc')open()};window.addEventListener('hashchange',openFromHash);openFromHash()})();


(()=>{const dock=document.querySelector('.dock-cash'),launcher=document.querySelector('.mc-launcher'),popup=document.querySelector('#mc-popup');if(!popup)return;dock?.querySelector('span')?.remove();launcher?.querySelector('span')?.remove();const head=popup.querySelector('.mc-popup-head'),close=popup.querySelector('[data-close-mc]');if(head&&close){popup.prepend(close);head.remove()}})();


(()=>{const mobile=[...document.querySelectorAll('.mobile-dock>a')],desktop=[...document.querySelectorAll('.desktop-floating-menu>a')];desktop.forEach((item,index)=>{const source=mobile[index];if(!source)return;item.innerHTML=source.querySelector('svg').outerHTML+(source.querySelector('span')?.outerHTML||'<span>ManadaCash</span>')});const cash=document.querySelector('.desktop-cash-link'),popup=document.querySelector('#mc-popup');cash?.addEventListener('click',event=>{event.preventDefault();if(popup&&!popup.open){popup.showModal();document.body.style.overflow='hidden'}})})();


(()=>{const dock=document.querySelector('.mobile-dock .dock-cash');if(!dock)return;dock.href='#mc';dock.removeAttribute('target');})();

window.addEventListener('message',e=>{const popup=document.getElementById('mc-popup'),frame=popup.querySelector('iframe');if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='mc-view')return;popup.classList.toggle('mc-products',e.data.expanded===true||e.data.products===true)});

(()=>{const popup=document.getElementById('mc-popup'),frame=popup?.querySelector('iframe');if(!popup||!frame)return;new MutationObserver(()=>{if(popup.open)frame.contentWindow.postMessage({type:'mc-reset'},location.origin)}).observe(popup,{attributes:true,attributeFilter:['open']});})();
(()=>{const cash=document.querySelector('.mobile-dock .dock-cash');if(cash&&!cash.querySelector('span'))cash.insertAdjacentHTML('beforeend','<span>ManadaCash</span>')})();
