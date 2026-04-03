# Synths and MIDI

How to use the studio's synth collection, route their audio into the DAW, and set up MIDI so they actually play.

## The synths

| Synth | Notes |
|-------|-------|
| **Prophet** | Line-level output — loud enough to bypass a preamp and go straight to the A/D via the TRS patchbay. |
| **Roland JX-8P** | Classic analog polysynth. |
| **Yamaha SY-77** | Powerful FM/AWM hybrid. Left off by default because it emits a high-frequency noise when powered on. Only turn it on when you need it. |
| **Oberheim Matrix 1000s** | Rack-mount analog synths. **No keyboard** — they can only be played via MIDI from another synth or controller. They have a mechanical noise when powered on, so they're left off by default. |

There are additional synths in the studio — these are the main ones you'll encounter.

## Audio routing

The synths are connected to the **TRS patchbay**, not the Bantam bay. Since synths output at line level, you have two options:

### Option A: Straight to A/D (bypass the preamp)

1. Find the synth's output on the TRS patchbay
2. Patch from the TRS bay to the **bottom row** of the Bantam bay (an A/D input)
3. This breaks the normal and sends the synth signal straight to the converter
4. Arm the corresponding channel in your DAW

This is the cleanest path. Good for the Prophet and other synths with strong output levels.

### Option B: Through a preamp (for color)

1. Patch from the TRS bay to a preamp input (or use a cable from the synth output directly to the preamp)
2. The preamp output flows through the Bantam bay to the A/D as normal
3. Use this when you want the preamp to add character — 1073s on a synth pad can sound incredible

## MIDI routing

MIDI is managed through **Oracle X** software on the Mac Mini.

### Basic concept

Oracle X handles all MIDI routing between the synths, the DAW, and any MIDI controllers. You set up which MIDI device talks to which synth, and on which MIDI channel.

### Playing the Oberheim Matrix 1000s

The Matrix 1000s don't have keyboards — they're rack units. To play them:

1. Open Oracle X on the Mac Mini
2. Route MIDI output from a keyboard synth (like the Prophet) to the Matrix 1000's MIDI input
3. Set the MIDI channel to match what the Matrix 1000 is listening on
4. Play the Prophet keyboard — the notes trigger the Matrix 1000's sounds
5. Make sure the Matrix 1000s are actually powered on (they're off by default — flip their power switches)
6. Patch the Matrix 1000 audio output from the TRS bay into the A/D

You can also trigger them from the DAW by routing MIDI out through Oracle X.

### MIDI from the DAW

To play any synth from your DAW:

1. In Oracle X, set up a route from the DAW's MIDI output to the target synth
2. In your DAW, create a MIDI track and set its output to the corresponding MIDI port/channel
3. Record or play MIDI data — Oracle X sends it to the synth
4. The synth's audio comes back through the TRS patchbay into the A/D as described above

## Things to know

- **SY-77 noise**: The SY-77 has an audible high-frequency noise when powered on. If you hear a persistent high whine and the SY-77 is on, that's probably it. Turn it off when you're done.
- **Matrix 1000 noise**: Mechanical noise from the rack units. Turn them off when not in use.
- **Line levels are hot**: Synth outputs are line level, which is significantly louder than mic level. If you're going through a preamp, start with the gain very low. If going straight to the A/D, watch your levels.
- **The Prophet is loud**: Its output is strong enough to go straight to the converter without any gain stage. This is a good thing.
- **MIDI interface**: The MIDI interface powers on with the main power conditioner, so it should be ready when you boot up Oracle X.
