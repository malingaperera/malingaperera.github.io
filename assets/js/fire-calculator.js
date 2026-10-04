// Aussie FIRE Stages calculator: calculation engine + page UI.
// Wrapped in an IIFE so nothing (notably `$`) leaks into al-folio's globals.
// In Node the engine is exported for tests/fire-engine.test.js and the UI is skipped.
// Excluded from jekyll-minifier in _config.yml: uglify-es can't parse `??`, `||=` or object spread.
(function () {

// ---- Australian rules (FY2026-27; Age Pension figures from 20 Sep 2026) ----
// Update each July (tax, super caps) and September (Age Pension rates and thresholds).
const AU = {
  presAge: 60, pensionAge: 67, sg: 0.12, contribTax: 0.15,
  ccCap: 32500, nccCap: 130000, tbc: 2100000, div296: 3000000,
  pension: {
    max: { single: 1237.70 * 26, couple: 1866.00 * 26 },
    assetLower: { single: { home: 333000, rent: 600000 }, couple: { home: 499000, rent: 766000 } },
    assetTaperPerK: 3 * 26,
    incomeFree: { single: 226 * 26, couple: 396 * 26 }, incomeTaper: 0.5,
    deem: { low: 0.0175, high: 0.0375, thresh: { single: 66800, couple: 110600 } },
    workBonus: 300 * 26
  }
};

// Individual resident tax 2026-27 (approx): brackets + LITO + 2% Medicare with low-income shade-in
function incomeTax(g) {
  let t;
  const br = [[18200, 0], [45000, 0.15], [135000, 0.30], [190000, 0.37], [Infinity, 0.45]];
  t = 0; let prev = 0;
  for (const [top, r] of br) { if (g > prev) t += (Math.min(g, top) - prev) * r; prev = top; }
  let lito = 700;
  if (g > 66667) lito = 0; else if (g > 45000) lito = 325 - (g - 45000) * 0.015; else if (g > 37500) lito = 700 - (g - 37500) * 0.05;
  t = Math.max(0, t - Math.max(0, lito));
  const mLow = 28000, mHigh = 35000;
  const med = g <= mLow ? 0 : g <= mHigh ? (g - mLow) * 0.10 : g * 0.02;
  return t + Math.min(med, g * 0.02);
}
const netIncome = g => g - incomeTax(g);

function agePension(p, assets, earned) {
  const c = p.couple ? 'couple' : 'single', P = AU.pension, max = P.max[c];
  const byAssets = max - Math.max(0, assets - P.assetLower[c][p.home ? 'home' : 'rent']) / 1000 * P.assetTaperPerK;
  const th = P.deem.thresh[c];
  const deemed = Math.min(assets, th) * P.deem.low + Math.max(0, assets - th) * P.deem.high;
  const earnedAssessable = Math.max(0, earned - P.workBonus * (p.couple ? 2 : 1));
  const byIncome = max - Math.max(0, deemed + earnedAssessable - P.incomeFree[c]) * P.incomeTaper;
  return Math.max(0, Math.min(max, byAssets, byIncome));
}

function contribs(p) {
  const cap = AU.ccCap * (p.couple ? 2 : 1);
  const sg = AU.sg * p.salary;
  const total = sg + p.salSac;
  return { sg: Math.min(sg, cap), total: Math.min(total, cap), raw: total, cap };
}

// Year-by-year real-dollar simulation.
// o: {retireAge, contribUntil, spend, barista, baristaUntil, O0, S0, pensionOn, coastSG, trace}
function sim(p, o) {
  let O = o.O0, S = o.S0, ok = true, failAge = null, pensionAt67 = 0;
  const c = contribs(p), tr = [];
  const bNet = netIncome(o.barista || 0);
  for (let a = p.age; a < p.planAge; a++) {
    let pension = 0, earned = 0;
    if (o.trace) tr.push({ a, O, S });
    if (a < o.retireAge) {
      if (a < o.contribUntil) { O += p.saveOutside; S += c.total * (1 - AU.contribTax); }
      else { S += Math.min(AU.sg * (o.coastSalary || 0), c.cap) * (1 - AU.contribTax); }
    } else {
      const working = o.barista > 0 && a < o.baristaUntil;
      earned = working ? o.barista : 0;
      const net = working ? bNet : 0;
      S += AU.sg * earned * (1 - AU.contribTax);
      if (o.pensionOn && a >= AU.pensionAge) pension = agePension(p, O + S, earned);
      if (a === AU.pensionAge) pensionAt67 = pension;
      let need = o.spend - net - pension;
      if (need < 0) O -= need;
      else if (a < AU.presAge) { if (O >= need) O -= need; else { ok = false; failAge = a; break; } }
      else {
        const t = Math.min(O, need); O -= t; need -= t;
        if (S >= need) S -= need; else { ok = false; failAge = a; break; }
      }
    }
    O *= 1 + p.rOut; S *= 1 + p.rSuper;
  }
  if (o.trace && ok) tr.push({ a: p.planAge, O, S });
  return { ok, failAge, pensionAt67, trace: tr, O, S };
}

// PV (at retireAge) of spending minus part-time net income for ages retireAge..59, annuity-due
function bridgeAt(p, o) {
  let pv = 0; const bNet = netIncome(o.barista || 0);
  for (let a = o.retireAge; a < AU.presAge; a++) {
    const net = o.barista > 0 && a < o.baristaUntil ? bNet : 0;
    pv += Math.max(0, o.spend - net) / Math.pow(1 + p.rOut, a - o.retireAge);
  }
  return pv;
}

// Minimum (outside, super) needed TODAY for scenario o (contribUntil assumed = now unless coast SG)
function required(p, o) {
  const yrs = Math.max(0, o.retireAge - p.age);
  const outside = bridgeAt(p, o) / Math.pow(1 + p.rOut, yrs);
  const test = S0 => sim(p, { ...o, O0: outside + 1, S0, contribUntil: p.age }).ok;
  let lo = 0, hi = 5e7;
  if (test(0)) return { outside, superAmt: 0, total: outside };
  if (!test(hi)) return { outside, superAmt: Infinity, total: Infinity };
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (test(m)) hi = m; else lo = m; }
  return { outside, superAmt: hi, total: outside + hi };
}

// Balances at the start of age X if you keep saving as now until then
function balanceAt(p, X) {
  const c = contribs(p); let O = p.O, S = p.S;
  for (let a = p.age; a < X; a++) { O += p.saveOutside; S += c.total * (1 - AU.contribTax); O *= 1 + p.rOut; S *= 1 + p.rSuper; }
  return { O, S, total: O + S };
}

function earliest(p, mk) {
  for (let R = p.age; R <= 75; R++) if (sim(p, mk(R)).ok) return R;
  return null;
}

function analyse(p) {
  const base = { O0: p.O, S0: p.S, pensionOn: p.pensionOn, barista: 0, baristaUntil: 0, coastSalary: 0 };
  const now = p.age;
  const res = {};
  const levels = { lean: p.spendLean, full: p.spendFull, fat: p.spendFat };
  for (const [k, spend] of Object.entries(levels)) {
    const o = { ...base, spend, retireAge: now, contribUntil: now };
    res[k] = {
      spend, req: required(p, o), status: sim(p, o),
      earliest: earliest(p, R => ({ ...base, spend, retireAge: R, contribUntil: R })),
      classic: spend / p.swr
    };
  }
  // Barista: leave full-time now, part-time income until baristaUntil
  const bo = { ...base, spend: p.spendFull, retireAge: now, contribUntil: now, barista: p.barista, baristaUntil: p.baristaUntil };
  res.barista = {
    req: required(p, bo), status: sim(p, bo),
    earliest: earliest(p, R => ({ ...bo, retireAge: R, contribUntil: R })),
    net: netIncome(p.barista)
  };
  // Coast: stop voluntary saving now, keep working (SG only if toggled) until coastAge, then full spend
  const co = { ...base, spend: p.spendFull, retireAge: Math.max(now, p.coastAge), contribUntil: now, coastSalary: p.coastSalary };
  res.coast = {
    req: required(p, co), status: sim(p, co),
    earliest: earliest(p, X => ({ ...co, contribUntil: X }))
  };
  for (const k of ['coast', 'barista', 'lean', 'full', 'fat']) res[k].at = res[k].earliest == null ? null : balanceAt(p, res[k].earliest);
  // Path for chart: save until earliest Full FIRE age (or coastAge if none)
  const R = res.full.earliest ?? p.coastAge;
  res.path = sim(p, { ...base, spend: p.spendFull, retireAge: R, contribUntil: R, trace: true });
  res.pathAge = R;
  res.pathFeasible = res.full.earliest != null;
  // AU split at the earliest full FIRE age
  const pr = { ...p, age: R, O: 0, S: 0 };
  res.bridgeAtR = bridgeAt(p, { spend: p.spendFull, retireAge: R, barista: 0 });
  const at60 = res.path.trace.find(t => t.a === AU.presAge);
  res.superAt60 = at60 ? at60.S : null;
  res.pensionAt67 = res.path.pensionAt67;
  const noPen = required({ ...p }, { ...base, pensionOn: false, spend: p.spendFull, retireAge: now, contribUntil: now });
  res.pensionOffset = noPen.total - res.full.req.total;
  res.contribs = contribs(p);
  res.savingsRate = p.salary > 0 ? (p.saveOutside + res.contribs.raw) / p.salary : 0;
  const people = p.couple ? 2 : 1;
  res.peakSuperPP = Math.max(...res.path.trace.map(t => t.S)) / people;
  return res;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AU, incomeTax, netIncome, agePension, contribs, sim, bridgeAt, required, balanceAt, earliest, analyse };
}
if (typeof document === 'undefined' || !document.getElementById('fire-calc')) return;

