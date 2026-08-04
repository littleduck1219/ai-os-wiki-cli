# 📗 orbit-notes Decision Log

## SQLite over Postgres (2026-07)

Chosen because deployment is a single home server (`duckbox`): no separate
database server to operate, and the data comfortably fits in one file.
Postgres was rejected as operational overhead for a one-host app.

## No web framework (2026-06)

Zero-dependency policy: the stdlib `node:http` server was chosen over Express
so deploys need no `node_modules` at all. Rejected Express explicitly.

## Rate limiting deferred (2026-07)

Not needed while the API is only reachable inside the home network.
