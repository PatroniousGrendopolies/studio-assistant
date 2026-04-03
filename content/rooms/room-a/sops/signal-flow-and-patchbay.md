# Signal Flow and Patchbay

This is the deeper dive into how audio moves through the studio. If you just need to record a mic, the recording basics SOP covers that. This is for when you want to bypass preamps, insert outboard gear, or understand what's actually happening behind the rack.

## The full analog signal path

Here's the default signal flow, from source to DAW:

```
Mic (live room) → Snake → Preamp input
                              ↓
                     Preamp output → Bantam (TT) patchbay (top row)
                                              ↓ (normaled)
                                     A/D converter input (bottom row)
                                              ↓
                                     Mac Mini → DAW
```

The key thing: the snake goes **directly** to the preamp inputs, not through the patchbay. The patchbay handles everything **after** the preamps.

## The preamp lineup

In order on the console sidecar:

| Channels | Preamp | Notes |
|----------|--------|-------|
| 1-4      | 1073 clones (Neve-style) | Classic warm, thick sound. Great on everything. |
| 5-6      | API 312 clones | Punchy, forward midrange. Great on drums and guitars. |
| 7-8      | Pacifica | Clean and detailed. |
| 9-10     | AEA ribbon mic preamp | Currently out for repair. |
| 11-12    | Sabatron tube preamp | Has 30dB of built-in pad. Beautiful on vocals. Left off by default (slight hum). |
| 13-16    | Psytech | Connected via wall panel in live room. Transformer-less, very clean. Not designed for saturation. |

## A/D conversion

- **Metric Halo LiO8 #1** — channels 1-16 (16 in, 16 out)
- **Metric Halo LiO8 #2** — channels 17-32 (16 in, 16 out)
- **Aurora 16** — connected via AES

Total: 32+ channels of I/O.

## The Bantam (TT) patchbay

The patchbay is where the preamp outputs connect to the A/D converter inputs. It uses Bantam/TT cables (smaller than 1/4" — don't mix them up).

### How normaling works

The bay is **normaled**, meaning:

- **Top row** = preamp outputs
- **Bottom row** = A/D converter inputs
- By default, each top row jack feeds straight down to the bottom row jack below it. No cable needed.

When you plug a cable into the **bottom row**, it breaks the normal — your cable replaces the default signal. This is how you re-route things.

### Bypassing a preamp

If you want to skip the preamp entirely and go straight to the A/D converter (for a line-level source, for example):

1. Run your source into a **TRS** jack on the TRS patchbay
2. Patch from that TRS output into the **bottom row** of the Bantam bay (the A/D input you want)
3. This breaks the normal from the preamp, and your line-level signal goes straight to the converter

### Inserting outboard gear

Say you want to run a compressor between the preamp and the A/D converter:

1. Patch from the **top row** (preamp output) of the Bantam bay to the **input** of your outboard gear
2. Patch from the **output** of the outboard gear to the **bottom row** (A/D input) of the Bantam bay

That's it. You've inserted the compressor into the signal chain. The normal is broken at the bottom row, so the signal now flows: preamp → compressor → A/D.

## The Little Labs fader bank

The Little Labs fader bank sits inline after channels 1-8, between the preamp outputs and the A/D inputs. It gives you a pad in 3dB steps.

### Why you'd use it

When you push preamps hard — cranking the gain for harmonic saturation and that driven analog sound — the output level can be hot enough to clip the A/D converter. The fader bank lets you pull the level back down before it hits the converter, so you get the preamp color without the digital clipping.

### When you need it

- **Driving 1073s or API 312s hard** on drums, guitars, or anything you want aggressive — use the fader bank to tame the level.
- **Vocals through a condenser** — usually fine without it. Condensers are sensitive enough that you don't need to crank the preamp.
- **Sabatron** — has 30dB of built-in pad, so it doesn't need the fader bank.
- **Psytech** — transformer-less and not meant for saturation. No need for the fader bank.

### How to use it

Just pull the fader down until the signal hitting the A/D is at a healthy level (peaks around -6 dBFS). Each step is 3dB, so you have fine control.

## The TRS patchbay

Separate from the Bantam bay, there's a TRS patchbay for line-level connections — synths, outboard effects returns, DI outputs, etc. See the synths and MIDI SOP for how the synths are routed through this bay.

## Tips

- **No patching needed for basic recording.** The normals handle the default routing. Only touch the patchbay when you want to do something non-standard.
- **Bantam cables are not 1/4" cables.** They look similar but Bantam/TT is smaller. Using the wrong cable will damage the jacks.
- **Push cables in firmly.** Loose TT connections are the number one cause of intermittent signal.
- **When in doubt, pull all patch cables out.** The normals restore and you're back to default routing.
