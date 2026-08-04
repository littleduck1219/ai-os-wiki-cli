#!/usr/bin/env node
// Context-recall benchmark: headless agent answers project questions in a
// fixture repo, with and without the AI OS Wiki pointer. Answers are graded
// fact-by-fact by a judge model. Usage:
//   node benchmarks/run.mjs [--runs 3] [--model haiku] [--smoke]
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const exec = promisify(execFile)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? dflt : args[i + 1]
}
const SMOKE = args.includes('--smoke')
const RUNS = SMOKE ? 1 : Number(flag('runs', 3))
const MODEL = flag('model', 'haiku')
const CONCURRENCY = 4

const questions = JSON.parse(fs.readFileSync(path.join(HERE, 'questions.json'), 'utf8'))
  .slice(0, SMOKE ? 1 : Infinity)

// Each arm gets its own copy of the fixture so runs never mutate the repo.
function setupArm(withWiki) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-os-bench-'))
  fs.cpSync(path.join(HERE, 'fixture', 'project'), path.join(tmp, 'project'), { recursive: true })
  if (withWiki) {
    fs.cpSync(path.join(HERE, 'fixture', 'wiki'), path.join(tmp, 'wiki'), { recursive: true })
    const wikiFiles = fs.readdirSync(path.join(tmp, 'wiki')).map(f => `- ../wiki/${f}`).join('\n')
    fs.writeFileSync(
      path.join(tmp, 'project', 'CLAUDE.md'),
      `# CLAUDE.md\n\n## AI OS Wiki Pointer\n\nThis project is connected to an AI OS Wiki (long-term project memory).\nBefore answering questions about this project, read the wiki documents:\n\n${wikiFiles}\n`
    )
  }
  return path.join(tmp, 'project')
}

async function claude(prompt, cwd, tools) {
  const a = ['-p', prompt, '--model', MODEL, '--max-turns', '12']
  if (tools) a.push('--allowedTools', tools)
  const { stdout } = await exec('claude', a, { cwd, timeout: 240_000 })
  return stdout.trim()
}

const ask = (q, cwd) =>
  claude(`Answer from this project's context: ${q}\nIf you do not know, say you do not know. Be concise.`, cwd, 'Read,Glob,Grep')

async function judge(q, answer) {
  const prompt = [
    'You are grading an answer for factual recall. For each expected fact, the answer',
    'earns the point only if it states that fact (paraphrase ok, guessing-hedged or',
    'contradicted facts earn nothing).',
    `Question: ${q.question}`,
    `Expected facts:\n${q.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
    `Answer:\n${answer}`,
    'Reply with ONLY a JSON object: {"correct": <number of expected facts stated>}',
  ].join('\n\n')
  const out = await claude(prompt, HERE)
  const m = out.match(/\{[^}]*"correct"\s*:\s*(\d+)[^}]*\}/)
  if (!m) throw new Error(`unparseable judge output: ${out.slice(0, 200)}`)
  return Math.min(Number(m[1]), q.facts.length)
}

async function pool(jobs, size) {
  const results = []
  let i = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < jobs.length) results[i] = await jobs[i++]()
    })
  )
  return results
}

const arms = { baseline: setupArm(false), 'ai-os': setupArm(true) }
const jobs = []
for (const [arm, cwd] of Object.entries(arms))
  for (const q of questions)
    for (let run = 0; run < RUNS; run++)
      jobs.push(async () => {
        const answer = await ask(q.question, cwd)
        const correct = await judge(q, answer)
        console.error(`${arm} ${q.id} run${run}: ${correct}/${q.facts.length}`)
        return { arm, id: q.id, run, correct, total: q.facts.length, answer }
      })

const results = await pool(jobs, CONCURRENCY)
const totalFacts = questions.reduce((s, q) => s + q.facts.length, 0) * RUNS
const summary = {}
for (const arm of Object.keys(arms)) {
  const got = results.filter(r => r.arm === arm).reduce((s, r) => s + r.correct, 0)
  summary[arm] = { correct: got, total: totalFacts, recall: Math.round((100 * got) / totalFacts) }
}

const out = { date: new Date().toISOString().slice(0, 10), model: MODEL, runs: RUNS, summary, results }
const file = path.join(HERE, 'results', `${out.date}${SMOKE ? '-smoke' : ''}.json`)
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, JSON.stringify(out, null, 2))
console.log(JSON.stringify(summary, null, 2))
console.log(`saved ${file}`)
