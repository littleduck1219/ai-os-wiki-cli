# 📕 orbit-notes Issue Map

## Empty POST body crash (open)

`POST /notes` with an empty or invalid JSON body crashes the whole server:
`JSON.parse(body)` in `server.mjs` is not wrapped in try/catch, so the
exception escapes the request handler. Planned fix: try/catch returning
HTTP 400. Until fixed, clients must validate the body before sending.
