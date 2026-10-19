// Speaker test: plays a short chime generated with the Web Audio API on the left channel,
// the right channel or both. No audio files are loaded.

type Channel = 'left' | 'right' | 'both';

const NOTES = [523.25, 659.25, 783.99]; // C5, E5, G5
const NOTE_SECONDS = 0.22;
const LABELS: Record<Channel, string> = {
  left: 'the left speaker only',
  right: 'the right speaker only',
  both: 'both speakers',
};

export function initSpeaker() {
  const status = document.getElementById('speaker-status') as HTMLParagraphElement;
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-channel]');
  let ctx: AudioContext | null = null;
  let doneTimer = 0;

  function play(channel: Channel) {
    if (typeof AudioContext === 'undefined') {
      status.textContent = 'Your browser can’t play generated sound (Web Audio isn’t supported).';
      return;
    }
    ctx ??= new AudioContext();
    void ctx.resume();
    const now = ctx.currentTime + 0.05;
    // A two-input merger maps input 0 to the left channel and input 1 to the right.
    const merger = ctx.createChannelMerger(2);
    merger.connect(ctx.destination);
    const out = ctx.createGain();
    out.gain.value = 0.25;
    if (channel !== 'right') out.connect(merger, 0, 0);
    if (channel !== 'left') out.connect(merger, 0, 1);

    NOTES.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const env = ctx!.createGain();
      const t = now + i * NOTE_SECONDS;
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(1, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, t + NOTE_SECONDS * 1.6);
      osc.connect(env).connect(out);
      osc.start(t);
      osc.stop(t + NOTE_SECONDS * 1.7);
    });

    const ms = Math.round((NOTES.length * NOTE_SECONDS + 0.4) * 1000);
    status.textContent = `Playing on ${LABELS[channel]}…`;
    clearTimeout(doneTimer);
    doneTimer = window.setTimeout(() => {
      status.textContent = `Played on ${LABELS[channel]}. Did it come from the right place?`;
      merger.disconnect();
    }, ms);
  }

  for (const b of buttons) b.addEventListener('click', () => play(b.dataset.channel as Channel));

  function stop() {
    clearTimeout(doneTimer);
    void ctx?.close();
    ctx = null;
  }
  window.addEventListener('pagehide', stop);
  return { stop };
}
