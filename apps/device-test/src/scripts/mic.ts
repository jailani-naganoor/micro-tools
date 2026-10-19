import { formatLatency, formatSetting, recordingExtension } from '../lib/device';
import { checkSupport, classifyError, describeProblem, fillDeviceSelect, showProblem, stopStream } from './media';

const RECORD_SECONDS = 5;

export function initMic() {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const startBtn = $<HTMLButtonElement>('mic-start');
  const stopBtn = $<HTMLButtonElement>('mic-stop');
  const deviceSel = $<HTMLSelectElement>('mic-device');
  const meter = $<HTMLDivElement>('mic-meter');
  const bar = $<HTMLDivElement>('mic-meter-bar');
  const levelText = $<HTMLSpanElement>('mic-level-text');
  const status = $<HTMLParagraphElement>('mic-status');
  const recordBtn = $<HTMLButtonElement>('mic-record');
  const recordStatus = $<HTMLSpanElement>('mic-record-status');
  const playback = $<HTMLAudioElement>('mic-playback');
  const problemBox = $<HTMLDivElement>('mic-problem');
  const info = $<HTMLDListElement>('mic-info');
  const download = $<HTMLAnchorElement>('mic-download');
  const nsBox = $<HTMLInputElement>('mic-ns');
  const ecBox = $<HTMLInputElement>('mic-ec');

  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let raf = 0;
  let heard = false;
  let recorder: MediaRecorder | null = null;
  let recordingUrl: string | null = null;
  // Bumped by stop(), so a start() still waiting for permission knows it was cancelled.
  let generation = 0;

  if (typeof MediaRecorder === 'undefined') {
    recordStatus.textContent = 'Recording isn’t supported in this browser.';
  }

  async function start(deviceId?: string) {
    const unsupported = checkSupport();
    if (unsupported) {
      showProblem(problemBox, describeProblem(unsupported, 'microphone'));
      status.textContent = 'The microphone test can’t run here.';
      return;
    }
    stop();
    showProblem(problemBox, null);
    status.textContent = 'Waiting for permission…';
    startBtn.disabled = true;
    const gen = generation;
    let next: MediaStream;
    try {
      next = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          noiseSuppression: nsBox.checked,
          echoCancellation: ecBox.checked,
        },
        video: false,
      });
    } catch (err) {
      startBtn.disabled = false;
      if (gen !== generation) return;
      status.textContent = 'Microphone not started.';
      showProblem(problemBox, describeProblem(classifyError(err), 'microphone'));
      return;
    }
    if (gen !== generation) {
      // Stopped (e.g. the tab was left) while waiting for permission.
      startBtn.disabled = false;
      stopStream(next);
      return;
    }
    stream = next;
    const track = stream.getAudioTracks()[0];
    track.addEventListener('ended', () => {
      status.textContent = 'The microphone was disconnected or stopped.';
      stop();
    });
    await fillDeviceSelect(deviceSel, 'audioinput', track.getSettings().deviceId, 'Microphone');
    if (gen !== generation || !stream) {
      startBtn.disabled = false;
      return;
    }
    deviceSel.disabled = deviceSel.options.length < 2;

    startBtn.hidden = true;
    startBtn.disabled = false;
    stopBtn.hidden = false;
    recordBtn.disabled = typeof MediaRecorder === 'undefined';
    heard = false;
    status.textContent = `Listening to “${track.label || 'microphone'}”. Make some noise…`;
    showSettings(track);
    runMeter(stream);
  }

  function showSettings(track: MediaStreamTrack | null) {
    const s: MediaTrackSettings & { latency?: number } = track?.getSettings() ?? {};
    const set = (key: string, text: string) => (info.querySelector(`[data-info="${key}"]`)!.textContent = text);
    if (!track) {
      for (const dd of info.querySelectorAll('dd')) dd.textContent = '–';
      return;
    }
    set('label', track.label || 'Not reported by this browser');
    set('sampleRate', formatSetting(s.sampleRate, ' Hz'));
    set('channelCount', formatSetting(s.channelCount));
    set('echoCancellation', formatSetting(s.echoCancellation));
    set('noiseSuppression', formatSetting(s.noiseSuppression));
    set('autoGainControl', formatSetting(s.autoGainControl));
    set('latency', formatLatency(s.latency));
  }

  function runMeter(s: MediaStream) {
    ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(s);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser); // not connected to the speakers, so there is no feedback
    const data = new Float32Array(analyser.fftSize);
    let lastText = 0;
    const tick = (now: number) => {
      analyser.getFloatTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v));
      // Map peak amplitude to a 0–100 scale on a dB curve (−60 dB … 0 dB).
      const db = 20 * Math.log10(Math.max(peak, 1e-6));
      const level = Math.round(Math.min(100, Math.max(0, ((db + 60) / 60) * 100)));
      bar.style.transform = `scaleX(${level / 100})`;
      if (now - lastText > 200) {
        lastText = now;
        levelText.textContent = `${level}%`;
        meter.setAttribute('aria-valuenow', String(level));
      }
      if (!heard && level > 35) {
        heard = true;
        status.textContent = 'Sound detected — your microphone is working.';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    generation++;
    cancelAnimationFrame(raf);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stopStream(stream);
    stream = null;
    void ctx?.close();
    ctx = null;
    bar.style.transform = 'scaleX(0)';
    levelText.textContent = '–';
    meter.setAttribute('aria-valuenow', '0');
    showSettings(null);
    if (!startBtn.hidden) return;
    startBtn.hidden = false;
    stopBtn.hidden = true;
    recordBtn.disabled = true;
    status.textContent = 'Stopped.';
  }

  function record() {
    if (!stream || typeof MediaRecorder === 'undefined') return;
    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (e) => e.data.size && chunks.push(e.data));
    recorder.addEventListener('stop', () => {
      // Kept in memory as a blob: URL; replaced (and freed) on the next recording.
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      const type = recorder?.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type });
      recordingUrl = URL.createObjectURL(blob);
      playback.src = recordingUrl;
      playback.hidden = false;
      // Saved straight from browser memory by the download link; nothing is uploaded.
      download.href = recordingUrl;
      download.download = `mic-recording.${recordingExtension(type)}`;
      download.hidden = false;
      recordStatus.textContent = 'Done — press play to listen.';
      recordBtn.disabled = !stream;
    });
    recorder.start();
    recordBtn.disabled = true;
    let left = RECORD_SECONDS;
    recordStatus.textContent = `Recording… ${left}`;
    const timer = window.setInterval(() => {
      left--;
      if (left > 0 && recorder?.state === 'recording') {
        recordStatus.textContent = `Recording… ${left}`;
        return;
      }
      clearInterval(timer);
      if (recorder?.state === 'recording') recorder.stop();
    }, 1000);
  }

  startBtn.addEventListener('click', () => void start());
  stopBtn.addEventListener('click', () => {
    stop();
    startBtn.focus();
  });
  deviceSel.addEventListener('change', () => void start(deviceSel.value));
  // Restart with the new processing settings so the difference can be heard in a new recording.
  for (const box of [nsBox, ecBox]) {
    box.addEventListener('change', () => {
      if (stream) void start(deviceSel.value || undefined);
    });
  }
  recordBtn.addEventListener('click', record);
  window.addEventListener('pagehide', () => {
    stop();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  });

  return { stop };
}
