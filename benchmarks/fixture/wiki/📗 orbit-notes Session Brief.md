# 📗 orbit-notes Session Brief

## Last session

Fixed an off-by-one bug in `listNotes` pagination (`start` was computed from
`page` instead of `page - 1`).

## Next task

1. Finish the SQLite migration (replace the JSON store in `store.mjs`).
2. Then add a `DELETE /notes/:id` endpoint.
