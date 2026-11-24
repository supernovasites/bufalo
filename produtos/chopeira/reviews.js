(() => {
'use strict';
const rail=document.getElementById('chopeira-review-list');if(!rail)return;
const dialog=document.createElement('dialog');dialog.className='review-dialog';dialog.setAttribute('aria-labelledby','review-dialog-name');
const close=document.createElement('button');close.type='button';close.className='review-dialog-close';close.textContent='Fechar';close.setAttribute('aria-label','Fechar avaliação');
const content=document.createElement('div');content.className='review-dialog-content';
dialog.append(close,content);document.body.append(dialog);
let trigger=null,previousOverflow='';
const openReview=card=>{
 content.replaceChildren(...[...card.children].map(child=>child.cloneNode(true)));
 content.querySelector('.review-card-name').id='review-dialog-name';
 trigger=card;previousOverflow=document.body.style.overflow;
 dialog.showModal();document.body.style.overflow='hidden';close.focus();
};
close.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;if(trigger?.isConnected)trigger.focus({preventScroll:true});});
const makeCard=review=>{
 const card=document.createElement('article');card.className='review-card';
 const photo=document.createElement('img');photo.className='review-card-photo';photo.loading='lazy';photo.decoding='async';photo.alt='Foto da chopeira de '+String(review.name??'');photo.src='/api/chopeira-review-photo?id='+encodeURIComponent(review.id);
 const copy=document.createElement('div');copy.className='review-card-copy';
 const score=Math.max(0,Math.min(10,Number(review.score)||0));
 const rating=document.createElement('span');rating.className='review-card-stars';rating.setAttribute('role','img');rating.setAttribute('aria-label',score+' de 10, equivalente a '+(score/2).toLocaleString('pt-BR')+' de 5 estrelas');rating.style.setProperty('--rating',(score*10)+'%');rating.textContent='★★★★★';
 const name=document.createElement('h3');name.className='review-card-name';name.textContent=String(review.name??'');
 const text=document.createElement('p');text.className='review-card-text';text.textContent=String(review.review??'');
 const hint=document.createElement('span');hint.className='review-card-open';hint.textContent='Ler avaliação completa';
 copy.append(text,hint);card.append(name,photo,rating,copy);
 card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-label','Ler avaliação completa de '+String(review.name??'cliente'));
 card.addEventListener('click',()=>openReview(card));
 card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openReview(card);}});
 return card;
};
fetch('/api/chopeira-reviews',{headers:{Accept:'application/json'}}).then(response=>{if(!response.ok)throw new Error('load');return response.json();}).then(data=>{
 const rows=Array.isArray(data.reviews)?data.reviews:[];rail.replaceChildren();
 if(!rows.length){const empty=document.createElement('p');empty.className='reviews-empty';empty.textContent='As avaliações autorizadas serão exibidas aqui.';rail.append(empty);return;}
 rows.forEach(row=>rail.append(makeCard(row)));
}).catch(()=>{rail.replaceChildren();const error=document.createElement('p');error.className='reviews-error';error.textContent='As avaliações não estão disponíveis agora. Tente novamente em instantes.';rail.append(error);});
})();