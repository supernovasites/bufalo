(() => {
  const groups = [
    {
      id: 'copos-live',
      title: 'Copos',
      models: [
        ['copo-banni', 'Banni'],
        ['copo-nilliravi-900ml', 'Niliravi'],
        ['copo-surti-600ml', 'Surti'],
        ['copo-pand-750ml', 'Pand'],
        ['copo-carabinho-350ml', 'Carabinho'],
        ['copo-guara-1l', 'Guará'],
      ],
    },
    {
      id: 'garrafas-live',
      title: 'Garrafas',
      models: [
        ['garrafa-garca-500ml', 'Garça'],
        ['buba-kids-355ml', 'Buba Kids'],
        ['surti-duo-flow-900ml', 'Duo Flow'],
        ['garrafa-murrah-540ml', 'Murrah'],
        ['garrafa-jafarabadi-1l-', 'Jafarabadi'],
      ],
    },
  ];

  const featuredRows = [
    { id: 'chopeiras-growlers', title: 'Chopeiras e Growleres' },
    { id: 'nagpro', title: 'NagPRO Hard Coolers' },
    { id: 'bolsas-termicas', title: 'Pandhar Soft Coolers' },
    { id: 'facas-churrasco', title: 'Cutelaria BG', merge: ['canivetes'] },
    { id: 'bolsas-mochilas', title: 'Mochilas e Bolsas Estanque' },
    { id: 'cadeiras', title: 'Camping', merge: ['rede-hidrapuri'] },
  ];

  const render = () => {
    const selection = document.querySelector('.selection');
    const selectionHead = selection?.querySelector('.selection-head');
    if (!selection || !selectionHead) return;

    const fragment = document.createDocumentFragment();
    for (const feature of featuredRows) {
      const heading = document.getElementById(feature.id);
      const row = heading?.closest('.product-row');
      const track = row?.querySelector('.product-track');
      if (!row || !track) continue;
      heading.textContent = feature.title;
      track.setAttribute('aria-label', feature.title);
      row.classList.add('featured-product-row');
      for (const sourceId of feature.merge || []) {
        const sourceRow = document.getElementById(sourceId)?.closest('.product-row');
        const sourceTrack = sourceRow?.querySelector('.product-track');
        if (!sourceTrack) continue;
        track.append(...sourceTrack.children);
        sourceRow.remove();
      }
      fragment.append(row);
    }

    for (const group of groups) {
      const section = document.createElement('section');
      section.className = 'live-category-group';
      section.id = group.id;
      section.setAttribute('aria-labelledby', `${group.id}-title`);

      const header = document.createElement('div');
      header.className = 'live-category-header';
      header.innerHTML = `<p class="eyebrow">SELEÇÃO DA LIVE</p><h2 id="${group.id}-title">${group.title}</h2><p>Escolha o modelo e explore cada cor.</p>`;
      section.append(header);

      const nav = document.createElement('nav');
      nav.className = 'live-subcategory-nav';
      nav.setAttribute('aria-label', `Modelos de ${group.title}`);
      for (const [id, label] of group.models) {
        const heading = document.getElementById(id);
        const row = heading?.closest('.product-row');
        if (!row) continue;
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = label;
        nav.append(link);
        heading.textContent = label;
        section.append(row);
      }
      section.insertBefore(nav, section.children[1] || null);
      fragment.append(section);
    }
    selectionHead.after(fragment);

    const categoryNav = document.querySelector('.category-nav');
    if (categoryNav) {
      categoryNav.replaceChildren();
      for (const [href, label] of [
        ['#chopeiras-growlers', 'Chopeiras e Growleres'],
        ['#copos-live', 'Copos'],
        ['#garrafas-live', 'Garrafas'],
        ['#rewards-title', 'ManadaCash'],
      ]) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        categoryNav.append(link);
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();
