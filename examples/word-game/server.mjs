#!/usr/bin/env node
/**
 * Word Game — a small game that uses a model, safely.
 *
 *     node server.mjs
 *     open http://localhost:3000
 *
 * It works with no model, no account and no key. With a model it gives better clues.
 *
 * THREE THINGS THIS FILE GETS RIGHT, AND WHY
 *
 * 1. THE KEY NEVER REACHES THE BROWSER.
 *    It is read from an environment variable here and used here. The page that the
 *    player loads contains no secret at all. See lesson 3.
 *
 * 2. THE ANSWER NEVER REACHES THE BROWSER EITHER.
 *    The secret word stays on the server until the player gets it. If the word were
 *    sent to the page, anyone could open the developer tools and read it - which is
 *    the same mistake as the key, one step less obvious.
 *
 * 3. THE GUESS IS CHECKED BY CODE, NOT BY ASKING THE MODEL.
 *    This is the important one. The model writes the clue, which is a creative job.
 *    The model does NOT decide whether a guess is right, because a model will agree
 *    with you. A plain string comparison decides, and it cannot be talked out of it.
 *
 * That split - model writes, code checks - is the whole idea. Everything in
 * `lessons/01-what-a-model-is.md` leads here.
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3000

// ── Where a model might be ───────────────────────────────────────────────────
//
// The same list as lesson 2. Local first, because you cannot leak a key you never made.

const LOCAL_MODELS = [
  'http://127.0.0.1:11434/v1/chat/completions',
  'http://127.0.0.1:1234/v1/chat/completions',
  'http://127.0.0.1:8080/v1/chat/completions',
]
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const apiKey = process.env.OPENAI_API_KEY

// ── The words ────────────────────────────────────────────────────────────────
//
// A list the server controls, so it can check a guess without asking anybody.
// Each word carries a fallback clue, so the game is playable with no model at all.

const WORDS = JSON.parse(readFileSync(resolve(ROOT, 'words.json'), 'utf8'))

// ── One game at a time ───────────────────────────────────────────────────────
//
// A real game would keep this per player. For a lesson, one game is easier to read,
// and the point is the shape, not the bookkeeping.

let game = null

function newGame() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  game = { word, guesses: 0, solved: false }
  return word
}

/** Ask a model for a clue. Returns null when nothing answers. */
async function askForClue(word) {
  const question =
    `Write one short clue for a guessing game. The answer is "${word.word}". ` +
    `Do not use the word itself or any part of it. One sentence, no more than 12 words.`

  for (const url of LOCAL_MODELS) {
    const clue = await call(url, question, null)
    if (clue) return clue
  }
  if (apiKey) {
    const clue = await call(OPENAI_URL, question, apiKey)
    if (clue) return clue
  }
  return null
}

async function call(url, question, key) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  }
}

/**
 * A clue must not contain the answer.
 *
 * The model was told not to, and mostly will not. "Mostly" is not good enough for a
 * game - a clue containing the word ends the game instantly - so this is checked, and
 * a bad clue falls back to the built-in one.
 */
function clueIsSafe(clue, word) {
  if (!clue) return false
  const cleaned = clue.toLowerCase()
  return !cleaned.includes(word.word.toLowerCase())
}

// ── The server ───────────────────────────────────────────────────────────────

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // ── The page ───────────────────────────────────────────────────────────────
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = readFileSync(resolve(ROOT, 'public/index.html'), 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  // ── A new game ─────────────────────────────────────────────────────────────
  if (url.pathname === '/api/new') {
    const word = newGame()

    const modelClue = await askForClue(word)
    const usedModel = clueIsSafe(modelClue, word)
    const clue = usedModel ? modelClue : word.clue

    // NOTE WHAT IS NOT IN THIS RESPONSE: the word. It stays here.
    json(res, 200, {
      clue,
      letters: word.word.length,
      fromModel: usedModel,
    })
    return
  }

  // ── A guess ────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/guess') {
    let body = ''
    for await (const chunk of req) body += chunk
    let guess = ''
    try { guess = String(JSON.parse(body || '{}').guess ?? '') } catch { /* ignored */ }

    if (!game) return json(res, 400, { error: 'Start a game first.' })

    // The only thing the browser is allowed to send is one word. Not a file path, not
    // a URL, not a command. That is the whole input surface, and it is deliberate.
    const cleaned = guess.trim().toLowerCase().replace(/[^a-z]/g, '')
    if (!cleaned) return json(res, 400, { error: 'Guess something.' })

    game.guesses++

    // A plain comparison decides. Not the model. It cannot be talked into agreeing.
    const correct = cleaned === game.word.word.toLowerCase()
    if (correct) game.solved = true

    json(res, 200, {
      correct,
      guesses: game.guesses,
      // Only now does the word go over the wire, because the game is over.
      ...(correct ? { word: game.word.word } : {}),
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log('')
  console.log(`  Word game running at http://localhost:${PORT}`)
  console.log('')
  console.log(`  model: ${apiKey ? 'local models, then OpenAI' : 'local models only (no OPENAI_API_KEY set)'}`)
  console.log('  the game works either way. It just gives canned clues with no model.')
  console.log('')
})
