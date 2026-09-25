# PLAYTEST LOG — demos GAN loop, round 1

Date: 2026-09-26 · Lane: direct (subagent spawn gateway down) · Branch: `demos/gan-round-1`

## Round 1 — adversarial playtest of the live page (pre-change)

Inventory: one self-contained `index.html` (467KB), four demos on a mini reactive
Sheet engine (`Bus`/`Sheet`/`makeLog`), all internals closed per-demo IIFEs.

| Demo | Has controls | Reset | ML feed | Rewind | Findings |
|------|-------------|-------|---------|--------|----------|
| ocean | flow, speed, drop | ✗ | ✗ (has surge listener log) | ✗ | engine is honest damped-wave; no way to flatten sea without reload |
| reversi | pause, speed | ✗ | ✗ (weights drift invisibly at game end) | ✗ | **the flagship gap** — Casey asked for reset+feed+rewind; zero of three |
| hold'em | next, new, auto | partial (`new` re-deals, persona never resets) | ✗ | ✗ | opponent persona drifts; no visible read of drift |
| desk | run, quantum, retape | ✗ | ✗ | ✗ | (wired in round 2+; not touched this round) |

Verdict round 1: the engines are real (stone drops re-evaluate 336 cells, weight
maps drift with clamped per-square updates) but the *learning* is invisible —
no per-round explanation, no way back, no way to restart.

## Round 2 — build + adversarial verify

Shipped `window.Lab` (shared chrome): per-demo control bar (⟲ reset + scrub
slider), LEARNING FEED panel (last 40 lines, honest renderers only), 200-event
history ring, 200-frame weight film for reversi.

- reversi: `endGame` now emits `{game, result, tideWon, meanDrift, topSquare,
  topDelta, wm}` + film frame. Reset restores START_W / fresh board / counters.
  Scrub paints recorded weight maps onto the live canvas ("film · game N").
- ocean: emits stone + surge events; reset flattens `h`/`hp`, clears log+gauge.
- Verification: all 5 script blocks pass `node --check`; Lab smoke test in a
  fake-DOM harness passes (feed text exact, bucket bug found & fixed — resets
  initially landed in their own history bucket).

## Round 3 — residual gaps (the next adversarial pass)

1. hold'em/desk not yet wired — bar appears, reset button honestly says
   "not wired for soft-reset yet (round 2); reload the page for a full reset".
2. Rewind for reversi paints the weight film but does not restore board states
   (film is weight-map-only by design — board snapshots would need deeper hooks).
3. Feature-link ask (demos page as top feature on superinstance.ai / .dev) is
   front-site work, tracked in the PR body — not this repo.

## Round 2 — the residual gaps close (2026-09-26)

1. hold'em soft-reset: stops auto-play, re-deals OPP a fresh persona
   (loose/aggr/bluff/strength redrawn from the same mulberry(777) stream),
   zeroes the hand counter, re-deals hole cards, emits `holdem-reset`.
   Per-hand feed event: `hand N · <how> · final shape loose x.xx / aggr y.yy (n=…)`.
2. desk soft-reset: restores the ORIGINAL tape (seed 4242 → same prices →
   same doctrine decisions — determinism as the receipt), zeroes equity /
   trades / moth.used budget, re-renders. Distinct from the re-tape button,
   which keeps the spent budget on purpose.
3. desk feed events: entry validated, entry refused (quantum gate),
   budget exhausted, EXIT with pnl, tape-complete summary.
4. reversi rewind is now board-state: film frames record the terminal
   board; scrubbing paints the recorded discs onto the live squares
   (label: "board as dealt"); releasing the scrub restores the live game
   via a new `__scrubEnd` hook in the Lab chrome.
5. All six PATCH cards are now links to their repos (quilt-playtest,
   quilt-tools, quilt-arcade, quilt-quant ×2, quilt-arena), with anchor
   styling reset via `.quiltCardWrap`.
- Verification: `tests/lab-smoke.test.mjs` (committed this round, 23 checks):
  all 5 script blocks parse + structural pins on every wiring claim above.
- Honest residuals: feed history kept across resets by design (CAP 200);
  hold'em auto-play feed lines are per-hand, not per-street (miniLog keeps
  street grain).
