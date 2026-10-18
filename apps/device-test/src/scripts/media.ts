// Shared helpers for the microphone and webcam tests: support checks, friendly error
// messages, device lists. Media streams are only ever attached to local elements
// (<audio>, <video>, <canvas>, Web Audio); nothing here sends data anywhere.

export type MediaKind = 'microphone' | 'camera';

export type MediaProblem = 'insecure' | 'unsupported' | 'denied' | 'no-device' | 'in-use' | 'unknown';

export interface ProblemInfo {
  problem: MediaProblem;
  title: string;
  message: string;
}

export function checkSupport(): MediaProblem | null {
  if (!window.isSecureContext) return 'insecure';
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
  return null;
}

export function classifyError(err: unknown): MediaProblem {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'no-device';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'in-use';
    case 'TypeError':
    case 'NotSupportedError':
      return 'unsupported';
    default:
      return 'unknown';
  }
}

export function describeProblem(problem: MediaProblem, kind: MediaKind): ProblemInfo {
  const device = kind;
  const map: Record<MediaProblem, Omit<ProblemInfo, 'problem'>> = {
    insecure: {
      title: 'This page needs a secure connection',
      message: `Browsers only allow ${device} access on secure (https://) pages. Open this page using an address that starts with https://.`,
    },
    unsupported: {
      title: `Your browser can’t access the ${device}`,
      message: `This browser doesn’t support ${device} access from web pages. Try the latest version of Chrome, Edge, Firefox or Safari. In-app browsers (inside social or chat apps) often block it — open the page in your main browser instead.`,
    },
    denied: {
      title: `${capitalise(device)} access is blocked`,
      message: `Your browser or system blocked access to the ${device}. Follow the steps below for your browser to allow it, then try again.`,
    },
    'no-device': {
      title: `No ${device} found`,
      message: `We couldn’t find a ${device}. Check it is plugged in and switched on, that any hardware privacy switch or cover is open, then try again. If you chose a device from the list, it may have been unplugged.`,
    },
    'in-use': {
      title: `The ${device} couldn’t be started`,
      message: `Another app or browser tab may be using the ${device}, or the system could not start it. Close video-call apps and other tabs that might be using it, then try again. Restarting the browser can also help.`,
    },
    unknown: {
      title: `Something went wrong starting the ${device}`,
      message: `Please try again. If it keeps happening, restart your browser and check the ${device} works in another app.`,
    },
  };
  return { problem, ...map[problem] };
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fill a <select> with devices of a kind. Labels are only available after permission. */
export async function fillDeviceSelect(
  select: HTMLSelectElement,
  kind: MediaDeviceKind,
  currentId: string | undefined,
  fallbackLabel: string,
): Promise<void> {
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === kind && d.deviceId);
  select.replaceChildren(
    ...devices.map((d, i) => new Option(d.label || `${fallbackLabel} ${i + 1}`, d.deviceId)),
  );
  if (devices.length === 0) select.add(new Option(`No ${fallbackLabel.toLowerCase()} found`, ''));
  if (currentId) select.value = currentId;
  select.disabled = devices.length < 2;
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Show a problem box (title, message, and the matching help sections). */
export function showProblem(box: HTMLElement, info: ProblemInfo | null) {
  if (!info) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.dataset.problem = info.problem;
  box.querySelector('[data-problem-title]')!.textContent = info.title;
  box.querySelector('[data-problem-message]')!.textContent = info.message;
  const help = box.querySelector<HTMLElement>('[data-permission-help]');
  if (help) help.hidden = info.problem !== 'denied' && info.problem !== 'in-use' && info.problem !== 'no-device';
}
