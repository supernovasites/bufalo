import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../assets/black26-popup.js', import.meta.url), 'utf8');
const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function run(iso, random = 0, blocked = false) {
  let now = iso;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  const events = {}, timers = [], image = {}, body = {style: {overflow: 'auto'}};
  const popup = {
    open: false,
    querySelector: selector => selector === 'img' ? image : {addEventListener: (name, fn) => events.button = fn},
    addEventListener: (name, fn) => events[name] = fn,
    showModal() { this.open = true; },
    close() { this.open = false; events.close(); },
    getBoundingClientRect: () => ({left: 10, right: 100, top: 10, bottom: 100})
  };
  const document = {body, getElementById: () => popup, querySelector: () => blocked, addEventListener: (name, fn) => events[name] = fn};
  vm.runInNewContext(code, {document, Date: Clock, Intl, Math: {floor: Math.floor, random: () => random}, setTimeout: (fn, delay) => timers.push({fn, delay})});
  return {popup, image, body, events, timers, advance: iso => {now = iso;}};
}
test('Black26 opens Monday through Friday in Fortaleza, excluding the weekend and UTC boundary', () => {
  for (const iso of ['2026-10-19T15:00:00Z', '2026-10-20T15:00:00Z', '2026-10-21T15:00:00Z', '2026-10-22T15:00:00Z', '2026-10-23T15:00:00Z', '2026-10-24T02:59:59Z']) {
    const state = run(iso); state.timers.find(t => t.delay === 600).fn();
    assert.ok(state.popup.open, iso); assert.equal(state.body.style.overflow, 'hidden');
    state.events.button(); assert.equal(state.popup.open, false); assert.equal(state.body.style.overflow, 'auto');
  }
  for (const iso of ['2026-10-24T03:00:00Z', '2026-10-25T15:00:00Z', '2026-10-26T02:59:59Z']) {
    const state = run(iso); assert.equal(state.timers.length, 0); assert.equal(state.image.src, undefined);
  }
});
test('each of the four attached products can be chosen on a fresh page opening', () => {
  const paths = [0, 0.25, 0.5, 0.999].map(r => run('2026-10-20T15:00:00Z', r).image.src);
  assert.equal(new Set(paths).size, 4);
  for (const path of paths) assert.ok(existsSync(new URL('..' + path, import.meta.url)));
  assert.ok(home.includes('href="https://www.bufalogrowler.com.br/campanhas/black26/"'));
  assert.ok(home.includes('A Black Búfalo já começou! Aproveite as ofertas antes que acabem.'));
});
test('does not overlap another dialog and closes at Friday midnight', () => {
  const blocked = run('2026-10-20T15:00:00Z', 0, true);
  blocked.timers.find(t => t.delay === 600).fn(); assert.equal(blocked.popup.open, false);
  const state = run('2026-10-24T02:59:00Z');
  state.timers.find(t => t.delay === 600).fn(); assert.ok(state.popup.open);
  state.advance('2026-10-24T03:00:00Z'); state.timers.find(t => t.delay === 60000).fn();
  assert.equal(state.popup.open, false); assert.equal(state.body.style.overflow, 'auto');
});
