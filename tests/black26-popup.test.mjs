import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../assets/black26-popup.js', import.meta.url), 'utf8');
const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function run(iso, random = 0, blocked = false, browserSession = {cookie: ''}) {
  let now = iso;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  const events = {}, timers = [], image = {}, body = {style: {overflow: 'auto'}};
  const window = {scrollX: 0, scrollY: 640, scrollTo({left, top}) {this.scrollX = left; this.scrollY = top;}};
  const popup = {
    open: false,
    querySelector: selector => selector === 'img' ? image : {addEventListener: (name, fn) => events.button = fn},
    addEventListener: (name, fn) => events[name] = fn,
    showModal() { this.open = true; window.scrollY = 0; },
    close() { this.open = false; window.scrollY = 0; events.close(); },
    getBoundingClientRect: () => ({left: 10, right: 100, top: 10, bottom: 100})
  };
  const document = {body, getElementById: () => popup, querySelector: () => blocked, addEventListener: (name, fn) => events[name] = fn};
  Object.defineProperty(document, 'cookie', {get: () => browserSession.cookie, set: value => {browserSession.lastWrite = value; browserSession.cookie = value.split(';')[0];}});
  const storage = browserSession.storage ||= new Map();
  vm.runInNewContext(code, {window, document, location: {protocol: 'https:'}, sessionStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)}, Date: Clock, Intl, Math: {floor: Math.floor, random: () => random}, setTimeout: (fn, delay) => timers.push({fn, delay})});
  return {popup, image, body, events, timers, window, advance: iso => {now = iso;}};
}
test('opens every day including weekends', () => {
 for (const iso of ['2026-11-02T15:00:00Z','2026-11-07T15:00:00Z','2026-11-08T15:00:00Z']) {
  const state=run(iso); state.timers.find(t=>t.delay===600).fn();
  assert.ok(state.popup.open); state.events.button(); assert.equal(state.body.style.overflow,'auto');
 }
});
test('only three campaign banners can be chosen on a fresh page opening', () => {
  const paths = [0, 0.34, 0.999].map(r => run('2026-10-20T15:00:00Z', r).image.src);
  assert.equal(new Set(paths).size, 3);
  for (const path of paths) assert.ok(existsSync(new URL('..' + path, import.meta.url)));
  assert.ok(home.includes('href="https://www.bufalogrowler.com.br/campanhas/black26/"'));
  assert.ok(home.includes('A Black Búfalo já começou! Aproveite as ofertas antes que acabem.'));
});
test('does not overlap another dialog and removes the old weekend popup', () => {
 const state=run('2026-11-07T15:00:00Z',0,true); state.timers.find(t=>t.delay===600).fn();
 assert.equal(state.popup.open,false); assert.ok(!home.includes('<dialog id="bufalo-weekend"'));
});
test('each reload shows the other banner and keeps it fixed', () => {
  const session = {cookie: ''}, now = '2026-10-29T15:00:00Z';
  const first = run(now, 0, false, session);
  first.timers.find(t => t.delay === 600).fn();
  const second = run(now, 0, false, session);
  second.timers.find(t => t.delay === 600).fn();
  assert.ok(first.popup.open && second.popup.open);
  assert.notEqual(first.image.src, second.image.src);
  const third = run(now, 0, false, session);
  assert.notEqual(third.image.src, first.image.src);
  const fourth = run(now, 0, false, session);
  assert.equal(new Set([first.image.src, second.image.src, third.image.src, fourth.image.src]).size, 3);
  assert.equal(fourth.image.src, first.image.src);
});

test('preserves mobile scroll position when automatic dialog focuses and closes', () => {
 const state = run('2026-10-22T15:00:00Z');
 state.timers.find(t => t.delay === 600).fn();
 assert.equal(state.window.scrollY, 640);
 state.events.button();
 assert.equal(state.window.scrollY, 640);
});

test('banner remains fixed while the popup is open', () => {
  const state = run('2026-10-29T15:00:00Z');
  const first = state.image.src;
  state.timers.find(t => t.delay === 600).fn();
  assert.equal(state.image.src, first);
  assert.equal(state.timers.some(t => t.delay === 6000), false);
});