// ---- UI ----
const $ = id => document.getElementById(id);
const fmt = n => !isFinite(n) ? 'Out of reach' : '$' + Math.round(n).toLocaleString('en-AU');
const fmtK = n => !isFinite(n) ? '—' : Math.abs(n) >= 1e6 ? '$' + (n/1e6).toFixed(2) + 'M' : '$' + Math.round(n/1000) + 'k';
let couple = true, monthly = true;
const mult = () => monthly ? 12 : 1;
const sp = n => monthly ? '$' + Math.round(n / 12).toLocaleString('en-AU') + ' a month' : fmtK(n) + ' a year';

function read() {
  const v = id => parseFloat($(id).value) || 0;
  return {
    couple, home: $('home').checked, age: Math.round(v('age')), coastAge: Math.round(v('coastAge')), planAge: Math.round(v('planAge')),
    O: v('O'), S: v('S'), salary: v('salary'), salSac: v('salSac') * mult(), saveOutside: v('saveOutside') * mult(),
    spendLean: v('spendLean') * mult(), spendFull: v('spendFull') * mult(), spendFat: v('spendFat') * mult(),
    barista: v('barista'), baristaUntil: Math.round(v('baristaUntil')), coastSalary: v('coastSalary'),
    rOut: v('rOut')/100, rSuper: v('rSuper')/100, swr: Math.max(0.005, v('swr')/100), pensionOn: $('pensionOn').checked
  };
}

