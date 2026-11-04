import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {featuredLiveCollections} from '../scripts/featured-live-collections.mjs';

test('featured collections retain every color, SKU and stacked live price in the published page', () => {
  const html = readFileSync(new URL('../live/index.html', import.meta.url), 'utf8');
  const generated = featuredLiveCollections();
  assert.ok(html.includes(generated));
  assert.ok(generated.indexOf('id="live-acai-bowl"') < generated.indexOf('id="live-tulipa-confraria"'));
  const {collections} = JSON.parse(readFileSync(new URL('../live/featured-collections.json', import.meta.url)));
  assert.deepEqual(collections.map(c => c.cards.length), [3, 4]);
  for (const collection of collections) {
    for (const option of collection.cards) {
      assert.equal(html.split(`data-variant-key="${option.key}"`).length - 1, 1);
      const card = generated.match(new RegExp(`<article[^>]*data-variant-key="${option.key}"[\\s\\S]*?</article>`))[0];
      assert.ok(card.includes(`sku=${option.sku}`));
      assert.ok(card.includes(`data-base-price="${option.price}"`));
      assert.ok(card.includes(`data-original-price="${option.oldPrice}"`));
      assert.ok(card.includes('>__LIVE_COUPON__</strong>'));
      assert.ok(card.includes(collection.theme === 'acai' ? '176,00' : '119,20'));
    }
  }
  assert.equal(html, readFileSync(new URL('../dist/live/index.html', import.meta.url), 'utf8'));
  assert.equal(readFileSync(new URL('../live/featured-collections.css', import.meta.url), 'utf8'), readFileSync(new URL('../dist/live/featured-collections.css', import.meta.url), 'utf8'));
});
