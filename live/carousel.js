(() => {
  const host = document.querySelector('.photo-gallery');
  if (!host) return;

  const coupon = 'TOTE50';
  let order = Array.from({length: 9}, (_, index) => index);
  let selectedIndex = null;
  let moves = 0;
  let solved = false;

  host.classList.add('manada-challenge');
  host.innerHTML = `
    <div class="challenge-heading">
      <span class="challenge-kicker">DESAFIO DA MANADA</span>
      <h2>Monte a aventura.<br>Desbloqueie sua recompensa.</h2>
      <p>Toque em duas peças para trocar suas posições. Complete a imagem em até 12 movimentos e revele um cupom exclusivo de 50%.</p>
    </div>
    <div class="puzzle-board" role="group" aria-label="Quebra-cabeça da Búfalo"></div>
    <div class="challenge-controls">
      <span class="move-count" aria-live="polite">0 movimentos</span>
      <button class="challenge-reset" type="button">Embaralhar novamente</button>
    </div>
    <p class="challenge-status" role="status" aria-live="polite">Escolha a primeira peça.</p>
    <div class="challenge-reward" hidden>
      <span class="reward-label">DESAFIO CONCLUÍDO</span>
      <strong>Você desbloqueou 50% OFF.</strong>
      <p>Copie seu código exclusivo e aproveite a recompensa na Wine Tote 14L.</p>
      <div class="reward-coupon">
        <code>${coupon}</code>
        <button type="button" aria-label="Copiar cupom ${coupon}">Copiar cupom</button>
      </div>
      <a class="reward-buy" href="https://loja.bufalogrowler.com.br/bolsa-tote-termica-nagpuri-14l" target="_blank" rel="noopener noreferrer">Comprar agora</a>
      <small>Benefício válido conforme as condições da campanha.</small>
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
      button.style.backgroundImage = 'url("desafio-manada.jpg")';
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

    if (isSolved() && moves <= 12) {
      solved = true;
      board.classList.add('is-solved');
      status.textContent = 'Imagem completa em ' + moves + (moves === 1 ? ' movimento. ' : ' movimentos. ') + 'Sua recompensa foi desbloqueada.';
      reward.hidden = false;
      render();
      reward.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      return;
    }

    if (isSolved()) {
      const attemptMoves = moves;
      shuffle('Você concluiu em ' + attemptMoves + ' movimentos. Para liberar o cupom, tente novamente e termine em até 12 movimentos.');
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
    copyButton.textContent = 'Copiar cupom';
    board.classList.remove('is-solved');
    render();
  }

  host.querySelector('.challenge-reset').addEventListener('click', () => shuffle());
  copyButton.addEventListener('click', async () => {
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
    copyButton.textContent = copied ? 'TOTE50 copiado' : 'Selecione e copie TOTE50';
    status.textContent = copied
      ? 'Cupom TOTE50 copiado. Agora é só usar na sua compra.'
      : 'Não foi possível copiar automaticamente. Selecione o código TOTE50 acima.';
  });

  const preload = new Image();
  preload.src = 'desafio-manada.jpg';
  shuffle();
})();
