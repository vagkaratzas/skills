// Self-check for the pure geometry helpers of mm_core.js: node test_mm_core.js
const assert = require('assert');
const MM = require('./mm_core.js');

// Lanes keep 10px apart around a right turn (east then south): the right-hand lane turns inside
const centre = [[0, 0], [100, 0], [100, 100]];
assert.deepStrictEqual(MM.offset(centre, 10), [[0, 10], [90, 10], [90, 100]]);
assert.deepStrictEqual(MM.offset(centre, -10), [[0, -10], [110, -10], [110, 100]]);

// Arrows sit mid-segment on solid lines, skip short or diagonal segments, point along travel
assert.deepStrictEqual(MM.arrowPoints([[0, 0], [200, 0], [200, 50], [100, 150]], false), [[100, 0, 'east']]);

// On dotted lines they are snapped onto a dash centre (5 + 20k from the line start)
const [[x]] = MM.arrowPoints([[0, 0], [230, 0]], true);
assert.strictEqual((x - 5) % 20, 0);
const [, [, y]] = MM.arrowPoints([[0, 0], [130, 0], [130, 300]], true);
assert.strictEqual((130 + y - 5) % 20, 0);

console.log('ok');
