// Rollover and chatter tracking for the keyboard test. Pure logic, no DOM, so it can be
// unit tested. Times are event timestamps in milliseconds (KeyboardEvent.timeStamp).

/** A key that registers again less than this long after it was released is flagged as chatter. */
export const CHATTER_MS = 30;

export interface ChatterHit {
  code: string;
  /** Milliseconds between the key's release and the next press. */
  gap: number;
}

export class KeyStats {
  private held = new Set<string>();
  private lastUp = new Map<string, number>();
  /** Most keys the browser reported as held down at the same time. */
  max = 0;
  /** Chatter count per key code. */
  readonly chatter = new Map<string, number>();

  /** Number of keys currently held. */
  get current(): number {
    return this.held.size;
  }

  /**
   * Record a key press. Auto-repeat events (`repeat`) and presses of a key that is already
   * held are ignored, so holding a key down is never mistaken for chatter.
   */
  keyDown(code: string, time: number, repeat = false): ChatterHit | null {
    if (repeat || this.held.has(code)) return null;
    this.held.add(code);
    this.max = Math.max(this.max, this.held.size);
    const up = this.lastUp.get(code);
    if (up === undefined) return null;
    const gap = time - up;
    if (gap < 0 || gap >= CHATTER_MS) return null;
    this.chatter.set(code, (this.chatter.get(code) ?? 0) + 1);
    return { code, gap };
  }

  keyUp(code: string, time: number): void {
    this.held.delete(code);
    this.lastUp.set(code, time);
  }

  /** Forget held keys (e.g. the window lost focus, so no keyup will arrive). */
  releaseAll(): void {
    this.held.clear();
    this.lastUp.clear();
  }

  reset(): void {
    this.releaseAll();
    this.max = 0;
    this.chatter.clear();
  }
}
