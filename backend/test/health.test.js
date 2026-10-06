const test = require('node:test');
const assert = require('node:assert');

test('basic backend test', () => {
    assert.strictEqual(1 + 1, 2);
});