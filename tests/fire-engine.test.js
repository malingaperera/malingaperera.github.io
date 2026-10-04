// Engine regression test for assets/js/fire-calculator.js.
// Run: node tests/fire-engine.test.js
const assert = require('node:assert');
const { analyse, balanceAt, agePension } = require('../assets/js/fire-calculator.js');

// Fixed reference inputs (the original artifact's example defaults; the post now starts from average-household figures).
// Per-month inputs are converted to per year (x12) as the UI does.
const defaults = {
  couple: true, home: true, age: 35, coastAge: 60, planAge: 92,
  O: 150000, S: 180000, salary: 250000, salSac: 0, saveOutside: 3300 * 12,
  spendLean: 4200 * 12, spendFull: 6700 * 12, spendFat: 10000 * 12,
  barista: 45000, baristaUntil: 60, coastSalary: 90000,
  rOut: 0.04, rSuper: 0.045, swr: 0.035, pensionOn: true
};

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: expected ~${expected}, got ${actual}`);

const res = analyse(defaults);
assert.strictEqual(res.full.earliest, 47, 'Full FIRE earliest age');
near(res.full.at.total, 1576314, 1, 'Balance at 47');
near(balanceAt(defaults, 47).total, 1576314, 1, 'balanceAt(47)');
near(agePension({ couple: true, home: true }, 400000, 0), 47270, 1, 'Age Pension, couple homeowner, $400k');

console.log('fire-engine: all tests passed');
