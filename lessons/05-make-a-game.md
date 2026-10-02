# 5. Make a game with one prompt

Lessons 1 to 4 are about putting a model **inside** a game. This one is different, and
it is the fastest way to get something on screen: get a model to **write the game for
you**, as one file, and play it in a browser.

**Read this first, because it is easy to misunderstand:**

> **This lesson does not put AI in your game.** The model writes the code, and then it
> is gone. What you end up with is a normal game that happens to have been written by a
> model. That is useful and it is not the same thing.
>
> If you want the model to be part of the game while somebody plays it, that is lessons
> 3 and 4, and it needs a server. A single file cannot hold a key.

---

## Do this

**1. Copy the prompt.** It is in this repo:

[`prompts/make-a-game.txt`](../prompts/make-a-game.txt)

Open it, select all of it, and copy it.

**2. Paste it into any chatbot.** ChatGPT, Claude, Gemini, a model on your own computer.
Any of them. The prompt asks for the same thing from all of them.

**3. Save the reply as a file.** The model will give you a block of HTML. Copy it into a
new file called `my-game.html`. Keep the `.html` ending, or a browser will not open it
as a page.

**4. Open the file.** Double-click it. It should run.

**5. Check it.** This is the part people skip:

```
node scripts/check-my-game.mjs my-game.html
```

---

## Why the check matters

The model wrote the file. The check decides whether it runs. That is the same split as
the word game, and this time you are the one running it.

The check looks for the things that make a single file fail on a normal computer:

| What it catches | Why it breaks |
| --- | --- |
| A link to a website | Needs the internet. On a train, your game is a blank page. |
| A file next to it, like `player.png` | The file is not there. The game runs and draws nothing. |
| An ES module import | Blocked on a local file. This is the most common one. |
| No touch controls | Unplayable on a phone, which is where most people will open it. |
| No canvas, no draw loop | Nothing renders, or nothing moves. |

**It cannot tell you whether the game is fun.** Only playing it can do that, and that
part is yours.

---

## The loop

When the check fails, do not start over. Paste the failures back to the model:

> This check failed. Fix it, keep it one file, and do not add any libraries or links to
> websites.

Then save, open, and check again. That loop — **model writes, you run it, the check says
what broke, you send it back** — is how people actually work with these things.

It is also the whole point of this repo. Not "the model is magic", and not "the model is
useless". It is a step in a loop that a person is running.

---

## If you want to change the game

Edit the prompt, not the code.

Change `a simple arcade game where the player moves something left and right at the
bottom of the screen and catches or avoids falling things` to whatever you want. Keep
all eight rules at the top. **The rules are the part that makes it work** — without them
you get a game that needs four files, a build step and the internet.

Try it again with:

- a game where you dodge things instead of catching them
- a game with a timer instead of a score
- a game where the difficulty comes from something shrinking

---

## What this does not cover

- **No AI in the game.** Covered above, and it is worth repeating.
- **No art or sound.** The prompt asks the model to draw everything itself. That keeps
  it to one file and it looks like coloured rectangles. Making it look good is a
  different job.
- **No saving or high scores.** A single file can use `localStorage`, but the prompt
  asks for one mechanic only.
- **No publishing.** Getting a game onto a website is a separate problem, and putting a
  key on a website is the problem lesson 3 exists to warn you about.

---

## Next

If you got a game running and you want the model **inside** it, go back to
[`examples/word-game/`](../examples/word-game/) and read
[`lessons/03-the-key-problem.md`](03-the-key-problem.md). That is the step from "a model
wrote my game" to "a model is part of my game", and it is a real step, not a small one.
