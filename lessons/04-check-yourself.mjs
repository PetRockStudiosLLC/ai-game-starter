#!/usr/bin/env node
/**
 * 4. Make the thing check itself.
 *
 * Run it now:
 *
 *     node lessons/04-check-yourself.mjs
 *
 * It works with no setup, no account and no API key, and it still teaches the point
 * when no model answers. That is on purpose - see the bottom of this file.
 *
 * WHAT THIS LESSON IS REALLY ABOUT
 * Lesson 2 ended with a promise: your program must have an answer when the model does
 * not. This lesson is the other half of that promise, and it is the one people skip.
 *
 * A model will give you a confident wrong answer. Not often enough to notice, and not
 * rarely enough to ignore. There is only one reliable way to catch it:
 *
 *     write a check in code, and never ask the model whether it was right.
 *
 * Asking it is the mistake everybody makes first. It will say yes. It said the wrong
 * thing with confidence, and it will defend it with the same confidence, because it has
 * no idea whether it is right. A wrong answer and a right one feel identical from the
 * inside.
 *
 * So this lesson gives a model a job with a knowable answer - adding up a shopping
 * basket - and then checks it the way you would check a person's homework. With a sum.
 */

// ── Where a model might be ───────────────────────────────────────────────────
//
// Same three as lesson 2. Kept here so this file runs on its own.
const LOCAL_MODELS = [
  { name: 'Ollama', url: 'http://127.0.0.1:11434/v1/chat/completions' },
  { name: 'LM Studio', url: 'http://127.0.0.1:1234/v1/chat/completions' },
  { name: 'llama.cpp', url: 'http://127.0.0.1:8080/v1/chat/completions' },
]

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const apiKey = process.env.OPENAI_API_KEY

// ── The job ──────────────────────────────────────────────────────────────────
//
// Prices in cents, so the arithmetic is exact. Money in floating point is its own
// lesson, and it is not this one.
const BASKET = [
  { item: 'two loaves of bread at $3.49 each', cents: 349 * 2 },
  { item: 'a bag of apples at $4.25', cents: 425 },
  { item: 'three tins of soup at $1.79 each', cents: 179 * 3 },
  { item: 'a chocolate bar at $1.15', cents: 115 },
]

/** What the total actually is. Code works this out. Nothing else does. */
const TRUTH = BASKET.reduce((sum, row) => sum + row.cents, 0)

/** The question, written the way a person would ask it. */
const QUESTION = [
  'Add up this shopping list and give me the total.',
  '',
  ...BASKET.map((row) => `- ${row.item}`),
  '',
  'Reply with the total in dollars and cents, on its own line, and nothing else.',
].join('\n')

/** Ask a model a question. Returns null when nothing answers. */
async function ask(question) {
  for (const model of LOCAL_MODELS) {
    const answer = await call(model.url, question, null, model.name)
    if (answer) return answer
  }
  if (apiKey) {
    const answer = await call(OPENAI_URL, question, apiKey, 'OpenAI')
    if (answer) return answer
  }
  return null
}

async function call(url, question, key, label) {
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
        // Low, because we want its best attempt at a sum, not its most creative one.
        temperature: 0,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    return text ? { text: text.trim(), from: label } : null
  } catch {
    return null
  }
}

// ── The check ────────────────────────────────────────────────────────────────

/**
 * Pull the first money-looking number out of whatever the model wrote.
 *
 * THIS IS REAL WORK AND PEOPLE FORGET IT. You asked for a bare number and you will not
 * get one. You will get "The total is $18.42." or a whole paragraph with the answer
 * buried in it. Reading a value back out of prose is a normal part of using a model,
 * and it is the step where a program quietly breaks.
 *
 * Returns null when there is no number at all, which is a different failure from a
 * wrong number, and worth telling apart.
 */
function readMoney(text) {
  const match = text.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)
  if (!match) return null
  return Math.round(parseFloat(match[1]) * 100)
}

/** Format cents the way a price looks. */
const money = (cents) => `$${(cents / 100).toFixed(2)}`

// ── Run it ───────────────────────────────────────────────────────────────────

console.log('')
console.log('  the basket:')
for (const row of BASKET) console.log(`    ${money(row.cents).padStart(7)}  ${row.item}`)
console.log(`    ${'-'.repeat(7)}`)
console.log(`    ${money(TRUTH).padStart(7)}  <- what code works out`)
console.log('')

const answer = await ask(QUESTION)

// When no model answers, use a plausible wrong answer anyway.
//
// THIS IS NOT A CHEAT. The lesson is about the check, and a check that only runs when
// you have a model installed is a check most readers never see work. This number is the
// kind of thing a model produces: close, confident, and wrong.
const reply = answer ?? {
  text: `The total is ${money(TRUTH + 88)}.`,
  from: 'a stand-in (no model answered)',
}

console.log(`  ${reply.from} said:`)
console.log('')
console.log(`    ${reply.text.replace(/\n/g, '\n    ')}`)
console.log('')

// ── The check, which is the whole lesson ─────────────────────────────────────

const said = readMoney(reply.text)

console.log('  ── now the part that matters ────────────────────────────────')
console.log('')

if (said === null) {
  console.log('  There is no number in that reply at all.')
  console.log('')
  console.log('  This is a different failure from a wrong number, and you have to handle')
  console.log('  both. A program that assumes a number is there will crash on this one.')
} else if (said === TRUTH) {
  console.log(`  It said ${money(said)}. Code says ${money(TRUTH)}. They match.`)
  console.log('')
  console.log('  It got it right this time. That is the hard case, not the easy one.')
  console.log('  A model that is right nine times out of ten is the reason people stop')
  console.log('  checking - and the tenth time is the one that reaches your players.')
} else {
  console.log(`  It said ${money(said)}. Code says ${money(TRUTH)}.`)
  console.log('')
  console.log(`  Wrong by ${money(Math.abs(said - TRUTH))}, and it said so with total confidence.`)
  console.log('')
  console.log('  Nothing in that reply looked uncertain, because nothing in it was. A model')
  console.log('  has no way to tell a right answer from a wrong one. The check is the only')
  console.log('  thing in this whole file that knows.')
}

console.log('')
console.log('  ── what NOT to do ──────────────────────────────────────────')
console.log('')
console.log('  Do not ask the model if it was right. It will say yes. It is not lying;')
console.log('  it has no idea. Asking is how you turn one wrong answer into two.')
console.log('')

// ── Where this lives in the example ──────────────────────────────────────────

console.log('  ── this is not a toy ───────────────────────────────────────')
console.log('')
console.log('  examples/word-game/ does exactly this, with the parts swapped:')
console.log('')
console.log('    the model  writes the clue      <- creative, no single right answer')
console.log('    the code   checks the guess     <- exact, one right answer')
console.log('')
console.log('  The model never decides whether a guess is correct, because a model asked')
console.log('  that question agrees with whoever asked. A string comparison decides, and')
console.log('  it cannot be talked out of it.')
console.log('')
console.log('  That split is the shape of every project on this repo:')
console.log('')
console.log('    the model writes, the code checks.')
console.log('')
console.log('  ── three rules, in order ───────────────────────────────────')
console.log('')
console.log('    1. Never ask the model whether it was right.')
console.log('    2. Decide the answer in code, or with a person, or not at all.')
console.log('    3. Say so when you cannot check. "I do not know" is a real answer.')
console.log('')
