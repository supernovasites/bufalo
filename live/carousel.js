(() => {
  const root = document.querySelector('.photo-gallery');
  if (!root) return;
  const challenges = [
    {id:'tote',label:'Desafio 1',price:950,name:'Wine Tote 14L Soft Cooler',photo:'desafio-tote-vinho.png',url:'https://loja.bufalogrowler.com.br/bolsa-tote-termica-nagpuri-14l',productImage:'wine-tote-product.png'},
    {id:'nag',label:'Desafio 2',price:2950,name:'Nag PRO 6 Cooler 42L com Rodinhas',photo:'desafio-nagpro6-praia.png',url:'https://loja.bufalogrowler.com.br/nagpro6',productImage:'nagpro6-product.png'},
    {id:'outdoor',label:'Desafio 3',photo:'desafio3-aventureiro.png',price:690,name:'Kit Cimo Trio de Força AX',url:'https://loja.bufalogrowler.com.br/kit-cimo-trio-de-forca-ax',productImage:'trio-cimo-product.png'},
    {id:'mestre',label:'Desafio 4',photo:'desafio4-mestre-piscina.png',price:1830,name:'Kit Mestre Búfalo Growler On TAP 7L',url:'https://loja.bufalogrowler.com.br/mestrebufaloontap7l',productImage:'mestre-product.png'}
  ];
  root.classList.add('manada-challenge');
  root.innerHTML = '<div class="challenge-tabs" role="tablist" aria-label="Escolha seu desafio">'+challenges.map((c,i)=>'<button type="button" role="tab" id="tab-'+c.id+'" aria-controls="puzzle-'+c.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'">'+c.label+'</button>').join('')+'</div>'+challenges.map((c,i)=>'<div role="tabpanel" id="puzzle-'+c.id+'" aria-labelledby="tab-'+c.id+'"'+(i?' hidden':'')+'></div>').join('');
  const tabs=[...root.querySelectorAll('[role="tab"]')];

  const tablist = root.querySelector('.challenge-tabs');
  tablist.hidden = false;
  tabs[1].disabled = false;
  tabs[0].textContent = 'Desafio 1';
  tabs[1].textContent = 'Desafio 2';
  tabs[1].classList.add('challenge-next');
  const select=index=>{

    tabs.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;root.querySelector('#puzzle-'+challenges[i].id).hidden=i!==index;});
    const activeBoard = root.querySelector('#puzzle-'+challenges[index].id+' .puzzle-board');
    activeBoard.after(tablist);
  };
  tabs.forEach((button,i)=>{button.addEventListener('click',()=>select(i));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next);tabs[next].focus();});});
  const liveCoupon = document.getElementById('code')?.textContent.trim();
  challenges.forEach(config=>mount(root.querySelector('#puzzle-'+config.id),{...config,coupon:liveCoupon,discount:20}));
  select(0);
  function mount(host,config){
  const coupon = config.coupon;
  const money = value => value.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  let order = Array.from({length: 9}, (_, index) => index);
  let selectedIndex = null;
  let moves = 0;
  let solved = false;

  host.classList.add('challenge-panel');
  host.innerHTML = `
    <div class="challenge-heading">
      <span class="challenge-kicker">DESAFIO DA MANADA</span>
      <h2>Monte a aventura.<br>Desbloqueie sua recompensa.</h2>
      <p>Toque em duas peças para trocar suas posições. Complete a imagem em até 13 movimentos e ${config.rewardPending ? 'complete o desafio.' : 'revele um cupom exclusivo de '+config.discount+'%.'}</p>
    </div>
    <div class="puzzle-board" role="group" aria-label="Quebra-cabeça da Búfalo"></div>
    <div class="challenge-controls">
      <span class="move-count" aria-live="polite">0 movimentos</span>
      <div class="challenge-control-actions"></div>
    </div>
    <p class="challenge-status" role="status" aria-live="polite">Escolha a primeira peça.</p>
    <div class="challenge-reward reward-highlight" hidden>
      <span class="reward-label">DESAFIO CONCLUÍDO</span>
      ${config.rewardPending ? '<strong class="reward-headline"><span class="reward-headline-copy">Você completou o Desafio 3!</span></strong>' : `<strong class="reward-headline"><span class="reward-discount">${config.discount}% OFF</span><span class="reward-headline-copy">Sua recompensa está liberada.</span></strong>
      <article class="product growler-card reward-product" data-discount="${config.discount}" data-product-name="${config.name}">
        <a class="growler-photo-link" href="${config.url}" target="_blank" rel="noopener noreferrer">
          <div class="product-image"><img src="${config.productImage}" alt="${config.name}" width="400" height="400" loading="lazy"></div>
        </a>
        <div class="product-info">
          <h3>${config.name}</h3>
          <p class="old"><span class="sr">Preço sem o cupom: </span><s>${money(config.price)}</s></p>
          <p class="price">${money(config.price * (100 - config.discount) / 100)}</p>
          <p class="reward-saving">Você economiza ${money(config.price * config.discount / 100)}</p>
          <div class="reward-coupon">
            <code>${coupon}</code>
            <button type="button" aria-label="Copiar cupom ${coupon}">Copiar cupom</button>
          </div>
          <a class="product-cta growler-cta reward-buy" href="${config.url}" target="_blank" rel="noopener noreferrer">Comprar agora</a>
        </div>
      </article>
      <small>Só durante a live · 10 cupons disponíveis!</small>`}
    </div>
  `;

  const board = host.querySelector('.puzzle-board');
  const moveCount = host.querySelector('.move-count');
  const status = host.querySelector('.challenge-status');
  const reward = host.querySelector('.challenge-reward');
  const copyButton = reward.querySelector('button');

  function isSolved() {
    return order.every((tile, index) => tile === index);
  }

  function render(focusIndex = null) {
    board.replaceChildren();
    order.forEach((tile, position) => {
      const button = document.createElement('button');
      const column = tile % 3;
      const row = Math.floor(tile / 3);
      button.type = 'button';
      button.className = 'puzzle-piece';
      button.style.backgroundImage = 'url("' + config.photo + '")';
      button.style.backgroundPosition = (column * 50) + '% ' + (row * 50) + '%';
      button.setAttribute('aria-label', 'Peça ' + (tile + 1) + ', posição ' + (position + 1));
      button.setAttribute('aria-pressed', String(position === selectedIndex));
      if (position === selectedIndex) button.classList.add('is-selected');
      button.addEventListener('click', () => choose(position));
      board.append(button);
    });
    if (focusIndex !== null) board.children[focusIndex]?.focus();
  }

  function choose(index) {
    if (solved) return;
    if (selectedIndex === null) {
      selectedIndex = index;
      status.textContent = 'Agora escolha a peça que trocará de posição.';
      render(index);
      return;
    }

    if (selectedIndex === index) {
      selectedIndex = null;
      status.textContent = 'Seleção cancelada. Escolha a primeira peça.';
      render(index);
      return;
    }

    [order[selectedIndex], order[index]] = [order[index], order[selectedIndex]];
    selectedIndex = null;
    moves += 1;
    moveCount.textContent = moves + (moves === 1 ? ' movimento' : ' movimentos');

    if (moves > 13) {
      shuffle('tente denovo');
      return;
    }

    if (isSolved()) {
      solved = true;
      board.classList.add('is-solved');
      status.textContent = 'Imagem completa em ' + moves + (moves === 1 ? ' movimento. ' : ' movimentos. ') + (config.rewardPending ? 'Desafio concluído!' : 'Sua recompensa foi desbloqueada.');
      reward.hidden = false;
      render();
      reward.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      return;
    }


    status.textContent = 'Boa troca. Continue montando a imagem.';
    render(index);
  }

  function shuffle(message = 'Escolha a primeira peça.') {
    do {
      for (let index = order.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [order[index], order[target]] = [order[target], order[index]];
      }
    } while (isSolved());

    selectedIndex = null;
    moves = 0;
    solved = false;
    moveCount.textContent = '0 movimentos';
    status.textContent = message;
    reward.hidden = true;
    if(copyButton) copyButton.textContent = 'Copiar cupom';
    board.classList.remove('is-solved');
    render();
  }


  copyButton?.addEventListener('click', async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(coupon);
      copied = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = coupon;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      copied = document.execCommand('copy');
      field.remove();
    }
    copyButton.textContent = copied ? coupon + ' copiado' : 'Selecione e copie ' + coupon;
    status.textContent = copied
      ? 'Cupom ' + coupon + ' copiado. Agora é só usar na sua compra.'
      : 'Não foi possível copiar automaticamente. Selecione o código ' + coupon + ' acima.';
  });

  const preload = new Image();
  preload.src = config.photo;
  shuffle();

  }
})();
