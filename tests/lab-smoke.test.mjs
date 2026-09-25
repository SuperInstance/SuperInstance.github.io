// Lab smoke test — round 2. Run: node tests/lab-smoke.test.mjs
// Two layers:
//   1. every <script> block parses (node --check on extracted sources)
//   2. structural pins: the wiring this round added actually exists
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => { cond ? pass++ : (fail++, console.log(`FAIL ${name}`)); };

// ── layer 1: script blocks parse
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
ok(blocks.length === 5, `expected 5 script blocks (per round-1 report), got ${blocks.length}`);
const dir = mkdtempSync(join(tmpdir(), 'lab-smoke-'));
blocks.forEach((src, i) => {
  const p = join(dir, `block${i}.mjs`);
  writeFileSync(p, src);
  try { execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' }); pass++; }
  catch (e) { fail++; console.log(`FAIL block ${i} parse: ${e.stderr}`); }
});

// ── layer 2: structural pins
// round 2 wiring: every demo has a bar; hold'em + desk have soft resets
ok((html.match(/Lab\.bar\('/g) || []).length === 4, 'four Lab.bar mounts (ocean/reversi/holdem/desk)');
ok(html.includes("Lab.bar('p-holdem', 'holdem')"), 'holdem bar mounted');
ok(html.includes("Lab.bar('p-desk', 'desk')"), 'desk bar mounted');
ok(/patch\.__reset = \(\) => \{\s*if \(auto\) \{ clearInterval\(auto\);[\s\S]*?newHand\(true\);[\s\S]*?Lab\.emit\('holdem-reset', \{\}\);/.test(html), 'holdem soft-reset: stops auto, re-deals persona, newHand(true), emits');
ok(/patch\.__reset = \(\) => \{\s*seed = 4242; makeTape\(\);[\s\S]*?S\.cell\('moth\.used', 0, \{ silent: true \}\);[\s\S]*?Lab\.emit\('desk-reset', \{\}\);/.test(html), 'desk soft-reset: original seed, budget restored, emits');
ok(!/isn't wired for soft-reset yet/.test(html.replace(/reset requested — this demo isn't wired for soft-reset yet \(round 2\); reload the page for a full reset/, '')), 'no demo still falls through to the honest-unwired message... except the generic fallback');
// feed renderers for the new event types
for (const k of ["'holdem-reset'", "'desk-reset'", "'holdem':", "'desk':"])
  ok(html.includes(k), `RENDER entry ${k}`);
// per-hand + desk engine emits
ok(html.includes("Lab.emit('holdem', sh"), 'holdem emits per-hand close');
ok((html.match(/Lab\.emit\('desk', /g) || []).length >= 4, 'desk emits entry-refusal/exit/completion events');
// board-state film
ok(html.includes("result: lastResult, b: S.get('board').slice()"), 'reversi film records terminal board');
ok(html.includes('patch.__scrubEnd = () => render()'), 'scrub release restores live board');
ok(html.includes('if (f.b) for (let i = 0; i < 64; i++)'), 'scrub paints recorded board onto squares');
// feature links: all six PATCH cards link out; the two VOYAGE cards stay
// unlinked on purpose (narrative cards, no single owning repo)
const wraps = (html.match(/class="quiltCardWrap" href="https:\/\/github\.com\/SuperInstance\//g) || []).length;
ok(wraps === 6, `six patch cards, six repo links (links=${wraps})`);
ok(html.includes('.quiltCardWrap{display:block;text-decoration:none;color:inherit}'), 'card link CSS resets anchor styling');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