function card(name, what, r, p) {
  const e = r.earliest, yrs = e == null ? null : e - p.age;
  let pill, head, sub;
  if (e == null) { pill = '<span class="pill bad">Not by 75</span>'; head = 'After 75'; sub = 'Save more or lower the spending to bring this in.'; }
  else if (yrs <= 0) { pill = '<span class="pill good">Reached</span>'; head = 'Now'; sub = 'You could do this today.'; }
  else { pill = `<span class="pill warn">In ${yrs} yr${yrs > 1 ? 's' : ''}</span>`; head = `Age ${e}`; sub = `${yrs} year${yrs > 1 ? 's' : ''} from now`; }
  const at = r.at;
  const saved = at ? `<div class="meta"><span>You'll have saved</span><b>${fmt(at.total)}</b></div>
    <div class="split"><span><i style="background:var(--fc-out)"></i>${fmtK(at.O)} outside</span><span><i style="background:var(--fc-super)"></i>${fmtK(at.S)} super</span></div>` : '';
  const need = r.req.total, have = p.O + p.S;
  const gap = isFinite(need) ? Math.max(0, need - have) : Infinity;
  const needRow = `<div class="needbox">
    <div class="meta"><span>Needed to do it today</span><b>${fmt(need)}</b></div>
    ${isFinite(need) ? `<div class="split"><span><i style="background:var(--fc-out)"></i>${fmtK(r.req.outside)} outside</span><span><i style="background:var(--fc-super)"></i>${fmtK(r.req.superAmt)} super</span></div>` : ''}
    <div class="meta muted"><span>${gap > 0 ? 'Short by' : 'Surplus'}</span><b>${isFinite(gap) ? fmt(gap > 0 ? gap : have - need) : '—'}</b></div>
  </div>`;
  return `<article class="card">
    <h3>${name}${pill}</h3>
    <p class="what">${what}</p>
    <div><div class="big">${head}</div><div class="split">${sub}</div></div>
    ${needRow}
    ${saved}
  </article>`;
}

