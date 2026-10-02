#!/usr/bin/env node
/**
 * Does this repo still work?
 *
 *     node scripts/verify.mjs
 *
 * WHY THIS EXISTS
 * An example that does not run is worse than no example. Somebody trying to learn will
 * assume they did something wrong, and give up - and they will be wrong about which
 * part was broken.
 *
 * So every claim in this repo is checked here. If this passes, the lessons are true
 * about the code. If it fails, the repo is broken and not the reader.
 *
 * IT RUNS WITH NO MODEL ON PURPOSE
 * The whole point of the first example is that it works with nothing installed. If
 * this script needed a model to verify, it could not verify the thing that matters
 * most.
 */

import { spawn } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 3199

let pass = 0
let fail = 0
function check(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS  ${label}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`) }
}

/** Run a command and collect its output. Never inherits stdio - see the repo notes. */
function run(cmd, args, opts = {}) {
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd: ROOT, ...opts })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { err += d })
    child.on('close', (code) => done({ code, out, err }))
    child.on('error', () => done({ code: -1, out, err: 'spawn failed' }))
  })
}

console.log('\nAI Game Starter — does everything still work?\n' + '-'.repeat(60))

/* ── Lesson 2 runs with nothing installed ───────────────────────────────────── */

const lesson2 = await run('node', ['lessons/02-your-first-call.mjs'])
check('lesson 2 runs and exits cleanly', lesson2.code === 0, `exit ${lesson2.code}`)
check('lesson 2 prints an answer with no model', lesson2.out.includes('fallback') || lesson2.out.includes('said:'))
check('lesson 2 explains how to get a real answer', lesson2.out.includes('Ollama'))

/* ── Lesson 4 runs, and its check catches a wrong answer ────────────────────── */

const lesson4 = await run('node', ['lessons/04-check-yourself.mjs'])
check('lesson 4 runs and exits cleanly', lesson4.code === 0, `exit ${lesson4.code}`)
check('lesson 4 shows what code works out', lesson4.out.includes('what code works out'))
// The lesson is the check, so the check must visibly run with no model installed.
check(
  'lesson 4 runs the check with no model',
  lesson4.out.includes('They match') || lesson4.out.includes('Wrong by'),
)
check(
  'lesson 4 tells you not to ask the model if it was right',
  lesson4.out.includes('Do not ask the model if it was right'),
)
check('lesson 4 points at the example', lesson4.out.includes('examples/word-game/'))

/* ── The README's lesson count is true ─────────────────────────────────────── */
//
// WHY THIS CHECK EXISTS
// The README said "Four short lessons" for as long as there were three. Nothing caught
// it, because a number in a sentence is not compiled, tested, or rendered. It is the
// same class of error as a wrong claim on a web page: true when written, quietly false
// later, and read by someone who has no way to tell.

const lessonFiles = readdirSync(resolve(ROOT, 'lessons')).filter((f) => /^\d\d-/.test(f))
const readmeText = readFileSync(resolve(ROOT, 'README.md'), 'utf8')
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }
const claimed = readmeText.match(/\b(one|two|three|four|five|six|seven|eight) short lessons\b/i)

check('the README claims a lesson count', !!claimed, 'no "N short lessons" found')
if (claimed) {
  const n = WORDS[claimed[1].toLowerCase()]
  check(
    `the README says ${n} and there are ${lessonFiles.length}`,
    n === lessonFiles.length,
    `README says ${claimed[1]}, lessons/ holds ${lessonFiles.length}`,
  )
}

// Every lesson file must be linked from the README, so none is orphaned.
for (const f of lessonFiles) {
  check(`the README links to ${f}`, readmeText.includes(f))
}

/* ── Lesson 5's prompt and checker ─────────────────────────────────────────── */
//
// Lesson 5 tells the reader to copy prompts/make-a-game.txt and then run
// scripts/check-my-game.mjs. Both are things a reader is sent to, so both are things
// that break quietly when a path changes.

const lesson5 = readFileSync(resolve(ROOT, 'lessons/05-make-a-game.md'), 'utf8')
check('the prompt file exists', existsSync(resolve(ROOT, 'prompts/make-a-game.txt')))
check('lesson 5 points at the prompt', lesson5.includes('prompts/make-a-game.txt'))
check('lesson 5 points at the checker', lesson5.includes('check-my-game.mjs'))

// The prompt has to keep the rules that make the output a single runnable file. Without
// these it produces a game that needs a server, which is the whole failure it prevents.
const promptText = readFileSync(resolve(ROOT, 'prompts/make-a-game.txt'), 'utf8')
for (const rule of ['ONE file', 'No libraries', 'No external assets', 'double-clicking', 'touch controls']) {
  check(`the prompt still says "${rule}"`, promptText.includes(rule))
}

/* ── The checker actually works ────────────────────────────────────────────── */
//
// A checker that always passes is worse than no checker, so it is run against a file
// that should pass and a file that should fail, and both answers are asserted.

const fixtureDir = resolve(ROOT, '.verify-fixtures')
mkdirSync(fixtureDir, { recursive: true })

const GOOD = `<!doctype html><html><head><title>Catch</title></head><body>
<canvas id="c" width="480" height="640"></canvas>
<script>
var x=document.getElementById('c').getContext('2d');
function loop(){requestAnimationFrame(loop);x.clearRect(0,0,480,640);}
addEventListener('keydown',function(){});
addEventListener('pointerdown',function(){});
loop();
</script></body></html>`

const BAD = `<!doctype html><html><head><title>x</title>
<script src="https://cdn.example.com/phaser.js"></script>
</head><body><img src="./player.png">
<script type="module">import { Game } from './engine.js'; fetch('https://example.com/a.json');</script>
</body></html>`

writeFileSync(resolve(fixtureDir, 'good.html'), GOOD)
writeFileSync(resolve(fixtureDir, 'bad.html'), BAD)

const goodRun = await run('node', ['scripts/check-my-game.mjs', '.verify-fixtures/good.html'])
check('the checker passes a good file', goodRun.code === 0, `exit ${goodRun.code}`)

const badRun = await run('node', ['scripts/check-my-game.mjs', '.verify-fixtures/bad.html'])
check('the checker fails a broken file', badRun.code === 1, `exit ${badRun.code}`)

// AND IT HAS TO NAME THE REAL PROBLEMS.
//
// This matched the bare label at first, which proved nothing: the checker prints the
// label whether the check passed or failed, so "no ES module imports" appears in the
// output either way. Blinding two checks inside the checker still passed this guard.
//
// It matches the FAIL line now. That is the difference between the words being on the
// page and the thing having happened - the same mistake that made the Sock Maze test
// pass while the game sat on its intro screen.
for (const [label, needle] of [
  ['a website script', 'FAIL  no <script src> loading from a website'],
  ['a module import', 'FAIL  no ES module imports'],
  ['a missing file', 'FAIL  no <img src> pointing at another file'],
  ['no canvas', 'FAIL  it uses a canvas'],
  ['no touch controls', 'FAIL  it listens for touch or pointer'],
]) {
  check(`the checker reports ${label}`, badRun.out.includes(needle), `looked for: ${needle}`)
}

// The good file must PASS those same checks, not merely avoid failing them.
for (const needle of ['PASS  it uses a canvas', 'PASS  no ES module imports', 'PASS  it listens for touch or pointer']) {
  check(`a good file passes: ${needle.replace('PASS  ', '')}`, goodRun.out.includes(needle))
}

rmSync(fixtureDir, { recursive: true, force: true })

/* ── The word list is usable ────────────────────────────────────────────────── */

const words = JSON.parse(readFileSync(resolve(ROOT, 'examples/word-game/words.json'), 'utf8'))
check('the word list is not empty', words.length >= 10, `${words.length} words`)
check('every word has a clue', words.every((w) => w.word && w.clue))
check('no duplicate words', new Set(words.map((w) => w.word)).size === words.length)
check(
  'no built-in clue contains its own answer',
  words.every((w) => !w.clue.toLowerCase().includes(w.word.toLowerCase())),
)

/* ── The server ─────────────────────────────────────────────────────────────── */

const server = spawn('node', ['examples/word-game/server.mjs'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
})

// Wait for it to listen. Poll rather than sleep a fixed amount, so a slow machine
// does not produce a false failure.
let up = false
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 150))
  try {
    const res = await fetch(`http://localhost:${PORT}/`)
    if (res.ok) { up = true; break }
  } catch { /* not yet */ }
}
check('the server starts', up)

