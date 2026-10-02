#!/usr/bin/env node
/**
 * Check a game that a model wrote for you.
 *
 *     node scripts/check-my-game.mjs my-game.html
 *
 * WHY THIS EXISTS
 * Lesson 5 asks a chatbot to write a whole game as one HTML file. Sometimes it works and
 * sometimes it does not, and the failures all look the same from the outside: you open
 * the file, and nothing happens.
 *
 * This is the check. The model wrote the file. This decides whether it actually works.
 * That is the same split as the word game - the model writes, the code checks - except
 * here the code checking is the thing you run yourself.
 *
 * WHAT IT CAN AND CANNOT TELL YOU
 * It checks the things that make a single file fail on a normal computer: a link to a
 * website, a file that is not there, a module import, no touch controls. It cannot tell
 * you whether the game is any fun, and it cannot tell you whether it plays well. You
 * find that out by playing it, which is the whole point of the exercise.
 *
 * A failure here is not a bad game. It is a file that will not run.
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const file = process.argv[2]

if (!file) {
  console.log('')
  console.log('  Which file? Give it the name of the game the model wrote:')
  console.log('')
  console.log('    node scripts/check-my-game.mjs my-game.html')
  console.log('')
  process.exit(1)
}

const path = resolve(file)
if (!existsSync(path) || !statSync(path).isFile()) {
  console.log('')
  console.log(`  There is no file called ${file} here.`)
  console.log('')
  console.log('  Check the name and the folder. The file has to end in .html')
  console.log('  for a browser to open it as a page.')
  console.log('')
  process.exit(1)
}

const html = readFileSync(path, 'utf8')

let pass = 0
let fail = 0
const notes = []

function check(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS  ${label}`) }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`) }
}

/** Find a pattern and return the first match, for showing the reader what it caught. */
const find = (re) => html.match(re)?.[0] ?? null

console.log('')
console.log(`  checking ${basename(path)}  (${Math.round(html.length / 1024)}KB)`)
console.log('-'.repeat(62))

/* ── It is a page ───────────────────────────────────────────────────────────── */

check('it is an HTML page', /<html[\s>]/i.test(html) || /<!doctype/i.test(html))
check('it has a title', /<title>[^<]+<\/title>/i.test(html), find(/<title>[^<]*<\/title>/i) ?? 'no <title> found')
check('it has some JavaScript', /<script[\s>]/i.test(html))

/* ── Nothing that needs the internet ───────────────────────────────────────── */

// Attribute positions only. A URL in a comment is fine and common; a URL in a src is
// the thing that breaks when somebody opens the file on a train.
const externalRefs = [
  ['<script src> loading from a website', /<script[^>]*\bsrc\s*=\s*["']?(https?:|\/\/)/i],
  ['<link href> loading from a website', /<link[^>]*\bhref\s*=\s*["']?(https?:|\/\/)/i],
  ['<img src> loading from a website', /<img[^>]*\bsrc\s*=\s*["']?(https?:|\/\/)/i],
  ['<audio> or <video> loading from a website', /<(audio|video|source)[^>]*\bsrc\s*=\s*["']?(https?:|\/\/)/i],
  ['fetch() to a website', /\bfetch\s*\(\s*["'`](https?:|\/\/)/i],
  ['XMLHttpRequest', /XMLHttpRequest/i],
  ['Web Worker loading from a website', /new\s+Worker\s*\(\s*["'`](https?:|\/\/)/i],
  ['@import in CSS', /@import\s+(url\()?["']?(https?:|\/\/)/i],
]

for (const [what, re] of externalRefs) {
  check(`no ${what}`, !re.test(html), find(re) ?? '')
}

/* ── Nothing that needs a server ───────────────────────────────────────────── */

// ES module imports are blocked on a file:// page. This is the single most common way a
// generated game works for the model's author and not for you.
const moduleImport = /<script[^>]*\btype\s*=\s*["']module["']/i.test(html) ||
  /^\s*import\s+[\w{*]/m.test(html) ||
  /\bimport\s*\(/i.test(html)

check(
  'no ES module imports',
  !moduleImport,
  'Imports are blocked on a local file. Ask the model to remove them, or to use plain <script> instead.',
)

/* ── Nothing that is not in the file ───────────────────────────────────────── */

// A single file cannot load a file next to it. If the model wrote src="player.png" and
// did not put the image inside the file, the game loads and draws nothing.
const localRefs = [
  ['<script src> pointing at another file', /<script[^>]*\bsrc\s*=\s*["']?(?!https?:|\/\/|data:)[^"'\s>]+/i],
  ['<img src> pointing at another file', /<img[^>]*\bsrc\s*=\s*["']?(?!https?:|\/\/|data:)[^"'\s>]+/i],
  ['<audio> or <video> pointing at another file', /<(audio|video|source)[^>]*\bsrc\s*=\s*["']?(?!https?:|\/\/|data:)[^"'\s>]+/i],
  ['<link href> pointing at another file', /<link[^>]*\bhref\s*=\s*["']?(?!https?:|\/\/|data:)[^"'\s>]+/i],
]

for (const [what, re] of localRefs) {
  check(`no ${what}`, !re.test(html), find(re) ?? '')
}

/* ── It actually draws something ───────────────────────────────────────────── */

const hasCanvas = /<canvas[\s>]/i.test(html)
const hasDrawLoop = /requestAnimationFrame/i.test(html)

check('it uses a canvas', hasCanvas, 'No <canvas> found. Ask for canvas, not DOM elements.')
check('it has a draw loop', hasDrawLoop, 'No requestAnimationFrame. Nothing will move.')

/* ── It can be played without a keyboard ───────────────────────────────────── */

const hasKeys = /addEventListener\s*\(\s*["']keydown/i.test(html) || /onkeydown/i.test(html)
const hasTouch = /touchstart|touchmove|pointerdown|pointermove|click/i.test(html)

check('it listens for the keyboard', hasKeys, 'No keydown handler found.')
check(
  'it listens for touch or pointer',
  hasTouch,
  'No touch or pointer handler. This will be unplayable on a phone, which is where most people will open it.',
)

/* ── It is a reasonable size ───────────────────────────────────────────────── */

const kb = html.length / 1024
check('it is a sensible size', kb < 400, `${Math.round(kb)}KB. Ask for less, or split the game.`)

/* ── Something to say even when it passes ──────────────────────────────────── */

if (hasCanvas && hasDrawLoop) notes.push('It has a canvas and a draw loop, so it should render.')
if (!hasTouch && hasKeys) notes.push('It is keyboard-only, so it will not work on a phone.')

console.log('-'.repeat(62))
console.log(`  ${pass} passed, ${fail} failed`)
console.log('')

if (fail === 0) {
  console.log('  Nothing here says it will break. Open the file and play it.')
  console.log('')
  console.log('  This check cannot tell you whether the game is good. Only playing it can,')
  console.log('  and that is the part you have to do.')
  console.log('')
} else {
  console.log('  Something here will stop the game running. Take the failed lines back to')
  console.log('  the model, paste them in, and ask it to fix them:')
  console.log('')
  console.log('    "This check failed. Fix it, keep it one file, and do not add any')
  console.log('     libraries or links to websites."')
  console.log('')
  console.log('  That is the loop. The model writes, this checks, you send back what broke.')
  console.log('')
  process.exit(1)
}
