# Monitoring and Cue Mixes

How monitoring works in the studio, how to set up headphone mixes for performers, and how talkback/listenback works between the rooms.

## The MYO console

The MYO is the heart of the monitoring setup. It's not a traditional mixing console — think of it as a latency-free monitoring environment with a 64-bit summing mixer built in.

### How split monitoring works

This is the key concept: when signal comes into a MYO channel strip, it **splits at the top** — one copy goes to the DAW for recording, and another copy goes directly to the monitors and headphone mixes. This happens simultaneously.

What that means in practice:

- **You don't need input monitoring in your DAW.** The MYO handles monitoring independently.
- **You can run a high buffer size** (1024, 2048) for plugin stability without any monitoring latency. The performer hears themselves in real-time through the MYO, not through the DAW's round-trip.
- **Effects on the MYO** (delay, reverb) are for tracking vibe only — they don't print to the DAW. The performer can hear reverb in their headphones while you record the dry signal.

### Templates

The MYO has templates for common session setups. You don't need to learn the MYO from scratch — load a template that matches your session (vocal overdub, full band tracking, etc.) and tweak from there.

### 64-bit summing

The MYO can stem mixes out through its summing bus. Some engineers prefer this over the DAW's internal mix bus — it's a subtle difference, but the headroom and depth can be noticeable on dense mixes.

## Cue mixes (headphone mixes for performers)

There are **two stereo cue mixes** going out to the live room.

### The recommended setup

- **Cue Mix A** = the musical playback (backing track, click-free mix of the song)
- **Cue Mix B** = the click track (metronome)

### The Presonus HP-60

The HP-60 headphone amp is always plugged in and sits in the live room. It has **4 headphone outputs**, each with its own volume knob.

The HP-60 has a **blend knob** on each output that crossfades between Cue Mix A and Cue Mix B. This is incredibly useful:

- A drummer might want mostly click (heavy on B) with a little music (light on A)
- A vocalist might want all music (full A) and no click at all
- Each performer dials in their own preference without affecting anyone else

### Setting up cue mixes on the MYO

You can build cue mixes on the MYO faders, just like using aux sends on a traditional console. Each channel has sends for Cue A and Cue B. Adjust the send levels to build the headphone mix the performer wants.

## Talkback and listenback

Since there's no studio glass between the control room and the live room, communication happens through dedicated mics.

### Talkback (control room to live room)

- There's a **talkback mic** in the control room running through an **FMR preamp**.
- The FMR preamp needs **phantom power enabled** for the talkback mic to work. If you're not getting talkback, check that phantom is on.
- Press the talkback button to talk to the performer in the live room. They'll hear you through their headphones.

### Listenback (live room to control room)

- There's a **listenback mic** mounted in the live room ceiling. It's always there.
- This lets you hear what's happening in the live room from the control room — the performer talking between takes, tuning up, etc.
- It's always available; you just need to bring up the listenback channel on the MYO.

## Tips

- Always start with the monitor volume low after powering on the Genelecs. Bring it up gradually.
- If a performer says "I can't hear myself," check the cue mix send level on their channel in the MYO before touching anything else.
- If talkback isn't working, phantom power on the FMR preamp is the first thing to check.
- The HP-60 blend knob is your best friend for keeping performers happy. Show them how it works — they can adjust their own mix on the fly.