if (up) {
  const base = `http://localhost:${PORT}`

  /* ── A new game leaks nothing ───────────────────────────────────────────── */

  const fresh = await (await fetch(`${base}/api/new`)).json()
  check('a new game returns a clue', typeof fresh.clue === 'string' && fresh.clue.length > 0)
  check('a new game returns a letter count', Number.isInteger(fresh.letters) && fresh.letters > 0)

  // The important one. If the answer is in this response, the game is pointless and
  // the lesson about keys applies to it too.
  const leaked = words.filter((w) => JSON.stringify(fresh).toLowerCase().includes(w.word.toLowerCase()))
  check('a new game does NOT send the answer', leaked.length === 0, leaked.map((w) => w.word).join(', '))

  /* ── A wrong guess is wrong ─────────────────────────────────────────────── */

  const wrong = await (await fetch(`${base}/api/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess: 'zzzznotaword' }),
  })).json()
  check('a wrong guess is rejected', wrong.correct === false)
  check('a wrong guess does not reveal the word', wrong.word === undefined)

  /* ── A right guess is right, and found by the code ──────────────────────── */

  // The answer is secret, so the only way to test the win path is to try them all.
  // That is also the honest test: it proves the comparison works for every word.
  let won = null
  for (const w of words) {
    const res = await (await fetch(`${base}/api/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: w.word }),
    })).json()
    if (res.correct) { won = { ...res, tried: w.word }; break }
  }
  check('the correct word is accepted', won !== null)
  check('the word is revealed once guessed', won?.word === won?.tried)
  check('the guess counter rises', (won?.guesses ?? 0) > 1)

  /* ── The page holds no secret ───────────────────────────────────────────── */

  const html = readFileSync(resolve(ROOT, 'examples/word-game/public/index.html'), 'utf8')
  check('the page has no API key in it', !/sk-[A-Za-z0-9_-]{10,}/.test(html))
  check('the page has no process.env reference', !html.includes('process.env'))
  check('the page talks to the server, not the model company', !html.includes('api.openai.com'))

  /* ── The server holds the key properly ──────────────────────────────────── */

  const srv = readFileSync(resolve(ROOT, 'examples/word-game/server.mjs'), 'utf8')
  check('the key is read from the environment', srv.includes('process.env.OPENAI_API_KEY'))
  check('the key is never hard-coded', !/sk-[A-Za-z0-9_-]{10,}/.test(srv))
}

server.kill()

/* ── The lessons exist and link to each other ───────────────────────────────── */

for (const f of [
  'README.md',
  'lessons/01-what-a-model-is.md',
  'lessons/02-your-first-call.mjs',
  'lessons/03-the-key-problem.md',
  'lessons/04-check-yourself.mjs',
  'lessons/05-make-a-game.md',
  'prompts/make-a-game.txt',
  'scripts/check-my-game.mjs',
  'examples/word-game/server.mjs',
  'examples/word-game/public/index.html',
]) {
  check(`${f} exists`, existsSync(resolve(ROOT, f)))
}

console.log('-'.repeat(60))
console.log(`  ${pass} passed, ${fail} failed\n`)
if (fail > 0) {
  console.log('  Something in this repo does not work. That is the repo\'s problem,')
  console.log('  not yours.\n')
  process.exit(1)
}
