# Monitor Startup — Room A

How to turn on the monitoring system in Room A. The power-on sequence matters — doing it out of order can send a loud pop through the speakers.

## Power-on sequence

**Always turn things on from source to speakers, and off from speakers to source.**

### Turning on

1. **Audio interface** — Make sure the audio interface is powered on and connected. Its power LED should be solid (not blinking). If it's blinking, it's not synced — check the USB/Thunderbolt connection.
2. **Wait 5 seconds** — Let the interface fully initialize. Rushing this step sometimes sends a burst of noise downstream.
3. **Power amplifier** (if external) — Turn on the amp. The power LED should come on. Some amps have a "standby" mode — make sure it's in full operating mode, not standby.
4. **Monitor speakers** — If the monitors are self-powered (active), flip their power switches on. They're on the back of each speaker.
5. **Set volume** — Start with the monitor controller or volume knob at zero. Slowly bring it up to a comfortable listening level. Don't just crank it.

### Turning off (reverse order)

1. Turn the monitor volume all the way down
2. Power off the monitor speakers
3. Power off the amplifier (if external)
4. Power off the interface last (or leave it on if you're switching rooms)

## Volume check

Before you start playing audio at full volume:

- Play something familiar at a low level first
- Make sure both speakers are producing sound (not just one side)
- Listen for any hum, buzz, or crackle — that usually means a cable issue
- If one speaker is louder than the other, check that the cables are seated fully and that the balance/pan is centered

## Common issues

### No sound from monitors
1. Are the monitors actually turned on? Check the power LEDs on the back.
2. Is the volume up? Check the monitor controller.
3. Is the interface outputting audio? Check that your DAW output routing is correct (usually outputs 1–2).
4. Are the cables connected? Follow the cables from the interface outputs to the monitor inputs.

### Loud hum or buzz
- This is almost always a ground loop. Try:
  - Checking that all power cables are plugged into the same power strip
  - Making sure no audio cables are running parallel to power cables
  - If it just started, something nearby might have been turned on (lights, phone charger, etc.)

### Only one speaker works
- Swap the left and right cables at the interface output. If the problem follows the cable, it's a bad cable. If it stays on the same speaker, the speaker or its power connection is the issue.
- Check that your DAW isn't panned hard to one side

### Pop or thump on power-on
- You turned things on in the wrong order. Not the end of the world, but try to follow the sequence above next time. If it was very loud, check the speakers and amp for any error indicators.

## Notes

- Don't leave the monitors on overnight. Power them down when you're done.
- If you hear a persistent rattle at certain frequencies, one of the speaker screws might be loose. Don't try to fix it yourself — just flag it.
- The monitor volume should never need to be above 60–70% for a normal session. If you need more volume, something is probably wrong with the gain staging upstream.
