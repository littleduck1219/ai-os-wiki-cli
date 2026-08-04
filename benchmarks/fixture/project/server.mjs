import http from 'node:http'
import { listNotes, addNote } from './store.mjs'

const PORT = process.env.PORT ?? 8787

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'GET' && url.pathname === '/notes') {
    const page = Number(url.searchParams.get('page') ?? 1)
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(listNotes(page)))
  } else if (req.method === 'POST' && url.pathname === '/notes') {
    let body = ''
    req.on('data', c => (body += c))
    req.on('end', () => {
      const { text } = JSON.parse(body)
      const note = addNote(text)
      res.statusCode = 201
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(note))
    })
  } else {
    res.statusCode = 404
    res.end()
  }
})

server.listen(PORT, () => console.log(`orbit-notes listening on :${PORT}`))
