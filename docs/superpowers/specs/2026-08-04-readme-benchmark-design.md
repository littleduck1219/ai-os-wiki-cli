# README rewrite + context-recall benchmark — design

Approved in session 2026-08-04.

## Goals

1. Rewrite the README for readability: English main + `README.ko.md`, ponytail-style structure (hook → before/after → numbers → install → usage → reference).
2. Quantify how much better an agent understands a project with the plugin installed, with a real, reproducible measurement.

## Benchmark design

- **Metric**: context recall — % of expected project facts a fresh headless
  session states correctly.
- **Fixture**: `benchmarks/fixture/project` (tiny notes API) +
  `benchmarks/fixture/wiki` (its AI OS Wiki). Key facts exist only in the wiki.
- **Arms**: baseline (code only) vs ai-os (code + wiki + `CLAUDE.md` pointer,
  i.e. what `ai-os setup` produces).
- **Protocol**: 8 questions × 3 runs × 2 arms, `claude -p` with read-only
  tools, Haiku. Judge model counts stated facts per answer.
- **Output**: `benchmarks/results/<date>.json`, summary published in both READMEs.

## Non-goals

- Measuring general coding ability.
- Multi-model sweeps, CI automation — add if the numbers get contested.
