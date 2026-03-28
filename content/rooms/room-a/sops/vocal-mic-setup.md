# Vocal Mic Setup — Room A

How to set up a microphone for vocal recording in Room A. This covers stand placement, mic mounting, cable routing, and getting signal to your DAW.

## What you'll need

- A microphone (check `equipment.json` for what's available — the U87 or SM7B are the usual picks for vocals)
- A mic stand appropriate for the mic's weight (the U87 needs the heavy tripod; the SM7B works on the boom arm or desk stand)
- An XLR cable (grab one from the cable drawer under the desk)
- A pop filter (hanging on the hook by the iso booth door)

## Step by step

### 1. Place the stand

Set the stand where you want the vocalist to perform. For most sessions, that's in the iso booth or center of the main room.

- Spread the tripod legs fully so it won't tip
- Adjust the height so the mic will be roughly at mouth level for the singer (you can fine-tune once they arrive)
- Make sure the base isn't on any cable runs

### 2. Mount the mic

- If using the **U87**: it lives in the shock mount. Slide the shock mount onto the stand's thread and tighten. Don't over-tighten — just snug. The mic is heavy, so make sure the stand feels stable before letting go.
- If using the **SM7B**: thread it directly onto the stand. The built-in yoke mount is straightforward — loosen the tension knob, angle it, retighten.
- If using the **R-121** (ribbon): handle with extra care. Mount gently, never blow into it, and **never** apply phantom power.

### 3. Attach the pop filter

Clip the pop filter to the stand, about 2–3 inches in front of the mic capsule. It should be between the singer and the mic. This prevents plosives (hard "P" and "B" sounds) from hitting the diaphragm.

### 4. Connect the XLR cable

- Plug one end of the XLR cable into the bottom of the mic (the connector clicks in — push until you hear/feel it lock)
- Run the cable down the stand, loosely wrapping it once or twice around the stand to act as a strain relief (don't wrap it tight — just drape it)
- Plug the other end into the nearest wall plate input (Input 1 or Input 2 on the panel by the door)

### 5. Patch to a preamp

Walk over to the patchbay rack. By default:
- **Input 1** (top row, slot 1) is normalled to the **API 512c** (bottom row, slot 1)
- **Input 2** (top row, slot 2) is normalled to the **Neve 1073** (bottom row, slot 2)

If you plugged into Input 1, your signal is already flowing to the API 512c — no patch cable needed. If you want a different preamp, just patch from the top row to whichever bottom row slot you prefer. See the patchbay SOP for details.

### 6. Set the gain

- On the preamp, start with the gain knob fully counter-clockwise (minimum)
- If using a **condenser mic** (U87): engage the **48V phantom power** button on the preamp. Wait 10 seconds for it to stabilize.
- If using a **dynamic mic** (SM7B): no phantom power needed. Leave it off.
- If using a **ribbon mic** (R-121): **DO NOT** engage phantom power. Seriously, don't.
- Have the vocalist speak or sing at performance level. Slowly bring the gain up until the meter reads around -18 to -12 dBFS. Peaks should stay below -6 dBFS.

### 7. Set up headphone monitoring

- Plug headphones into any available output on the headphone amp (shelf above the patchbay)
- Adjust the individual volume knob for that output
- Make sure the vocalist can hear themselves and whatever backing track they need

## Common issues

### No sound at all
1. Is the XLR cable seated fully at both ends? Unplug and replug.
2. Is the correct wall plate input patched to a preamp? Check the patchbay.
3. Is the preamp powered on? The power LED should be lit.
4. Does the mic need phantom power? The U87 does. The SM7B doesn't. The R-121 absolutely does not.
5. Is the gain turned up? It might just be at zero.

### Signal is very quiet
- Gain might be too low — bring it up slowly
- If using the SM7B, it needs more gain than condensers. That's normal.
- Check that you're on the right input channel in your DAW

### Signal is distorted or clipping
- Turn the gain down
- If the preamp's clip LED is lighting up, you're hitting it too hard
- Try backing the vocalist off the mic by a few inches
- Some preamps have a pad switch (-10 or -20 dB) — engage it if the source is very loud

## Safety notes

- **Never apply phantom power to the Royer R-121.** This will permanently destroy the ribbon element. Replacement cost: $600+.
- **Never unplug or plug in XLR cables with the gain up.** Turn the gain to zero and mute monitors first. Hot-plugging causes loud pops that can damage speakers and ears.
- **The U87 is a $3,000+ mic.** Always use the heavy tripod stand. If it falls off a light stand, that's an expensive day.
- When done, turn off phantom power before disconnecting the mic. Give it 10 seconds to discharge.
