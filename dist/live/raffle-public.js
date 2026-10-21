(() => {
  const root=document.querySelector('#live-winners');
  if(!root)return;
  let timer;
  async function refresh() {
    clearTimeout(timer);
    if(document.hidden)return;
    try {
      const response=await fetch('/live/api/raffle',{cache:'no-store'});
      if(!response.ok)throw new Error('unavailable');
      const data=await response.json();
      root.querySelectorAll('[data-winner-slot]').forEach(card=>{
        const winner=data.winners.find(item=>item.slot===Number(card.dataset.winnerSlot));
        const name=card.querySelector('.winner-name');
        const text=winner?.name||'Quem será o próximo nome da Manada?';
        if(name.textContent!==text)name.textContent=text;
        card.classList.toggle('is-confirmed',Boolean(winner));
        const status=card.querySelector('.winner-status');
        const statusText=winner?'Parabéns! Essa conquista é sua.':'Aguardando o sorteio ao vivo';
        if(status.textContent!==statusText)status.textContent=statusText;
      });
      root.querySelector('.winners-connection').textContent='Resultados atualizados durante a live.';
    } catch {
      root.querySelector('.winners-connection').textContent='Reconectando aos resultados dos sorteios…';
    } finally { if(!document.hidden)timer=setTimeout(refresh,3000); }
  }
  document.addEventListener('visibilitychange',refresh);
  refresh();
})();
