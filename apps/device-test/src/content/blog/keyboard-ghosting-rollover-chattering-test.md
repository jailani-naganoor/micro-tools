---
title: "How to Test a Keyboard for Ghosting, Rollover and Chatter"
description: "What keyboard ghosting, key rollover (2KRO, 6KRO, NKRO) and chattering mean, and how to check for each with an online keyboard tester."
pubDate: 2026-10-18
draft: true
---

A key that doesn't work at all is hard to miss. Other keyboard problems are subtler: some key combinations don't register, or one press types a letter twice. These are known as ghosting, limited rollover and chattering, and you can check for all three in a few minutes with an online keyboard tester.

## What is key rollover?

Key rollover is the number of keys a keyboard can register correctly when they are held down at the same time.

- **2KRO** means the keyboard reliably registers two keys pressed together. Some basic keyboards only guarantee this, although they may handle more in certain combinations.
- **6KRO** means up to six regular keys at once, usually plus modifier keys such as Shift, Ctrl and Alt. Many USB keyboards work this way because of the standard simple USB keyboard report format.
- **NKRO** (n-key rollover) means every key can be registered at the same time, however many are pressed.

For normal typing, rollover rarely matters. It matters more in games, where you might hold several keys at once.

## What is ghosting and key blocking?

Most keyboards wire their keys in a grid of rows and columns. With certain combinations of three or more keys, the keyboard can't always tell exactly which keys are down.

- **Ghosting** is when the keyboard reports a key you didn't press.
- **Blocking (or jamming)** is when the keyboard ignores a key you did press, to avoid reporting a wrong one.

Most modern keyboards use blocking rather than ghosting, so in practice the symptom is usually "I pressed three keys and only two showed up". People often still call this ghosting.

Keyboards sold for gaming often have "anti-ghosting" on common key groups such as W, A, S, D and the keys around them. That doesn't always mean full NKRO.

## What is key chattering?

Chattering is when one press of a key registers as two or more presses. You type "hello" and get "helllo". It is most common on mechanical keyboards and usually means:

- Dirt or debris inside the switch
- A worn or faulty switch

Chattering usually affects one or two specific keys and tends to get worse over time.

## How to test your keyboard online

You can use the [keyboard test](/#keyboard) on our home page, which highlights each key as you press it.

### Check every key works

1. Open the keyboard tester in your browser.
2. Press each key once, row by row, and check that the matching key lights up.
3. Don't forget keys you rarely use, such as Insert, Scroll Lock, the number pad and the function keys.

Some keys may not show up in any browser tester. The Fn key is usually handled inside the keyboard itself and never sends a signal to the computer. Keys used by the operating system, such as the Windows key or certain media keys, may be captured before the browser sees them. This doesn't mean those keys are broken.

### Test rollover and ghosting

1. Hold down one key, then add a second, then a third, and keep going.
2. Watch how many keys stay highlighted. When a new key doesn't appear, you have found the limit for that combination.
3. Repeat with different groups of keys. Try combinations you actually use, such as W, A, S, D with Shift and Space for games, or Ctrl, Shift and a letter for shortcuts.

Results can differ between combinations, because the limit depends on how the keys are wired. If the combinations you care about all work, the keyboard is fine for your use.

### Test for chattering

1. Click into a text box, or use a tester that counts presses.
2. Press the suspect key slowly, one press at a time, around 20 or 30 times.
3. Count the characters that appear. If you see more than you pressed, the key is chattering.

## What to do about problems

- **Chattering:** Turn the keyboard off or unplug it, and blow out debris with compressed air. On a mechanical keyboard with hot-swappable switches, replacing the switch often solves it. Some keyboard software has a debounce setting that can help. If the keyboard is under warranty, contact the manufacturer.
- **Limited rollover:** This is how the keyboard was built, so a setting won't change it in most cases. Some gaming keyboards have an NKRO mode in their software or a key combination to switch it on, so check your keyboard's manual.

## ANSI vs ISO layouts

Keyboard testers usually show one layout, so it helps to know which one you have.

- **ANSI** (common in the US) has a wide, single-row Enter key, a long left Shift key and the backslash key above Enter.
- **ISO** (common in the UK and much of Europe) has a tall Enter key that spans two rows, a shorter left Shift key and an extra key between left Shift and Z.

If the tester shows a different layout from yours, a key may light up in a slightly different place, or the extra ISO key may appear somewhere else on screen. This is normal.