function timeline(res, p) {
  const stages = [['Coast', res.coast], ['Barista', res.barista], ['Lean', res.lean], ['Full', res.full], ['Fat', res.fat]];
  const a0 = p.age, a1 = Math.max(a0 + 10, ...stages.map(([, r]) => r.earliest ?? 0)) + 2;
  const W = 760, H = 106, L = 16, R = 16, y0 = 72;
  const x = a => L + (a - a0) / (a1 - a0) * (W - L - R);
  let g = `<line x1="${L}" x2="${W-R}" y1="${y0}" y2="${y0}" stroke="var(--global-divider-color)" stroke-width="2"/>`;
  for (let a = Math.ceil(a0 / 5) * 5; a <= a1; a += 5) g += `<line x1="${x(a)}" x2="${x(a)}" y1="${y0-4}" y2="${y0+4}" stroke="var(--global-text-color-light)"/><text x="${x(a)}" y="${y0+20}" text-anchor="middle" font-size="11" fill="var(--global-text-color-light)">${a}</text>`;
  const byAge = {};
  stages.forEach(([n, r]) => { if (r.earliest != null) (byAge[Math.max(a0, r.earliest)] ||= []).push(n); });
  let lastX = -1e9, lvl = 0;
  for (const [a, names] of Object.entries(byAge).sort((m, n) => m[0] - n[0])) {
    const xa = x(+a);
    lvl = xa - lastX < 64 ? lvl + names.length : 0; lastX = xa;
    const anchor = xa < L + 30 ? 'start' : xa > W - R - 30 ? 'end' : 'middle';
    g += `<circle cx="${xa}" cy="${y0}" r="6" fill="var(--fc-out)" stroke="var(--global-card-bg-color)" stroke-width="2"/>`;
    names.forEach((n, i) => g += `<text x="${xa}" y="${y0 - 14 - (lvl + i) * 14}" text-anchor="${anchor}" font-size="12" font-weight="600" fill="var(--global-text-color)">${n}</text>`);
  }
  $('timeline').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Age you reach each stage">${g}</svg>`;
}

