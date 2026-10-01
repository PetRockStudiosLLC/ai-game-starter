#!/usr/bin/env node
/**
 * 2. Your first call to a model.
 *
 * Run it now:
 *
 *     node lessons/02-your-first-call.mjs
 *
 * It works with no setup, no account and no API key. It will find a model if you have
 * one, and explain what to do if you do not.
 *
 * WHAT THIS LESSON IS REALLY ABOUT
 * Not the API. The API is four lines. This is about the three things around it that
 * actually decide whether your project works:
 *
 *   1. One piece of code can talk to a model on your computer AND a paid one online,
 *      because they speak the same language. You do not have to choose up front.
 *   2. A key never goes in code you share. It goes in an environment variable.
 *   3. Your program must have an answer when the model does not. Every time.
 */

// ── Where a model might be ───────────────────────────────────────────────────
//
// All of these speak the same API. That is the useful part: the code below does not
// care which one answers.
//
//   11434  Ollama, the easiest way to run a model yourself
//   1234   LM Studio, the same thing with a window
//   8080   llama.cpp, the one underneath both
//
const LOCAL_MODELS = [
  { name: 'Ollama', url: 'http://127.0.0.1:11434/v1/chat/completions' },
  { name: 'LM Studio', url: 'http://127.0.0.1:1234/v1/chat/completions' },
  { name: 'llama.cpp', url: 'http://127.0.0.1:8080/v1/chat/completions' },
]

// A paid model, used only if you set the key yourself.
//
// THIS IS THE IMPORTANT LINE. `process.env` reads a value from outside your code, so
// the key is never written down anywhere you might share. Lesson 3 explains why.
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const apiKey = process.env.OPENAI_API_KEY

/** Ask a model a question. Returns null when nothing answers. */
async function ask(question) {
  // Try each local model in turn.
  for (const model of LOCAL_MODELS) {
    const answer = await call(model.url, question, null, model.name)
    if (answer) return answer
  }

  // Then the paid one, but only if a key was provided.
  if (apiKey) {
    const answer = await call(OPENAI_URL, question, apiKey, 'OpenAI')
    if (answer) return answer
  }

  return null
}

/**
 * One call.
 *
 * Every model that speaks this API wants the same three things: which model to use,
 * the messages so far, and how creative to be. That is the whole request.
 */
async function call(url, question, key, label) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        // 'gpt-4o-mini' works for the paid one. A local model usually ignores this and
        // uses whatever you have loaded, so a wrong name here is not fatal.
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
        temperature: 0.7,
      }),
      // A model that has not answered in 20 seconds is not going to be fun in a game.
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) return null
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    return text ? { text: text.trim(), from: label } : null
  } catch {
    // Not running, refused, slow, offline - all the same to us. Try the next one.
    return null
  }
}

// ── Run it ───────────────────────────────────────────────────────────────────

const question = process.argv[2] || 'In one sentence, what is a variable in programming?'

console.log('')
console.log(`  asking: ${question}`)
console.log('')

const answer = await ask(question)

if (answer) {
  console.log(`  ${answer.from} said:`)
  console.log('')
  console.log(`    ${answer.text.replace(/\n/g, '\n    ')}`)
  console.log('')
} else {
  // THIS IS THE LESSON, NOT AN ERROR.
  //
  // No model answered. In a real game this is a Tuesday. Your options are: say so,
  // use something built in, or try again later. Crashing is not one of them.
  console.log('  No model answered, so here is the honest fallback.')
  console.log('')
  console.log('    A variable is a name for a value your program can change later.')
  console.log('')
  console.log('  ── how to get a real answer ──────────────────────────────────')
  console.log('')
  console.log('  Run a model on your own computer (free, no account):')
  console.log('    1. Install Ollama from ollama.com')
  console.log('    2. In a terminal:  ollama pull llama3.2')
  console.log('    3. Run this file again')
  console.log('')
  console.log('  Or use a paid model:')
  console.log('    Set an environment variable called OPENAI_API_KEY, then run again.')
  console.log('    Never paste the key into this file. See lesson 3.')
  console.log('')
}
