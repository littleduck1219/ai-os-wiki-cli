import fs from 'node:fs'

const FILE = new URL('./notes.json', import.meta.url)
const PAGE_SIZE = 10

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return []
  }
}

export function listNotes(page = 1) {
  const notes = load()
  const start = (page - 1) * PAGE_SIZE
  return { page, total: notes.length, notes: notes.slice(start, start + PAGE_SIZE) }
}

export function addNote(text) {
  const notes = load()
  const note = { id: notes.length + 1, text, createdAt: new Date().toISOString() }
  notes.push(note)
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2))
  return note
}