function chart(res, p) {
  const tr = res.path.trace; if (!tr.length) { $('chart').innerHTML = ''; return; }
  const W = 760, H = 300, L = 62, R = 14, T = 14, B = 34;
  const a0 = tr[0].a, a1 = p.planAge;
  const maxV = Math.max(1, ...tr.map(t => t.O + t.S));
  const step = niceStep(maxV / 4); const top = Math.ceil(maxV / step) * step;
  const x = a => L + (a - a0) / (a1 - a0) * (W - L - R);
  const y = v => T + (1 - v / top) * (H - T - B);
  const area = (lo, hi) => 'M' + tr.map(t => x(t.a) + ',' + y(hi(t))).join('L') + 'L' + tr.slice().reverse().map(t => x(t.a) + ',' + y(lo(t))).join('L') + 'Z';
  let g = '';
  for (let v = 0; v <= top + 1; v += step) g += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--global-divider-color)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--global-text-color-light)">${fmtK(v)}</text>`;
  for (let a = Math.ceil(a0/5)*5; a <= a1; a += 5) g += `<text x="${x(a)}" y="${H-12}" text-anchor="middle" font-size="11" fill="var(--global-text-color-light)">${a}</text>`;
  const mark = (a, label) => a > a0 && a < a1 ? `<line x1="${x(a)}" x2="${x(a)}" y1="${T}" y2="${H-B}" stroke="var(--global-text-color-light)" stroke-dasharray="3 4"/><text x="${x(a)+5}" y="${T+11}" font-size="11" fill="var(--global-text-color-light)">${label}</text>` : '';
  const ra = res.pathAge;
  const retire = ra > a0 && ra < a1 ? `<line x1="${x(ra)}" x2="${x(ra)}" y1="${T}" y2="${H-B}" stroke="var(--global-text-color)" stroke-width="1.5"/><text x="${x(ra)-5}" y="${T+11}" text-anchor="end" font-size="11" font-weight="600" fill="var(--global-text-color)">Retire ${ra}</text>` : '';
  const last = tr[tr.length-1];
  const endLbl = res.path.ok ? '' : `<text x="${x(last.a)+4}" y="${y(0)-6}" font-size="11" fill="var(--global-danger-block-title)">Runs out at ${res.path.failAge}</text>`;
  $('chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Projected balances by age">${g}
    <path d="${area(t=>0,t=>t.O)}" fill="var(--fc-out)" fill-opacity=".85"/>
    <path d="${area(t=>t.O,t=>t.O+t.S)}" fill="var(--fc-super)" fill-opacity=".85"/>
    ${mark(60,'60')}${mark(67,'67')}${retire}${endLbl}</svg>`;
}
function niceStep(raw) { const m = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / m; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * m; }

function kpis(res, p) {
  const people = p.couple ? 2 : 1, c = res.contribs;
  const yrsBridge = Math.max(0, AU.presAge - res.pathAge);
  const items = [
    ['Bridge fund needed', fmt(res.bridgeAtR), res.pathFeasible ? `Outside super at your Full FIRE age (${res.pathAge}) to cover ${yrsBridge} years until 60` : `If you retired at ${res.pathAge}`],
    ['Super at 60 on this path', res.superAt60 == null ? '—' : fmt(res.superAt60), 'Tax-free to draw once retired and 60+'],
    ['Classic FI number', fmt(res.full.classic), `Target spend ÷ ${(p.swr*100).toFixed(1)}% SWR, ignoring super rules and the pension`],
    ['Age Pension at 67', p.pensionOn ? fmt(res.pensionAt67) + ' /yr' : 'Off', p.pensionOn ? `On the Full FIRE path; ${Math.round(res.pensionAt67 / p.spendFull * 100)}% of target spend` : 'Turn on to include it'],
    ['Pension saves you', p.pensionOn ? fmt(res.pensionOffset) : '—', 'Reduction in Full FIRE number because the pension takes over part of spending'],
    ['Savings rate', Math.round(res.savingsRate * 100) + '%', 'Outside investing plus SG and salary sacrifice, as a share of gross salary'],
    ['Concessional cap used', fmt(c.raw) + ' of ' + fmt(c.cap), c.raw > c.cap ? 'Over the cap: the excess is taxed at your marginal rate' : 'Unused cap can be carried forward 5 years if super is under $500k', c.raw > c.cap],
    ['Peak super per person', fmt(res.peakSuperPP), res.peakSuperPP > AU.div296 ? 'Over $3M: Division 296 adds 15% tax on earnings above it' : res.peakSuperPP > AU.tbc ? 'Over the $2.1M transfer balance cap: the excess stays in taxed accumulation' : 'Within the $2.1M tax-free pension cap', res.peakSuperPP > AU.tbc],
  ];
  $('kpis').innerHTML = items.map(([k, v, e, f]) => `<div class="kpi${f ? ' flag' : ''}"><span>${k}</span><b>${v}</b><em>${e}</em></div>`).join('');
}

function render() {
  const p = read();
  if (p.planAge <= p.age + 1) return;
  const res = analyse(p);
  const have = p.O + p.S;
  const perMo = n => '$' + Math.round(n / 12).toLocaleString('en-AU') + ' a month';
  $('standSub').textContent = `If you keep investing ${perMo(p.saveOutside)} outside super, plus ${perMo(res.contribs.total)} going into super from your salary, this is when you reach each stage and what you'll have saved by then. Each stage is worked out on its own. You have ${fmt(have)} today.`;
  $('cards').innerHTML = [
    card('Coast FIRE', `Stop investing, keep a ${fmtK(p.coastSalary)} job to pay the bills until ${p.coastAge}, then live on ${sp(p.spendFull)}.`, res.coast, p),
    card('Barista FIRE', `Switch to a ${fmtK(p.barista)} part-time job until ${p.baristaUntil} and live on ${sp(p.spendFull)}.`, res.barista, p),
    card('Lean FIRE', `Stop work and live on ${sp(p.spendLean)} for life.`, res.lean, p),
    card('Full FIRE', `Stop work and live on ${sp(p.spendFull)} for life.`, res.full, p),
    card('Fat FIRE', `Stop work and live on ${sp(p.spendFat)} for life.`, res.fat, p),
  ].join('');
  timeline(res, p);
  $('chartSub').textContent = res.pathFeasible
    ? `Keep saving at today's rate and you can retire on ${sp(p.spendFull)} at ${res.pathAge}. The green bridge carries you to 60, then super takes over.`
    : `At today's saving rate Full FIRE isn't reached by 75. Shown: retiring at ${res.pathAge} anyway.`;
  chart(res, p); kpis(res, p);
}

