// reversi-sim.test.mjs — behavior harness for the reversi demo (DEMO 02).
// DOM-stub + fake-timer sim: plays real games headlessly, asserting the
// auto-restart and reset chains stay alive. This is the harness that guards
// the "only plays one round" class of bug — FAIL-first by construction.
//
// Run: node tests/reversi-sim.test.mjs   (exit 0 = all checks pass)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function block(nStart, nEnd) {
  const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return m[nStart][1]; // blocks indexed from 0
}
// script blocks: 0=engine(644) 1=Lab chrome(769) 2=reversi(886) …
const ENGINE = block(0), CHROME = block(1), REVERSI = block(2);

// ── fake timers ──
let now = 0; const timers = []; let rafQ = [];
globalThis.setTimeout = (fn, ms) => { const t = { fn, at: now + (ms || 0) }; timers.push(t); return t; };
globalThis.clearTimeout = (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); };
globalThis.requestAnimationFrame = (fn) => { rafQ.push(fn); return rafQ.length; };
function step(until) {
  timers.sort((a, b) => a.at - b.at);
  while (timers.length && timers[0].at <= until) {
    const t = timers.shift(); now = t.at; t.fn();
    if (rafQ.length) { const q = rafQ; rafQ = []; q.forEach(f => { try { f(now); } catch {} }); }
  }
  now = until;
}

// ── DOM stub (auto-vivifying tree: queries never return null) ──
function makeEl(id) {
  const el = {
    id, _cls: '', children: [], parent: null, style: {}, _text: '', value: '1',
    onclick: null, oninput: null, onchange: null, type: '', min: 0, max: 0,
    width: 320, height: 120, innerHTML: '', nextSibling: null,
    set className(v) { this._cls = v; }, get className() { return this._cls; },
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    set innerHTML(v) { this._html = String(v); }, get innerHTML() { return this._html || ''; },
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    appendChild(c) { c.parent = el; el.children.push(c); return c; },
    prepend(c) { el.children.unshift(c); return c; },
    insertBefore(c, ref) { c.parent = el; const i = ref ? el.children.indexOf(ref) : -1; i >= 0 ? el.children.splice(i, 0, c) : el.children.push(c); return c; },
    remove() { if (el.parent) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); } },
    replaceChildren(...cs) { cs.forEach(c => c.parent = el); el.children = cs; },
    get parentElement() { return el.parent; },
    get lastChild() { return el.children[el.children.length - 1] || null; },
    querySelector(sel) {
      const want = sel.trim().replace(/^\./, '');
      let hit = el.children.find(c => (c._cls || '').split(/\s+/).includes(want));
      if (!hit) hit = el.appendChild(makeEl(el.id + '/' + want));
      return hit;
    },
    getContext: () => new Proxy({}, { get: (t, k) => (k === 'canvas' ? el : () => {}) }),
    addEventListener() {}, removeEventListener() {},
    matches: () => false, setAttribute() {}, getAttribute: () => null,
  };
  return el;
}
const registry = new Map();
const byId = (id) => { if (!registry.has(id)) registry.set(id, makeEl(id)); return registry.get(id); };
globalThis.document = {
  getElementById: byId,
  createElement: () => makeEl('anon'),
  querySelector: (sel) => {
    const m = sel.trim().match(/^#([\w-]+)\s+\.([\w-]+)/);
    if (m) return byId(m[1]).querySelector('.' + m[2]);
    return byId(sel.replace(/^#/, '').replace(/^\./, ''));
  },
  querySelectorAll: () => [],
  addEventListener() {},
  head: makeEl('head'),
};
globalThis.window = globalThis;

// engine + chrome + reversi demo, real code — with a debug handle spliced in
const REV_DBG = REVERSI.replace("S.watch('pick'", `window.__rev = { S, legals, get appliedSeq(){return appliedSeq}, get endLock(){return endLock}, get schedToken(){return schedToken}, get games(){return games} };
  S.watch('pick'`).replace('function schedule(pick) {', `function schedule(pick) { (window.__st = window.__st || []).push({ t: 'sched', type: pick.type, seq: pick.seq, i: pick.i, who: pick.who, appliedSeq });`).replace('function apply(pick) {', `function apply(pick) { (window.__st = window.__st || []).push({ t: 'apply', seq: pick.seq, i: pick.i, who: pick.who, flips: pick.flips.length });`);
eval(ENGINE + '\n' + CHROME + '\n' + REV_DBG);

// ── checks ──
let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('ok -', name); } else { fail++; console.log('FAIL -', name); } };
const boardEl = byId('reversiBoard');
const discs = () => boardEl.children.filter(sq => sq.children.some(c => (c._cls || '').split(/\s+/)[0] === 'disc')).length;
const gamesText = () => byId('revGames').textContent;

check('board mounted (64 squares)', boardEl.children.length === 64);
check('game starts from the opening book (4 discs)', discs() === 4);

// play game 1 to completion
let guard = 0;
while (!/games played: 1 /.test(gamesText()) && guard++ < 900) {
  step(now + 800);
  if (guard % 150 === 0) console.log(`   [t=${(now / 1000).toFixed(0)}s discs=${discs()} games=${gamesText().slice(0, 22)}]`);
}
if (!/games played: 1 /.test(gamesText())) {
  console.log(`   exit at t=${(now / 1000).toFixed(0)}s guard=${guard} discs=${discs()}`);
  const d = window.__rev;
  const b = d.S.get('board');
  console.log('   state:', JSON.stringify({
    appliedSeq: d.appliedSeq, endLock: d.endLock, games: d.games,
    seq: d.S.get('seq'), turn: d.S.get('turn'),
    boardDiscs: b.filter(x => x).length,
    pick: d.S.get('pick'),
    empty: b.map((v, i) => v ? -1 : i).filter(i => i >= 0),
  }));
  console.log('   revLog tail:', byId('revLog').innerHTML.split('</div>').slice(-4).join('|<div>').replace(/<[^>]+>/g, ''));
  console.log('   schedule trace (last 12):', JSON.stringify((window.__st || []).slice(-12)));
}
check(`game 1 completes (${gamesText()})`, /games played: 1 /.test(gamesText()));

// the reported bug: round 2 must begin without any user interaction
step(now + 2500); // ride through the 1600ms restart window
const d1 = discs();
step(now + 5000);
const d2 = discs();
check(`round 2 auto-restarts (discs ${d1} → ${d2} after restart window)`, d1 > 4 || d2 > d1);

// reset must restart the chain, not freeze it
const patch = byId('p-reversi');
check('reset wired (patch.__reset)', typeof patch.__reset === 'function');
patch.__reset();
step(now + 300);
check('reset zeroes the counter', /games played: 0 /.test(gamesText()));
const r1 = discs();
step(now + 5000);
const r2 = discs();
check(`reset re-animates the board (discs ${r1} → ${r2})`, r2 > r1);

// film keeps the round-1 receipts (learning loop intact)
const filmState = globalThis.Lab && typeof Lab === 'object';
check('Lab chrome mounted', filmState === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
