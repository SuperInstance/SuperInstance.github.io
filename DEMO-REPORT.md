# DEMO-REPORT — demos GAN loop, round 2

**Repo:** SuperInstance/superinstance.github.io · **Branch:** `demos/gan-round-2` · **Date:** 2026-09-26

## What round 2 ships (this PR)
Round 1 merged (PR #1) with the Lab chrome + reversi flagship. This round closes
every residual gap round 1 honestly deferred:

1. **Hold'em is fully wired.** Soft-reset stops auto-play, re-deals OPP a fresh
   persona from the same mulberry(777) stream, zeroes the hand counter, re-deals
   hole cards. The feed closes every hand: `hand N · <how> · final shape loose
   x.xx / aggr y.yy (n=…)` — the opponent's drifting read-model is now visible
   per hand, not just in the miniLog.
2. **The desk is fully wired.** Soft-reset replays the ORIGINAL tape (seed 4242):
   same prices, same doctrine decisions — determinism as the receipt. (Distinct
   from the re-tape button, which spends a fresh seed and KEEPS the spent
   moth.used budget on purpose.) Feed events: entry validated, quantum-gate
   refusal, budget exhausted, EXIT with pnl, tape-complete summary.
3. **Reversi rewind is now board-state, not just weights.** Film frames record
   the terminal board; scrubbing paints the recorded discs onto the live
   squares ("film · game N · result · board as dealt"); releasing the scrub
   hands the squares back via a new `__scrubEnd` hook in the Lab chrome.
4. **All six PATCH cards link to their repos** (quilt-playtest, quilt-tools,
   quilt-arcade, quilt-quant ×2, quilt-arena) — the front door now routes to
   the fleet's GitHub presence.

## Verification (all green)
- `node tests/lab-smoke.test.mjs` — 23/23. Committed harness, two layers:
  every `<script>` block parses; structural pins on each wiring claim above
  (bar mounts, reset bodies, emit sites, film board, scrub-end, six links).
- All 5 demos now mount `Lab.bar`; none fall through to the honest-unwired
  message from round 1.

## Honest residuals
- Feed history is kept across resets by design (200-event ring; the reset line
  itself marks the boundary).
- Hold'em feed grain is per-hand; street grain stays in the miniLog.
- superinstance.ai / .dev top-nav links remain a front-site owner action.

Playtest trail: `PLAYTEST-LOG.md` (rounds 1–2).
