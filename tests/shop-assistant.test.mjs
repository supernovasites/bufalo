import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/shop-assistant.js';
test('retired AI endpoint returns 410 without invoking AI',async()=>{
 const context={env:{AI:{run(){assert.fail('AI must not be invoked');}}}};
 assert.equal((await onRequestPost(context)).status,410);
 assert.equal((await onRequestGet(context)).status,410);
});
