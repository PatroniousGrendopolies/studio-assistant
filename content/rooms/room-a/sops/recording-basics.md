# Recording Basics

How to get a microphone signal from the live room into your DAW. This is the simplest path — no patchbay tricks, no outboard gear, just mic to preamp to computer.

## What you'll need

- A microphone from the mic locker (key is on the lockbox keychain)
- An XLR cable
- The studio powered up (follow the power-on SOP if you haven't already)

## From the live room

The live room has a 12-channel snake that runs back to the control room. The snake channels are wired directly into the preamp inputs on the sidecar — no patchbay involved for this part.

### The snake channel order matches the preamps:

| Snake channels | Preamp              |
|---------------|---------------------|
| 1-4           | 1073 clones (Neve-style) |
| 5-6           | API 312 clones      |
| 7-8           | Pacifica            |

So if you plug a mic into snake channel 1, it's going straight to the first 1073. Channel 5 goes to the first API 312. No guessing.

### Step by step (live room)

1. **Grab your mic** from the mic locker. Set it up on a stand in the live room.
2. **Connect the XLR** from the mic to the snake input that corresponds to the preamp you want.
3. **Back in the control room**, find that preamp on the sidecar.
4. **Set the gain** — start with the gain knob at minimum (fully counter-clockwise).
5. **Phantom power** — if you're using a condenser mic, engage 48V on the preamp. Wait about 10 seconds for it to stabilize. Dynamic mics don't need phantom. **Never** use phantom power with ribbon mics.
6. **Bring up the gain** while the performer speaks or plays at performance level. Aim for peaks around -12 to -6 dBFS on your DAW meter.
7. **Arm the track** in your DAW (Pro Tools or Ableton) and you should see signal.

### Using the wall panel (channels 13-16)

The live room also has a wall panel that connects to the Psytech preamps (channels 13-16). If you need more channels or specifically want the Psytech sound, plug your mics into the wall panel XLR jacks instead of the snake.

## From the iso booth

The iso booth has wall plates with 2 TRS and 6 XLR passthrough connections. Run your mic cable from the booth into these wall plates. On the other side of the wall (in the live room), connect from the wall plate output to the snake or the live room wall panel.

## From the control room

If you're tracking in the control room (vocals, guitar DI, synth), you can plug directly into the back of any preamp — you don't need the snake at all. Just run an XLR straight from the mic to the preamp input.

## The signal path (what's happening behind the scenes)

Once you've got gain on the preamp, here's where the signal goes:

1. **Mic** → XLR cable → **Preamp input**
2. **Preamp output** → Bantam patchbay (normaled connection)
3. **Patchbay** → **A/D converter** (Metric Halo LiO8 or Aurora 16)
4. **A/D converter** → Mac Mini → **DAW**

Because the patchbay is normaled, steps 2-3 happen automatically — no patching needed for basic recording. The preamp outputs flow straight through to the converters.

## Common issues

### No signal in the DAW
1. Is the preamp powered on? (Check the power conditioner.)
2. Is the gain turned up?
3. Does the mic need phantom power?
4. Is the XLR cable seated fully at both ends?
5. Is the correct input channel armed in your DAW?
6. Check the DAW's audio interface settings — make sure it's pointed at the Metric Halo, not the built-in audio.

### Signal is distorted
- Turn the preamp gain down.
- If you're driving the preamp hard for saturation, you may need the Little Labs fader bank to pad the signal before it hits the A/D. See the signal flow SOP for details.

### Very quiet signal
- Gain might be too low. Bring it up.
- Dynamic mics (like an SM7B) need a lot more gain than condensers — that's normal.
- If you're still struggling, try a Cloud Lifter (in the mic locker). It gives dynamic and ribbon mics a clean gain boost.
