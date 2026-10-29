const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('produtos/chopeira/index.html', 'utf8');
const products = JSON.parse(fs.readFileSync('produtos/chopeira/products.json', 'utf8')).products;
assert.equal(products.length, 9);
assert.equal(new Set(products.map(p => p.id)).size, 9);
for (const p of products) {
  assert.ok(html.includes(`id="${p.slug}" data-product-id="${p.id}"`));
  assert.ok(fs.existsSync(`produtos/chopeira/images/${p.id}.webp`));
  assert.ok(html.includes(p.url + '?utm_source=bufalo&amp;utm_medium=landing_page&amp;utm_campaign=ontap26&amp;utm_content=' + p.slug));
}
assert.match(html, /data-bg-header/); assert.match(html, /data-bg-footer/);
assert.equal((html.match(/src="\/assets\/analytics.js/g) || []).length, 1);
assert.doesNotMatch(html, /gtag\('config'/);
const script = fs.readFileSync('produtos/chopeira/chopeira.js', 'utf8');
function setup(enabled = true) {
  const events = [], listeners = {}, faq = {}, scroll = {};
  const elements = Object.fromEntries(['match-result', 'match-image', 'match-name', 'match-description', 'match-link'].map(id => [id, {hidden: true}]));
  const buttons = ['a_dois', 'amigos', 'manada'].map(occasion => ({dataset: {occasion}, setAttribute(name, value) {this[name] = value;}}));
  let observe, unobserved = 0;
  const visual = {closest: () => ({dataset: {productId: products[0].id}})};
  const window = {innerHeight: 800, scrollY: 0, addEventListener: (name, fn) => scroll[name] = fn};
  if (enabled) {window.bufaloAnalytics = {}; window.gtag = (...args) => events.push(args);}
  const document = {
    documentElement: {scrollHeight: 1800},
    getElementById: id => id === 'ontap-products' ? {textContent: JSON.stringify(products)} : elements[id],
    querySelectorAll: selector => selector.startsWith('button') ? buttons : selector.startsWith('details') ? [{open: true, dataset: {faq: 'co2'}, addEventListener: (name, fn) => faq[name] = fn}] : [visual],
    addEventListener: (name, fn) => listeners[name] = fn
  };
  class IntersectionObserver {
    constructor(fn) {observe = fn;} observe() {} unobserve() {unobserved++;}
  }
  window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(script, {window, document, IntersectionObserver, requestAnimationFrame: fn => fn()});
  return {events, listeners, faq, scroll, window, visual, observe, elements, buttons, unobserved: () => unobserved};
}
const s = setup();
s.observe([{target: s.visual, isIntersecting: true, intersectionRatio: .4}]);
assert.equal(s.events.length, 0);
s.observe([{target: s.visual, isIntersecting: true, intersectionRatio: .5}]);
assert.deepEqual(s.events.map(e => e[1]), ['view_item_list', 'view_item']);
assert.equal(s.events[0][2].items.length, 9); assert.equal(s.unobserved(), 1);
s.listeners.click({target: {closest: () => ({dataset: {productLink: products[0].id, placement: 'product_section'}})}});
assert.equal(s.events.at(-1)[1], 'select_item');
assert.equal(s.events.at(-1)[2].items[0].item_id, products[0].id);
s.listeners.click({target: {closest: () => ({dataset: {cta: 'explore_models', placement: 'hero'}, hash: '#modelos'})}});
assert.equal(s.events.at(-1)[1], 'ontap_cta_click');
s.faq.toggle(); assert.equal(s.events.at(-1)[2].question_id, 'co2');
s.window.scrollY = 1000; s.scroll.scroll(); s.scroll.scroll();
assert.deepEqual(s.events.filter(e => e[1] === 'ontap_scroll').map(e => e[2].percent_scrolled), [25, 50, 75, 100]);
assert.ok(s.events.every(e => e[2].send_to === 'G-FPEC1ZGMJQ' && e[2].campaign_id === 'ontap26'));
assert.ok(s.events.every(e => !['purchase', 'page_view', 'config'].includes(e[1])));
for (const [index, slug] of ['ontap-2l', 'ontap-35-preta', 'combo-7'].entries()) {
  s.listeners.click({target: {closest: selector => selector === 'a' ? null : s.buttons[index]}});
  assert.equal(s.elements['match-result'].hidden, false);
  assert.equal(s.elements['match-link'].href, '#' + slug);
  assert.equal(s.buttons[index]['aria-pressed'], 'true');
  assert.equal(s.buttons.filter(button => button['aria-pressed'] === 'true').length, 1);
  assert.equal(s.events.at(-1)[1], 'ontap_occasion_select');
}
const disabled = setup(false);
disabled.observe([{target: disabled.visual, isIntersecting: true, intersectionRatio: 1}]);
disabled.faq.toggle(); disabled.window.scrollY = 1000; disabled.scroll.scroll();
assert.equal(disabled.events.length, 0);
console.log('Chopeira checks passed: nine products, campaign URLs, shared shell, GA4 list/views/clicks/FAQ/scroll and preview privacy.');
