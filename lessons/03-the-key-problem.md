# 3. The key problem

This is the lesson that stops a fun project becoming somebody else's bill. Read it
before you put anything online.

## What a key is

To use a paid model, the company needs to know it is you, so it can charge you. They
give you a long random string called an **API key**. It looks like this:

```
sk-proj-Ab3xK9mQ7vL2nR8tY5wZ1cF4hJ6pD0sG...
```

**That string is money.** Anyone who has it can use your account until you notice and
turn it off. There is no password on top of it. The key *is* the password.

## The mistake almost everyone makes

You build a game. It runs in a browser. You need to call a model, so you put your key
in the JavaScript:

```js
// ✗ WRONG. Do not do this.
const KEY = 'sk-proj-Ab3xK9mQ7vL2nR8tY5wZ1cF4hJ6pD0sG...'

fetch('https://api.openai.com/v1/chat/completions', {
  headers: { Authorization: `Bearer ${KEY}` },
  ...
})
```

**This does not work, and it never has.** Everything a browser runs is downloaded to
the person using it. Press F12, open the Network tab, and your key is sitting there in
plain text. So is anyone else's who used your page.

People write scripts that scan public websites for keys like this. Yours will be found
in hours.

**A key in a web page is a key you have given away.**

## What to do instead

The key lives on a computer you control, and your game asks *that* for an answer. The
browser never sees the key.

```
   ✗ what people try                    ✓ what works

   browser                             browser
      |  key inside                       |  no key, just a question
      v                                   v
   model company                       your small server
                                           |  key lives here, in an environment variable
                                           v
                                       model company
```

That is exactly what [`examples/word-game/`](../examples/word-game/) does. Read
`server.mjs` after this - it is about forty lines, and the important part is one line:

```js
const apiKey = process.env.OPENAI_API_KEY
```

`process.env` reads a value from outside the code. The key is not written down in any
file, so there is nothing to accidentally upload or paste into a chat.

## The rules, in order of how much they matter

**1. Never write a key in a file you share.** Not in JavaScript, not in Python, not in
a config file, not in a screenshot, not in a Discord message. If it was in a file you
committed to GitHub, it is public - even if you delete it afterwards, because the
history keeps it.

**2. Keep it in an environment variable.** Then the file can be shared freely and the
key stays yours.

**3. If a key ever leaks, turn it off immediately.** Every company has a page for this.
Turning it off takes ten seconds. Hoping nobody noticed does not work.

**4. Start with a free or local model.** You cannot leak a key you never made.
Ollama runs a model on your own computer with no account and no key at all. That is
why [lesson 2](02-your-first-call.mjs) tries local models first.

**5. Set a spending limit.** Even with all of this, a bug can call a model in a loop.
Most companies let you set a hard monthly cap. Set one before you need it.

## One more thing people forget

Your key is not the only secret. **Anything the model is allowed to do is a secret
too.** If your server can read files, and your game can ask it to, then your game can
read files.

The example server takes one string from the browser and nothing else. It does not take
a file path, a URL, or a command. That is not laziness - it is the whole security model.

---

Next: [the word game](../examples/word-game/) - a real game that does all of this.
