import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validCpf} from '../lib/cpf.js';
import {onRequest} from '../functions/live/_middleware.js';

const valid = ['52998224725', '529.982.247-25', '11144477735', '111.444.777-35'];
const invalid = ['52998224724', '52998224715', '12345678900', '123', '', null, 'abc52998224725', ...Array.from({length:10}, (_, digit) => String(digit).repeat(11))];
test('CPF requires both check digits and rejects repeated digits and malformed values', () => {
  for (const value of valid) assert.equal(validCpf(value), true, value);
  for (const value of invalid) assert.equal(validCpf(value), false, String(value));
});

test('browser validates typed, pasted and prefilled CPF values and clears reset errors', () => {
  class Input {
    value = '529.982.247-24'; listeners = {}; error = '';
    addEventListener(type, listener) { this.listeners[type] = listener; }
    setCustomValidity(message) { this.error = message; }
  }
  const input = new Input(), listeners = {};
  const form = {elements:{namedItem:name => name === 'cpf' ? input : null}, addEventListener(type, listener) { listeners[type] = listener; }};
  vm.runInNewContext(readFileSync(new URL('../live/registration-masks.js', import.meta.url), 'utf8'), {document:{querySelector:() => form}, HTMLInputElement:Input});
  assert.match(input.error, /CPF válido/);
  for (const value of valid) { input.value = value; input.listeners.input(); assert.equal(input.error, ''); }
  input.value = '52998224724'; input.listeners.input(); assert.match(input.error, /CPF válido/);
  input.value = '111.111.111-11'; listeners.submit(); assert.match(input.error, /CPF válido/);
  listeners.reset(); assert.equal(input.error, '');
});

test('server rejects invalid CPF for both registration modes before contacting the webhook', async () => {
  for (const tipo_cadastro of ['first','member']) {
    const response = await onRequest({request:new Request('https://example.test/live/api/register', {
      method:'POST', headers:{Origin:'https://example.test','Content-Type':'application/json'},
      body:JSON.stringify({tipo_cadastro, cpf:'529.982.247-24'})
    }), env:{LIVE_DB:{prepare(){throw new Error('Must not reach database');}}, LIVE_SHEET_WEBHOOK_URL:'https://webhook.test', LIVE_SUBMISSION_TOKEN:'test'}});
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /CPF válido/);
  }
});
