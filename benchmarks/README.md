# Context-recall benchmark

Measures how much project context a fresh agent session actually has, with and
without the AI OS Wiki connected.

## Method

- **Fixture**: [`fixture/project/`](fixture/project/) is a tiny notes API.
  [`fixture/wiki/`](fixture/wiki/) is its AI OS Wiki. The facts that matter —
  migration status, why SQLite over Postgres, deploy procedure, known bugs,
  next tasks — exist **only in the wiki**, never in the code. That mirrors real
  projects: code says *what*, memory says *why*, *where we are*, and *what's next*.
- **Arms**: `baseline` gets only the project code. `ai-os` gets the same code
  plus the wiki and a `CLAUDE.md` pointer — exactly what `ai-os setup` produces.
- **Runs**: each of the 8 questions in [`questions.json`](questions.json) is
  asked to a headless agent (`claude -p`, read-only tools, Haiku) 3 times per arm.
- **Grading**: a judge model checks each answer against the question's expected
  facts; a fact counts only if actually stated (paraphrase ok, hedged guesses no).
  Score = facts recalled / facts total.

## Reproduce

```bash
node benchmarks/run.mjs            # full run (8 questions × 3 runs × 2 arms)
node benchmarks/run.mjs --smoke    # 1 question × 1 run, pipeline check
node benchmarks/run.mjs --model sonnet --runs 5
```

Raw per-answer results land in `results/<date>.json`.

## Honest limitations

- This measures **recall of facts recorded in the wiki**, not general coding
  ability. A project with an empty wiki gains nothing.
- The judge is an LLM; fact-level grading keeps it mechanical, but it is not a
  human rubric.
- If you run it with other agent plugins installed, they are active in both
  arms; the arms differ only in the wiki and pointer.
