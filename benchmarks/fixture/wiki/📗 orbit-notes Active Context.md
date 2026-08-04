# 📗 orbit-notes Active Context

- We are migrating storage from the JSON file store to SQLite (`node:sqlite`).
- `store.mjs` is still the old JSON-file implementation; the SQLite schema is designed but not yet wired in.
- The migration is roughly halfway done: schema decided, write path not started.
- Do not add new features to the JSON store; it is deprecated.
