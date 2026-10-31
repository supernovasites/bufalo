const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('produtos/chopeira/kit-price.js', 'utf8');
let now, scheduled, delay;
const price = {}, promotion = {}, listeners = {}, windowListeners = {};
vm.runInNewContext(script, {
  document: {
    querySelector: selector => selector.includes('promotion') ? promotion : price,
    hidden: false, addEventListener: (event, fn) => listeners[event] = fn
  },
  window: {addEventListener: (event, fn) => windowListeners[event] = fn},
  Date: class extends Date { constructor() { super(now || '2026-10-30T15:00:00Z'); } },
  Intl, setTimeout: (fn, ms) => { scheduled = fn; delay = ms; return 1; }, clearTimeout() {}
});
function check(instant, expected, hidden) {
  now = instant; windowListeners.pageshow();
  assert.equal(price.textContent.replace(/\s/g, ' '), expected, instant);
  assert.equal(promotion.hidden, hidden, instant);
}
check('2026-10-31T02:59:59Z', 'R$ 1.930,00', true); // Friday 23:59:59 in Brasilia
assert.equal(delay, 1100);
now = '2026-10-31T03:00:00Z'; scheduled();
assert.equal(promotion.hidden, false);
assert.equal(price.textContent.replace(/\s/g, ' '), 'R$ 1.675,00');
check('2026-11-01T15:00:00Z', 'R$ 1.675,00', false);
check('2026-11-02T02:59:59Z', 'R$ 1.675,00', false); // Still Sunday in Brasilia
now = '2026-11-02T03:00:00Z'; scheduled();
assert.equal(promotion.hidden, true);
assert.equal(price.textContent.replace(/\s/g, ' '), 'R$ 1.930,00');
for (let day = 2; day <= 6; day++) check('2026-11-0' + day + 'T15:00:00Z', 'R$ 1.930,00', true);
now = '2026-11-07T15:00:00Z'; listeners.visibilitychange();
assert.equal(promotion.hidden, false);
assert.equal(price.textContent.replace(/\s/g, ' '), 'R$ 1.675,00');
assert.equal(fs.readFileSync('dist/produtos/chopeira/kit-price.js', 'utf8'), script);
console.log('Weekend pricing passed: weekdays, weekends, Brasilia midnight, open page, return to tab and published copy.');
