# AI Game Starter

Everything you need to make a small game that uses an AI model. Written for someone
who is 13 or older and can already write a bit of code.

**Not** a course, and **not** a list of tools. Four short lessons and one working
example, in the order that saves you the most time.

---

## What this is

A game that uses an AI model is not magic and it is not hard. It is a normal program
that sends some text somewhere and gets text back.

The hard parts are not the code. They are:

1. **Understanding what a model actually is**, so you stop expecting it to know things.
2. **Not putting a secret key where anyone can steal it**, which is the mistake that
   turns a fun project into somebody else's bill.
3. **Making your game work when the model does not answer**, because it will not,
   sometimes.
4. **Making the thing check itself**, because a model will tell you it is finished
   whether or not it is.

This repo covers those four, in that order.

## What this is not

- **Not a course on AI.** It does not explain how a transformer works. You do not need
  that to build something, and you can learn it later.
- **Not a list of the best tools.** Tools change every month. The shape of the code
  does not.
- **Not finished.** Four lessons and one example is a start, not everything. See
  **What is missing** at the bottom.
- **Not a promise that any of this is safe to put online.** The example server is for
  learning on your own computer.

---

## Start here

You need [Node.js](https://nodejs.org) version 18 or newer. That is the only thing you
must install.

```bash
node lessons/02-your-first-call.mjs
```

**Run that before reading anything else.** It works with no setup, no account, and no
API key. It prints an answer either way.

Then read, in this order:

| | |
|---|---|
| [`lessons/01-what-a-model-is.md`](lessons/01-what-a-model-is.md) | The one idea that explains everything else |
| [`lessons/02-your-first-call.mjs`](lessons/02-your-first-call.mjs) | Your first call to a model, runnable now |
| [`lessons/03-the-key-problem.md`](lessons/03-the-key-problem.md) | Why a web game cannot hold a key |
| [`examples/word-game/`](examples/word-game/) | A real game that uses a model |

---

## The short version, if you read nothing else

**A model predicts what text comes next. It does not know things.**

That single sentence explains why it makes up facts, why it agrees with you, and why
it cannot tell you when it is out of its depth. Everything else in this repo follows
from it.

**Never put an API key in a web page.** Anyone who opens the developer tools can read
it. If your game runs in a browser, the key must live on a server you control.

**Always have an answer when the model does not.** No internet, no credit, a slow
answer - your game should keep working. The first example shows how.

**Make the thing check itself.** Not by asking the model if it is right. It will say
yes.

---

## Running the example

The word game needs a model to be interesting, but it runs without one so you can see
it work first.

```bash
cd examples/word-game
node server.mjs
# open http://localhost:3000
```

With no model configured it plays a simple built-in version. To use a real model, see
[`lessons/02-your-first-call.mjs`](lessons/02-your-first-call.mjs) for how to point it
at one - either a model on your own computer, or a paid one.

---

## Checking this repo still works

Every example here is run by a script, because **an example that does not run is worse
than no example**: you will assume you did something wrong.

```bash
node scripts/verify.mjs
```

If that fails, the repo is broken, not you.

---

## What is missing

Honest list, so you know what you are not getting:

- **No art or sound lessons.** This is about the AI part.
- **No deployment.** Running it on your own computer is the whole scope. Putting a game
  online with a key in it is a different, harder problem, and lesson 3 only explains
  why it is hard.
- **No prompt engineering guide.** Prompts matter, but a list of tricks goes stale and
  this repo is about the code around the model.
- **No fine-tuning, embeddings, or agents.** Those come after you have built one small
  thing that works.

---

## Licence

MIT. Take it, change it, use it in your own project.
