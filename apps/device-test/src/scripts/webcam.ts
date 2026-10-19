import { checkSupport, classifyError, describeProblem, fillDeviceSelect, showProblem, stopStream } from './media';

export function initWebcam() {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const startBtn = $<HTMLButtonElement>('cam-start');
  const stopBtn = $<HTMLButtonElement>('cam-stop');
  const deviceSel = $<HTMLSelectElement>('cam-device');
  const qualitySel = $<HTMLSelectElement>('cam-quality');
  const video = $<HTMLVideoElement>('cam-video');
  const placeholder = $<HTMLParagraphElement>('cam-placeholder');
  const mirror = $<HTMLInputElement>('cam-mirror');
  const snapBtn = $<HTMLButtonElement>('cam-snapshot');
  const resOut = $<HTMLElement>('cam-res');
  const fpsOut = $<HTMLElement>('cam-fps');
  const status = $<HTMLParagraphElement>('cam-status');
  const shotWrap = $<HTMLElement>('cam-shot-wrap');
  const shotImg = $<HTMLImageElement>('cam-shot');
  const shotSave = $<HTMLAnchorElement>('cam-shot-save');
  const canvas = $<HTMLCanvasElement>('cam-canvas');
  const problemBox = $<HTMLDivElement>('cam-problem');

  let stream: MediaStream | null = null;
  let shotUrl: string | null = null;
  let fpsTimer = 0;
  let frameHandle = 0;
  let running = false;

  function applyMirror() {
    video.classList.toggle('mirrored', mirror.checked);
  }

  async function start(deviceId?: string) {
    const unsupported = checkSupport();
    if (unsupported) {
      showProblem(problemBox, describeProblem(unsupported, 'camera'));
      status.textContent = 'The webcam test can’t run here.';
      return;
    }
    stop();
    showProblem(problemBox, null);
    status.textContent = 'Waiting for permission…';
    startBtn.disabled = true;
    const height = Number(qualitySel.value);
    const constraints: MediaTrackConstraints = {};
    if (deviceId) constraints.deviceId = { exact: deviceId };
    if (height) {
      constraints.height = { ideal: height };
      constraints.width = { ideal: Math.round((height * 16) / 9) };
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: Object.keys(constraints).length ? constraints : true,
        audio: false,
      });
    } catch (err) {
      startBtn.disabled = false;
      status.textContent = 'Camera not started.';
      showProblem(problemBox, describeProblem(classifyError(err), 'camera'));
      return;
    }
    const track = stream.getVideoTracks()[0];
    track.addEventListener('ended', () => {
      status.textContent = 'The camera was disconnected or stopped.';
      stop();
    });
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay of a muted inline video is allowed; ignore rare interruptions.
    }
    running = true;
    placeholder.hidden = true;
    startBtn.hidden = true;
    startBtn.disabled = false;
    stopBtn.hidden = false;
    snapBtn.disabled = false;
    await fillDeviceSelect(deviceSel, 'videoinput', track.getSettings().deviceId, 'Camera');
    status.textContent = `Showing “${track.label || 'camera'}”.`;
    showSettings();
    measureFps();
  }

  function showSettings() {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const s = track.getSettings();
    const w = video.videoWidth || s.width;
    const h = video.videoHeight || s.height;
    resOut.textContent = w && h ? `${w} × ${h}` : 'Not reported';
    if (!('requestVideoFrameCallback' in video)) {
      fpsOut.textContent = s.frameRate ? `${Math.round(s.frameRate)} fps (reported)` : 'Not reported';
    }
  }

  function measureFps() {
    if (!('requestVideoFrameCallback' in video)) return;
    let frames = 0;
    let since = performance.now();
    const onFrame = () => {
      frames++;
      if (running) frameHandle = video.requestVideoFrameCallback(onFrame);
    };
    frameHandle = video.requestVideoFrameCallback(onFrame);
    fpsTimer = window.setInterval(() => {
      const now = performance.now();
      const fps = (frames * 1000) / (now - since);
      frames = 0;
      since = now;
      const reported = stream?.getVideoTracks()[0]?.getSettings().frameRate;
      fpsOut.textContent = `${Math.round(fps)} fps` + (reported ? ` (camera reports ${Math.round(reported)})` : '');
      showSettings();
    }, 1000);
  }

  function stop() {
    running = false;
    clearInterval(fpsTimer);
    if (frameHandle && 'cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(frameHandle);
    stopStream(stream);
    stream = null;
    video.srcObject = null;
    placeholder.hidden = false;
    snapBtn.disabled = true;
    resOut.textContent = '–';
    fpsOut.textContent = '–';
    if (!startBtn.hidden) return;
    startBtn.hidden = false;
    stopBtn.hidden = true;
    status.textContent = 'Stopped.';
  }

  function snapshot() {
    if (!stream || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const g = canvas.getContext('2d')!;
    if (mirror.checked) {
      g.translate(canvas.width, 0);
      g.scale(-1, 1);
    }
    g.drawImage(video, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      // A local blob: URL — the image only leaves the browser if you save it to your device.
      if (shotUrl) URL.revokeObjectURL(shotUrl);
      shotUrl = URL.createObjectURL(blob);
      shotImg.src = shotUrl;
      shotSave.href = shotUrl;
      shotWrap.hidden = false;
      status.textContent = 'Snapshot taken. Use the link below the image to save it.';
    }, 'image/png');
  }

  applyMirror();
  mirror.addEventListener('change', applyMirror);
  startBtn.addEventListener('click', () => void start());
  stopBtn.addEventListener('click', () => {
    stop();
    startBtn.focus();
  });
  deviceSel.addEventListener('change', () => void start(deviceSel.value));
  qualitySel.addEventListener('change', () => {
    if (running) void start(deviceSel.value || undefined);
  });
  snapBtn.addEventListener('click', snapshot);
  video.addEventListener('resize', showSettings);
  window.addEventListener('pagehide', () => {
    stop();
    if (shotUrl) URL.revokeObjectURL(shotUrl);
  });

  return { stop };
}
