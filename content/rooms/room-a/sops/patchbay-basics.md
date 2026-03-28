# Patchbay Basics — Room A

The patchbay is the central routing point for audio signals in Room A. It looks intimidating, but the concept is simple: it lets you connect any input to any output without re-wiring anything behind the rack.

## What is a patchbay?

Think of it as a switchboard. Every input (from wall plates, mics, instruments) and every output (to preamps, converters, effects) terminates at a jack on the patchbay. You use short TT (tiny telephone) patch cables to connect them however you want.

## Layout

The patchbay in Room A is a 48-point unit mounted in the rack on the left wall.

- **Top row**: Inputs from the room (wall plates, direct boxes, etc.)
- **Bottom row**: Destinations (preamp inputs, interface inputs, effects sends)

Each vertical pair (one top, one bottom) is a "normalled" connection.

## What does "normalled" mean?

The patchbay is **half-normalled**. That means:

- By default, the top row jack feeds straight down to the bottom row jack below it — no cable needed
- If you plug a cable into the **bottom** row jack, it breaks the normal and replaces the signal with whatever you're patching in
- If you plug a cable into the **top** row jack, the signal still flows down to the bottom (the normal isn't broken), AND you can also send it somewhere else — essentially splitting the signal

In plain English: the top row is a "mult" (you can tap it without interrupting), and the bottom row is an "override" (plugging in replaces the default signal).

## Default connections

Here's what's normalled in Room A:

| Top row (Source)         | Bottom row (Destination)  |
|--------------------------|---------------------------|
| Slot 1 — Wall Input 1   | Slot 1 — API 512c input   |
| Slot 2 — Wall Input 2   | Slot 2 — Neve 1073 input  |
| Slot 3 — Wall Input 3   | Slot 3 — Spare (unused)   |

So if you plug a mic into Wall Input 1, it automatically feeds the API 512c. No patch cable required.

## How to re-route a signal

**Example: You want Wall Input 1 to go to the Neve 1073 instead of the API 512c.**

1. Grab a TT patch cable from the cable drawer
2. Plug one end into **Top row, slot 1** (Wall Input 1)
3. Plug the other end into **Bottom row, slot 2** (Neve 1073 input)

That's it. The signal from Wall Input 1 now goes to the Neve. Because the top row is half-normalled, the signal also still flows to the API 512c below it (slot 1) — but if nothing is using that preamp, it doesn't matter.

**Example: You want to use a DI box straight into the Neve 1073.**

1. Plug your instrument into the DI box
2. Run an XLR from the DI box output to any open wall plate input (say Input 3)
3. On the patchbay, patch **Top row, slot 3** to **Bottom row, slot 2** (Neve 1073)

## Common patches

| I want to...                              | Patch this                                      |
|-------------------------------------------|-------------------------------------------------|
| Use a different preamp for my mic         | Top row (your input) → Bottom row (desired preamp) |
| Split one mic to two preamps              | Just plug into the top row — normal still feeds the default, and your cable goes to the second preamp |
| Bypass the patchbay entirely              | Plug your XLR directly into the preamp's rear input (if accessible) |
| Send a signal to an outboard effect       | Top row (source) → Effect input; Effect output → Bottom row (return destination) |

## Tips

- **Push cables in firmly.** A loose TT connection is the #1 cause of intermittent signal and weird crackling. Push until it clicks.
- **Label your patches.** If you're doing a complex session with multiple re-routes, use tape and a marker to label which cable goes where. Future you will thank present you.
- **Don't force it.** TT jacks are small. If a cable isn't going in, make sure you're using TT cables (not 1/4" — they look similar but TT is smaller).
- **Keep it tidy.** Route patch cables neatly. A rat's nest of cables makes troubleshooting miserable.
- **When in doubt, remove all patch cables.** The normalled connections will restore, and you're back to the default signal flow.
