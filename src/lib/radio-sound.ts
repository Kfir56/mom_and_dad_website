"use client";

/**
 * A little synthesized "old radio" for the hero button: dial static, a whistle that
 * drifts as the station is tuned in, then a soft AM-filtered melody. No audio files needed.
 * Everything runs on the Web Audio API and stops cleanly.
 */
export type RadioSound = { start: () => void; stop: () => void };

const NOTES = [392, 440, 494, 523, 494, 440, 392, 330, 349, 392, 440, 392]; // a gentle little tune

export function createRadioSound(): RadioSound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let timers: number[] = [];
  let sources: AudioScheduledSourceNode[] = [];

  const noiseBuffer = (c: AudioContext) => {
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  };

  /** One short mechanical click, like a Bakelite knob turning. */
  const click = (c: AudioContext, out: AudioNode) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1500;
    g.gain.setValueAtTime(0.5, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    src.connect(f).connect(g).connect(out);
    src.start();
    src.stop(c.currentTime + 0.06);
  };

  const start = () => {
    if (ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const c = new AC();
    ctx = c;
    void c.resume();
    master = c.createGain();
    master.gain.value = 0;
    // AM-radio character: narrow band, a touch of warmth.
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1400;
    band.Q.value = 0.6;
    const out = c.createGain();
    out.gain.value = 0.9;
    master.connect(band).connect(out).connect(c.destination);
    master.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.4);
    click(c, c.destination);

    // Static hiss that fades as the station comes in, and returns in between phrases.
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer(c);
    noise.loop = true;
    const hiss = c.createGain();
    hiss.gain.value = 0.35;
    noise.connect(hiss).connect(master);
    noise.start();
    sources.push(noise);

    // Tuning whistle sweeping up and down.
    const whistle = c.createOscillator();
    whistle.type = "sine";
    const wg = c.createGain();
    wg.gain.value = 0;
    whistle.connect(wg).connect(master);
    whistle.start();
    sources.push(whistle);

    // The melody.
    const tone = c.createGain();
    tone.gain.value = 0;
    tone.connect(master);

    const play = () => {
      if (!ctx) return;
      const t0 = c.currentTime;
      // Tune in: whistle glides down to nothing, static dips, melody fades in.
      whistle.frequency.cancelScheduledValues(t0);
      whistle.frequency.setValueAtTime(2400, t0);
      whistle.frequency.exponentialRampToValueAtTime(500, t0 + 1.6);
      wg.gain.cancelScheduledValues(t0);
      wg.gain.setValueAtTime(0.12, t0);
      wg.gain.linearRampToValueAtTime(0, t0 + 1.6);
      hiss.gain.cancelScheduledValues(t0);
      hiss.gain.setValueAtTime(0.4, t0);
      hiss.gain.linearRampToValueAtTime(0.06, t0 + 1.8);
      tone.gain.cancelScheduledValues(t0);
      tone.gain.setValueAtTime(0, t0 + 1.2);
      tone.gain.linearRampToValueAtTime(0.5, t0 + 2);

      NOTES.forEach((hz, i) => {
        const start = t0 + 1.6 + i * 0.5;
        const o = c.createOscillator();
        o.type = "triangle";
        o.frequency.value = hz;
        const g = c.createGain();
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.7, start + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        o.connect(g).connect(tone);
        o.start(start);
        o.stop(start + 0.5);
        sources.push(o);
      });

      // Drift out of tune again, then repeat.
      const end = t0 + 1.6 + NOTES.length * 0.5;
      tone.gain.linearRampToValueAtTime(0, end + 0.6);
      hiss.gain.linearRampToValueAtTime(0.4, end + 0.6);
      timers.push(window.setTimeout(play, (end + 0.8 - t0) * 1000));
    };
    play();
  };

  const stop = () => {
    const c = ctx;
    if (!c || !master) return;
    timers.forEach(clearTimeout);
    timers = [];
    click(c, c.destination);
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setValueAtTime(master.gain.value, c.currentTime);
    master.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
    const old = sources;
    sources = [];
    ctx = null;
    master = null;
    window.setTimeout(() => {
      old.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      void c.close();
    }, 350);
  };

  return { start, stop };
}
