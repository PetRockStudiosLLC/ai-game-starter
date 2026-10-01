# 1. What a model actually is

Five minutes. Read this first, because everything else makes sense afterwards.

## It predicts. It does not know.

A language model has read an enormous amount of text and learned one skill: **given
some text, what probably comes next?**

That is all. There is no lookup, no database of facts, no checking. When you ask a
question, it produces the words that would most plausibly follow your question.

Most of the time, that looks like an answer.

## Why that explains everything

**Why it makes things up.** If the most plausible-looking next words are a book title
and an author, it will produce a book title and an author. It does not matter that the
book does not exist. A fake citation looks exactly like a real one, so it has no way to
notice, and neither do you unless you check.

This has a name: **hallucination**. It is not lying. Lying needs knowing the truth.

**Why it agrees with you.** If you say "isn't it true that X", the plausible next words
are the ones that agree. It is not being polite or dishonest. Agreeing is just what
usually comes next.

**Why it sounds confident about things it is bad at.** Confidence is a writing style,
not a signal. It learned that style from text where people were sure of themselves. The
confidence does not go down when it is wrong, because it does not know it is wrong.

**Why it cannot say "I do not know".** It could - those are plausible words too - but
nothing tells it when to. There is no moment where it notices it is out of its depth.

## What this means for your game

**You cannot trust the output. You can only check it.**

That is the whole job. A game that uses a model is a game that wraps a guess in enough
checking that the guess does not matter.

Some ways to check, from easy to hard:

| check | example |
|---|---|
| Compare against a list you control | "the answer must be one of these 50 words" |
| Ask it to answer in a shape you can read | "reply with only a number" |
| Try it twice and see if it agrees | cheap, and catches the worst guesses |
| Have a person look | slow, but works |
| Have a test that can fail | the real answer - see lesson 4 |

## One thing to try

Ask a model for a fact you can check yourself, something you already know for certain.
Then check it.

Do that a few times and you will stop expecting it to know things, which is the point
of this lesson.

---

Next: [your first call](02-your-first-call.mjs) - runnable right now, no setup.
