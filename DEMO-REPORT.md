# DEMO-REPORT — demos GAN loop, round 1

**Repo:** SuperInstance/superinstance.github.io · **Branch:** `demos/gan-round-1` · **Date:** 2026-09-26

## What Casey asked
1. RESET buttons on all games/demos.
2. An ML loop with a LIVE FEED explaining what changes each round.
3. REWIND control to watch the ML improve.
4. Same for all games/demos (iterated GAN playtest loop).
5. Demos page as a top feature link on superinstance.ai and superinstance.dev.

## What round 1 ships (this PR)
- **`window.Lab`** — shared lab chrome: control bar (⟲ reset + scrub slider) and a
  LEARNING FEED panel per demo. Feed renders ONLY engine-emitted events
  (`Lab.emit`); no synthetic lines. 200-event ring buffer.
- **Reversi (flagship, fully wired):**
  - Per-game learning feed: `game N · WINNER wins A — B → loser's cells absorb the
    lesson · weight map shifted X% (mean |Δw|) · biggest move: square h1 (−0.90) ·
    TERRA flips 2.28 / mobility 1.58`. Every number measured from the actual
    pre/post weight arrays.
  - ⟲ reset: restores opening weights, fresh board, zero counters.
  - Rewind film: every game's weight map recorded; scrub the slider to watch the
    learning walk backwards, frame labeled `film · game N · result`.
- **Ocean:** stone/surge events in the feed; reset flattens the sea, clears the
  gauge and console.
- **Hold'em + desk:** bar + feed panel present; reset button honestly reports
  "not wired for soft-reset yet (round 2)" instead of faking it. Wiring lands
  in round 2 (their state closures need per-demo hooks like reversi's).

## Verification (all green)
- 5 script blocks pass `node --check`.
- Lab smoke test (fake-DOM harness): exact feed text, event/film counts, reset
  bucketing. One real bug found & fixed in this harness pass: `-reset` events
  originally created separate history buckets.

## Honest gaps
- Rewind is weight-map-only (no board-state film).
- Feature links on superinstance.ai/.dev = front-site PRs, tracked separately.
- GAN round 2 continues on hold'em/desk wiring + board-film rewind.

Playtest trail: `PLAYTEST-LOG.md`.
