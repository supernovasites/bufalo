import {readFileSync} from 'node:fs';

const {collections} = JSON.parse(readFileSync(new URL('../live/featured-collections.json', import.meta.url), 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const money = value => value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

export function featuredLiveCollections() {
  return collections.map(collection => {
    const track = collection.id + '-track';
    const cards = collection.cards.map(option => {
      const url = new URL(collection.url);
      url.search = new URLSearchParams({sku: option.sku, utm_source: 'pagina_live', utm_medium: 'referral', utm_campaign: 'LiveshopBG', utm_content: option.key});
      const href = esc(url.href);
      const final = Math.round(option.price * 80) / 100;
      const percent = Math.round((1 - final / option.oldPrice) * 1000) / 10;
      return `<article class="product banni-card" data-featured-collection="${collection.id}" data-discount="20" data-base-price="${option.price}" data-original-price="${option.oldPrice}" data-product-name="${esc(collection.name)}" data-variant-key="${option.key}" data-stock="in_stock"><a class="product-photo-link" href="${href}" target="_blank" rel="noopener noreferrer" draggable="false"><div class="product-image"><span class="badge catalog-saving-badge">Economize ${money(option.oldPrice - final)}</span><span class="catalog-total-discount">−${percent.toLocaleString('pt-BR')}%</span><img src="${esc(option.image)}" alt="${esc(collection.name + ' — ' + option.label)}" width="400" height="400" loading="lazy" decoding="async" draggable="false"></div></a><div class="product-info"><h3>${esc(collection.name)}</h3><p class="banni-color">${esc(option.label)}</p><p class="old"><span class="sr">Preço original: </span><s>${money(option.oldPrice)}</s></p><p class="price">${money(final)}</p><p class="with-coupon">com o cupom <strong>__LIVE_COUPON__</strong></p><a class="product-cta" href="${href}" target="_blank" rel="noopener noreferrer">Compre com desconto</a></div></article>`;
    }).join('\n');
    return `<section class="product-row black-color-row featured-collection featured-${collection.theme}" id="${collection.id}" style="--collection-scene:url('${collection.background}')" aria-labelledby="${collection.id}-title"><div class="product-row-heading"><div><p class="black-row-number">${collection.eyebrow}</p><h3 class="category-title" id="${collection.id}-title">${collection.title}<span class="black-row-count">${collection.cards.length} cores</span></h3><p class="collection-description">${collection.description}</p></div><div class="row-navigation"><button class="row-arrow" type="button" data-direction="-1" aria-controls="${track}" aria-label="Ver cores anteriores de ${collection.title}">‹</button><button class="row-arrow" type="button" data-direction="1" aria-controls="${track}" aria-label="Ver próximas cores de ${collection.title}">›</button></div></div><div class="product-track" id="${track}" tabindex="0" role="group" aria-label="Cores de ${collection.title}">${cards}</div></section>`;
  }).join('\n');
}
