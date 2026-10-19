import { describe, expect, it } from 'vitest';
import { CHATTER_MS, KeyStats } from '../../src/lib/key-stats';
import { formatLatency, formatSetting, isIPhone, looksTouchOnly, recordingExtension } from '../../src/lib/device';

describe('KeyStats', () => {
  it('counts the most keys held at once', () => {
    const s = new KeyStats();
    s.keyDown('KeyA', 0);
    s.keyDown('KeyS', 5);
    s.keyDown('KeyD', 10);
    expect(s.current).toBe(3);
    s.keyUp('KeyS', 20);
    s.keyDown('KeyF', 25);
    expect(s.max).toBe(3);
    s.keyDown('KeyG', 200);
    expect(s.max).toBe(4);
  });

  it('flags a key that registers again just after release', () => {
    const s = new KeyStats();
    s.keyDown('KeyE', 0);
    s.keyUp('KeyE', 80);
    expect(s.keyDown('KeyE', 80 + CHATTER_MS - 1)).toEqual({ code: 'KeyE', gap: CHATTER_MS - 1 });
    expect(s.chatter.get('KeyE')).toBe(1);
  });

  it('does not flag normal typing, held keys or auto-repeat', () => {
    const s = new KeyStats();
    s.keyDown('KeyE', 0);
    s.keyUp('KeyE', 80);
    expect(s.keyDown('KeyE', 80 + CHATTER_MS)).toBeNull(); // exactly the threshold: not chatter
    expect(s.keyDown('KeyE', 600, true)).toBeNull(); // auto-repeat while held
    expect(s.keyDown('KeyE', 650)).toBeNull(); // still held, no keyup in between
    expect(s.chatter.size).toBe(0);
    expect(s.max).toBe(1);
  });

  it('a key pressed for the first time is never chatter', () => {
    expect(new KeyStats().keyDown('KeyQ', 1)).toBeNull();
  });

  it('releaseAll and reset', () => {
    const s = new KeyStats();
    s.keyDown('KeyA', 0);
    s.keyUp('KeyA', 10);
    s.keyDown('KeyA', 15);
    s.releaseAll();
    expect(s.current).toBe(0);
    expect(s.keyDown('KeyA', 20)).toBeNull(); // last release forgotten
    s.reset();
    expect(s.max).toBe(0);
    expect(s.chatter.size).toBe(0);
  });
});

describe('device checks', () => {
  const mq = (on: string[]) => (q: string) => on.includes(q);

  it('detects touch-only devices', () => {
    expect(looksTouchOnly(mq(['(pointer: coarse)', '(hover: none)']))).toBe(true);
    // Phone or tablet with a mouse or trackpad connected
    expect(looksTouchOnly(mq(['(pointer: coarse)', '(hover: none)', '(any-pointer: fine)']))).toBe(false);
    // Desktop
    expect(looksTouchOnly(mq(['(pointer: fine)', '(hover: hover)', '(any-pointer: fine)']))).toBe(false);
  });

  it('detects iPhone', () => {
    expect(isIPhone('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(true);
    expect(isIPhone('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe(false);
    expect(isIPhone('Mozilla/5.0 (Linux; Android 14; Pixel 7)')).toBe(false);
  });

  it('picks a recording file extension', () => {
    expect(recordingExtension('audio/webm;codecs=opus')).toBe('webm');
    expect(recordingExtension('audio/ogg; codecs=opus')).toBe('ogg');
    expect(recordingExtension('audio/mp4')).toBe('m4a');
    expect(recordingExtension('')).toBe('webm');
  });

  it('formats settings', () => {
    expect(formatSetting(undefined)).toBe('Not reported by this browser');
    expect(formatSetting(true)).toBe('On');
    expect(formatSetting(48000, ' Hz')).toBe('48000 Hz');
    expect(formatLatency(0.01)).toBe('10 ms');
    expect(formatLatency(0.0213)).toBe('21.3 ms');
    expect(formatLatency(undefined)).toBe('Not reported by this browser');
  });
});
