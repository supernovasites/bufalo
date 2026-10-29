const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('produtos/chopeira/chopeira.js', 'utf8');
const products = JSON.parse(fs.readFileSync('produtos/chopeira/products.json', 'utf8')).products;
function node(extra = {}) {return {listeners: {}, addEventListener(name, fn) {this.listeners[name] = fn;}, ...extra};}
function setup() {
  const events = [], timers = [], storage = new Map();
  const video = node({paused: true, currentTime: 0, duration: 45.4, async play() {this.paused = false;}});
  const play = node({hidden: true});
  const close = node(), cta = node(), manual = node();
  const thumbnails = ['1', '3'].map(id => node({dataset: {giftPhoto: id}, setAttribute(name, value) {this[name] = value;}}));
  const photo = {};
  const gift = node({open: false, showModal() {this.open = true;}, close() {this.open = false; this.listeners.close();},
    querySelector: selector => selector === '[data-gift-close]' ? close : cta,
    querySelectorAll: () => thumbnails,
    getBoundingClientRect: () => ({left: 20, right: 300, top: 100, bottom: 600})});
  const elements = {'cheruti-video': video, 'cheruti-play': play, 'mestre-gift': gift, 'gift-photo': photo,
    'ontap-products': {textContent: JSON.stringify(products)}};
  const document = {body: {style: {overflow: 'auto'}}, documentElement: {scrollHeight: 2000},
    getElementById: id => elements[id], querySelectorAll: selector => selector === '[data-gift-open]' ? [manual] : [],
    querySelector: () => gift.open ? gift : null, addEventListener() {}};
  const window = {bufaloAnalytics: {}, gtag: (...args) => events.push(args), innerHeight: 800, scrollY: 0, addEventListener() {}};
  vm.runInNewContext(script, {window, document, sessionStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)}, setTimeout: fn => timers.push(fn), requestAnimationFrame: fn => fn()});
  return {events, timers, storage, video, play, gift, close, cta, manual, thumbnails, photo, document};
}
(async () => {
  const s = setup();
  assert.equal(s.video.controls, false); assert.equal(s.play.hidden, false);
  await s.play.listeners.click(); assert.equal(s.video.controls, true);
  assert.equal(s.events.length, 0, 'A click alone is not video playback');
  s.video.listeners.playing(); assert.equal(s.play.hidden, true);
  assert.equal(s.events.at(-1)[1], 'ontap_video_play');
  s.video.currentTime = 35; s.video.listeners.timeupdate(); s.video.listeners.timeupdate(); s.video.listeners.ended();
  assert.deepEqual(s.events.filter(e => e[1] === 'ontap_video_progress').map(e => e[2].video_percent), [25, 50, 75, 100]);
  s.timers[0](); assert.equal(s.gift.open, false, 'Do not interrupt playback with the automatic popup');
  s.video.paused = true; s.timers[0](); assert.equal(s.gift.open, true);
  assert.equal(s.document.body.style.overflow, 'hidden');
  assert.equal(s.events.at(-1)[1], 'view_promotion');
  s.thumbnails[1].listeners.click(); assert.equal(s.photo.src, 'images/bag-gift-3.webp');
  assert.equal(s.thumbnails[1]['aria-pressed'], 'true'); assert.equal(s.thumbnails[0]['aria-pressed'], 'false');
  s.close.listeners.click(); assert.equal(s.gift.open, false); assert.equal(s.document.body.style.overflow, 'auto');
  s.timers[0](); assert.equal(s.gift.open, false, 'Automatic offer shows only once per session');
  s.manual.listeners.click(); assert.equal(s.gift.open, true, 'The gift remains manually accessible');
  const beforeDismiss = s.events.length;
  s.cta.listeners.click(); assert.equal(s.gift.open, false); assert.equal(s.events.length, beforeDismiss, 'Dismiss-only button is not a promotion selection');
  s.video.play = async () => {throw new Error('Playback unavailable');};
  await s.play.listeners.click(); assert.equal(s.play.hidden, false, 'Playback failure keeps the play button accessible');
  console.log('Chopeira media checks passed: explicit playback, progress, failure recovery, gift session, thumbnails and scroll restoration.');
})().catch(error => {console.error(error); process.exitCode = 1;});
