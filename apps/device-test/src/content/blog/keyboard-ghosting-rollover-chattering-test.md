---
title: "How to Test a Keyboard for Ghosting, Rollover and Chatter"
description: "What keyboard ghosting, key rollover (2KRO, 6KRO, NKRO) and chattering mean, and how to check for each with an online keyboard tester."
pubDate: 2026-10-18
updatedDate: 2026-10-19
draft: true
---

A key that doesn't work at all is hard to miss. Other keyboard problems are subtler: some key combinations don't register, or one press types a letter twice. These are known as ghosting, limited rollover and chattering, and you can check for all three in a few minutes with an online keyboard tester.

## What is key rollover?

Key rollover is the number of keys a keyboard can register correctly when they are held down at the same time.

- **2KRO** means the keyboard reliably registers two keys pressed together. Some basic keyboards only guarantee this, although they may handle more in certain combinations.
- **6KRO** means up to six regular keys at once, plus modifier keys such as Shift, Ctrl and Alt. The simple USB keyboard format (the "boot" format that also works in a computer's startup menus) has room for six regular keys plus the modifiers, and many USB keyboards stick to that limit.
- **NKRO** (n-key rollover) means every key can be registered at the same time, however many are pressed.

For normal typing, rollover rarely matters. It matters more in games, where you might hold several keys at once.

## What is ghosting and key blocking?

Most keyboards wire their keys in a grid of rows and columns. With certain combinations of three or more keys, the keyboard can't always tell exactly which keys are down.

- **Ghosting** strictly means the keyboard reports a key you didn't press.
- **Blocking (or jamming)** is when the keyboard ignores a key you did press, to avoid reporting a wrong one.

Most keyboards today block rather than ghost, so in practice the symptom is usually "I pressed three keys and only two showed up". People, and many manufacturers, still call this ghosting.

Keyboards sold for gaming often have "anti-ghosting" on common key groups such as W, A, S, D and the keys around them. That doesn't always mean full NKRO, and some combinations of three or more keys may still not work.

## What is key chattering?

Chattering is when one press of a key registers as two or more presses. You type "hello" and get "helllo". It is most common on mechanical keyboards and usually means:

- Dirt or debris inside the switch
- A worn or faulty switch

Chattering usually affects one or two specific keys and may get worse over time.

## How to test your keyboard online

You can use the [keyboard test](/#keyboard) on our home page, which highlights each key as you press it and keeps tested keys marked. It shows a full-size keyboard, and you can switch between the ANSI (US) and ISO (UK/EU) layouts to match yours.

The test is for physical keyboards, such as a USB or Bluetooth keyboard or a tablet keyboard case. On a phone or tablet without a keyboard it shows a message instead, because an on-screen keyboard can't be tested this way. If you connect a keyboard, press any key on it, or choose **I have a keyboard connected**, to start the test.

### Check every key works

1. Open the keyboard tester in your browser.
2. Press each key once, row by row, and check that the matching key lights up.
3. Don't forget keys you rarely use, such as Insert, Scroll Lock, the number pad and the function keys.

Some keys may not show up in any browser tester. The Fn key is usually handled inside the keyboard itself and never sends a signal to the computer. Keys used by the operating system, such as Print Screen, certain media keys or Windows key and ⌘ shortcuts, may be captured before the browser sees them. This doesn't mean those keys are broken.

### Test rollover and ghosting

1. Hold down one key, then add a second, then a third, and keep going.
2. Watch how many keys stay highlighted. Our tester also shows **Most keys at once**, the largest number of keys the browser received as held at the same time. When a key you are holding doesn't light up, you have found the limit for that combination.
3. Repeat with different groups of keys. Try combinations you actually use, such as W, A, S, D with Shift and Space for games, or Ctrl, Shift and a letter for shortcuts.

Results can differ between combinations, because the limit depends on how the keys are wired. Your operating system can also limit how many keys it passes on, so treat the number as a guide. On a Mac, releasing ⌘ resets the held count, because macOS doesn't report some key releases while ⌘ is held. If the combinations you care about all work, the keyboard is fine for your use.

### Test for chattering

Our tester checks for chatter as you type. If a key registers again less than 30 ms after it was released, which is quicker than people normally press a key twice, it is flagged as a chatter warning. Holding a key down so it repeats is not counted.

1. Type normally for a minute or so, including the keys you suspect.
2. One warning now and then is worth keeping an eye on. Repeated warnings on the same key suggest the switch needs cleaning or replacing.
3. You can also check by hand: click into a text box, press the suspect key slowly about 20 or 30 times, and count the characters. If you see more than you pressed, the key is chattering.

Browsers round event times, so the timing check is a guide rather than a lab measurement. A browser test also can't measure your keyboard's polling rate or exact response time.

## What to do about problems

- **Chattering:** Turn the keyboard off or unplug it, and blow out debris with compressed air. On a mechanical keyboard with hot-swappable switches, replacing the switch often solves it. Some keyboards' companion software or firmware has a debounce setting that may help. If the keyboard is under warranty, contact the manufacturer.
- **Limited rollover:** This is how the keyboard was built, so a setting won't change it in most cases. Some gaming keyboards have an NKRO mode in their software or a key combination to switch it on, so check your keyboard's manual.

## ANSI vs ISO layouts

Keyboards come in two common physical layouts, so it helps to know which one you have.

- **ANSI** (common in the US) has a wide, single-row Enter key, a long left Shift key and the backslash key above Enter.
- **ISO** (common in the UK and much of Europe) has a tall Enter key that spans two rows, a shorter left Shift key and an extra key between left Shift and Z.

If a tester shows a different layout from yours, a key may light up in a slightly different place, or the extra ISO key may not appear at all. On our keyboard test, choose ISO if your Enter key is tall so every key can be shown.