function setUnit(m) {
  if (m === monthly) return;
  document.querySelectorAll('.fire-calc input.flow').forEach(el => { const v = parseFloat(el.value) || 0; el.value = Math.round(m ? v / 12 : v * 12); el.step = m ? 100 : 1000; });
  showUnit(m);
  render();
}
function showUnit(m) {
  monthly = m;
  $('unitM').setAttribute('aria-pressed', m); $('unitY').setAttribute('aria-pressed', !m);
  document.querySelectorAll('.fire-calc .per').forEach(el => el.textContent = m ? 'per month' : 'per year');
  document.querySelectorAll('.fire-calc input.flow').forEach(el => el.step = m ? 100 : 1000);
}
function showCouple(c) {
  couple = c;
  $('hhCouple').setAttribute('aria-pressed', c); $('hhSingle').setAttribute('aria-pressed', !c);
}

// Remember the visitor's numbers in their own browser. Saved only after they change something,
// so untouched visitors always get the current defaults. Bump the key if the inputs change meaning.
const STORE = 'aussie-fire-calc-v1';
const inputs = () => document.querySelectorAll('.fire-calc input');
function save() {
  try {
    const values = {};
    inputs().forEach(el => values[el.id] = el.type === 'checkbox' ? el.checked : el.value);
    localStorage.setItem(STORE, JSON.stringify({ couple, monthly, values }));
  } catch (e) { /* storage blocked: the calculator still works, it just won't remember */ }
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (!saved || !saved.values) return;
    inputs().forEach(el => {
      if (!(el.id in saved.values)) return;
      if (el.type === 'checkbox') el.checked = !!saved.values[el.id]; else el.value = saved.values[el.id];
    });
    showCouple(saved.couple !== false);
    showUnit(saved.monthly !== false);
  } catch (e) { /* ignore bad or blocked storage */ }
}
function reset() {
  try { localStorage.removeItem(STORE); } catch (e) {}
  inputs().forEach(el => { if (el.type === 'checkbox') el.checked = el.defaultChecked; else el.value = el.defaultValue; });
  showCouple(true); showUnit(true);
  render();
}

$('unitM').onclick = () => { setUnit(true); save(); };
$('unitY').onclick = () => { setUnit(false); save(); };
$('hhSingle').onclick = () => { showCouple(false); render(); save(); };
$('hhCouple').onclick = () => { showCouple(true); render(); save(); };
$('fcReset').onclick = reset;
inputs().forEach(el => el.addEventListener('input', () => { render(); save(); }));
restore();
render();

})();
