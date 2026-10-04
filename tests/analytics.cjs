const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('assets/analytics.js', 'utf8');
function setup(url = 'https://bufalogrowler.com.br/', cards = [], dialogs = {}) {
  const listeners = {}, scripts = [], intersections = [], mutations = [];
  const document = {
    referrer: 'https://instagram.com/?email=person@example.com',
    documentElement: {dataset: {}}, readyState: 'complete', body: {},
    head: {appendChild: node => scripts.push(node)}, createElement: () => ({}),
    addEventListener: (name, fn) => listeners[name] = fn,
    querySelectorAll: () => cards, getElementById: id => dialogs[id]
  };
  class Element {}
  const window = {};
  const env = {window, document, location: new URL(url), URL, Element,
    IntersectionObserver: class {constructor(fn) {intersections.push(fn);} observe() {}},
    MutationObserver: class {constructor(fn) {mutations.push(fn);} observe() {}},
    requestAnimationFrame: fn => fn()};
  vm.runInNewContext(script, env);
  return {window, document, env, listeners, scripts, intersections, mutations,
    events: () => (window.dataLayer || []).map(args => [...args]).filter(args => args[0] === 'event')};
}
let checks = 0;
for (const url of ['http://localhost/', 'https://preview.bufalo.pages.dev/', 'https://evil.example/', 'https://bufalogrowler.com.br/painel/', 'https://bufalogrowler.com.br/live/admin.html', 'https://bufalogrowler.com.br/manadaone/admin/', 'https://bufalogrowler.com.br/assets/manadacash-widget.html']) {
  assert.equal(setup(url).scripts.length, 0); checks++;
}
for (const host of ['bufalogrowler.com.br', 'www.bufalogrowler.com.br', 'bufalo.pages.dev']) {
  const s = setup('https://' + host + '/live/?utm_source=instagram&utm_campaign=cirio&email=person@example.com&cpf=12345678900');
  assert.equal(s.scripts.length, 1);
  const config = [...s.window.dataLayer.find(args => args[0] === 'config')][2];
  assert.equal(config.content_group, 'live');
  assert.match(config.page_location, /utm_source=instagram/);
  assert.doesNotMatch(config.page_location, /email|cpf|12345678900/);
  assert.equal(config.page_referrer, 'https://instagram.com/');
  vm.runInNewContext(script, s.env); assert.equal(s.scripts.length, 1); checks++;
}
for (const [path, group] of [['/', 'home'], ['/catalogo/', 'catalogo'], ['/manadaone/', 'manadaone'], ['/manadacash/', 'manadacash'], ['/campanhas/cirio/', 'cirio'], ['/reserva/acaibowl/', 'reserva_acai'], ['/blog/artigo.html?post=aventura', 'blog']]) {
  const s = setup('https://bufalogrowler.com.br' + path);
  assert.equal([...s.window.dataLayer.find(args => args[0] === 'config')][2].content_group, group); checks++;
}
const s = setup();
s.window.bufaloAnalytics.track('generate_lead', {form_id: 'reservation-form', lead_type: 'reserva_acai', email: 'private@example.com', cpf: '12345678900'});
assert.equal(s.events().length, 1); assert.equal(s.events()[0][2].email, undefined);
s.window.bufaloAnalytics.track('purchase', {value: 100}); assert.equal(s.events().length, 1); checks++;
function cardFixture() {
  const section = {id: 'mais-vendidos', querySelector: () => ({textContent: 'Os mais pedidos'})};
  const link = {href: 'https://loja.bufalogrowler.com.br/copo-ravi-483ml?sku=123&utm_source=live', getAttribute: () => null};
  const card = {dataset: {}, matches: () => false,
    querySelector: selector => selector.startsWith('a[') ? link : selector === 'h3, h2' ? {textContent: 'Copo Ravi 483 ml'} : null,
    closest: selector => selector === '[hidden]' ? null : selector.startsWith('section') ? section : null};
  return {card, link, section};
}
const fixture = cardFixture(); const p = setup('https://bufalogrowler.com.br/', [fixture.card]);
p.intersections[0]([{target: fixture.card, isIntersecting: true, intersectionRatio: .25}]); assert.equal(p.events().length, 0);
p.intersections[0]([{target: fixture.card, isIntersecting: true, intersectionRatio: .5}]);
p.intersections[0]([{target: fixture.card, isIntersecting: true, intersectionRatio: 1}]);
assert.equal(p.events().length, 1); assert.equal(p.events()[0][1], 'view_item_list'); assert.equal(p.events()[0][2].items[0].item_id, 'copo-ravi-483ml'); checks++;
const target = new p.env.Element(); target.closest = selector => selector === 'a[href]' ? fixture.link : null;
fixture.link.closest = selector => selector.startsWith('.card') ? fixture.card : selector.startsWith('dialog') ? null : fixture.section;
p.listeners.click({target}); assert.equal(JSON.stringify(p.events().slice(-2).map(x => x[1])), JSON.stringify(['bufalo_store_click', 'select_item']));
assert.equal(p.events().at(-1)[2].items.length, 1); checks++;
fixture.link.href = 'https://wa.me/5591984973370?text=nome'; fixture.link.closest = () => null;
p.listeners.click({target}); assert.equal(p.events().at(-1)[1], 'bufalo_whatsapp_click'); assert.equal(p.events().at(-1)[2].link_path, '/'); checks++;
const dialog = {id: 'marajo-dry-popup', open: true, classList: {contains: () => false}, closest: () => dialog};
const d = setup('https://bufalogrowler.com.br/', [], {'marajo-dry-popup': dialog});
assert.equal(d.events()[0][1], 'view_promotion');
d.mutations[0]([{type: 'attributes', attributeName: 'open'}]); assert.equal(d.events().length, 1);
dialog.open = false; d.mutations[0]([{type: 'attributes', attributeName: 'open'}]); assert.equal(d.events().at(-1)[1], 'promotion_close'); checks++;
// Public coverage and admin isolation, including deployment copies.
const publicPages = ['index.html','404.html','catalogo/index.html','live/index.html','live/encerrada.html','manadaone/index.html','manadaone/encerrada.html','manadacash/index.html','campanhas/cirio/index.html','blog/index.html','blog/artigo.html','reserva/acaibowl/index.html'];
for (const path of publicPages) {
  const html = fs.readFileSync(path, 'utf8');
  assert.equal((html.match(/src="\/assets\/analytics\.js\?v=20261004"/g) || []).length, 1, path);
  assert.doesNotMatch(html, /id="bufalo-analytics"/); checks++;
}
for (const path of ['live/admin.html','manadaone/admin/index.html','blog/admin/index.html','painel/index.html','assets/manadacash-widget.html']) assert.doesNotMatch(fs.readFileSync(path, 'utf8'), /analytics\.js/);
console.log(`${checks} checks passed: hosts, attribution, privacy, coverage, initialization, impressions, clicks and promotions.`);
