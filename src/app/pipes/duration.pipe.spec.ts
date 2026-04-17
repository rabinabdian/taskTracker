import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
  });

  // ─── Edge cases ────────────────────────────────────────────────────────────

  it('returns 00:00 for NaN', () => {
    expect(pipe.transform(NaN)).toBe('00:00');
  });

  it('returns 00:00 for negative numbers', () => {
    expect(pipe.transform(-1)).toBe('00:00');
  });

  it('returns 00:00 for zero seconds', () => {
    expect(pipe.transform(0)).toBe('00:00');
  });

  // ─── Default format (long) — no hours ──────────────────────────────────────

  it('formats seconds only (long)', () => {
    expect(pipe.transform(45)).toBe('00:45');
  });

  it('formats minutes and seconds (long)', () => {
    expect(pipe.transform(90)).toBe('01:30');
  });

  it('pads single-digit minutes and seconds (long)', () => {
    expect(pipe.transform(61)).toBe('01:01');
  });

  // ─── Default format (long) — with hours ────────────────────────────────────

  it('includes hours when >= 3600 seconds (long)', () => {
    expect(pipe.transform(3600)).toBe('01:00:00');
  });

  it('formats hours, minutes, seconds (long)', () => {
    expect(pipe.transform(3661)).toBe('01:01:01');
  });

  it('pads single-digit hours (long)', () => {
    expect(pipe.transform(7322)).toBe('02:02:02');
  });

  // ─── Short format ──────────────────────────────────────────────────────────

  it('formats seconds only (short)', () => {
    expect(pipe.transform(45, 'short')).toBe('00:45');
  });

  it('formats minutes and seconds (short)', () => {
    expect(pipe.transform(90, 'short')).toBe('01:30');
  });

  // short format still uses minutes-within-the-hour (seconds % 3600 / 60), not total minutes
  it('shows minutes-within-hour when >= 3600 seconds (short)', () => {
    expect(pipe.transform(3661, 'short')).toBe('01:01');
  });

  // ─── Boundary values ───────────────────────────────────────────────────────

  it('handles exactly 59 seconds', () => {
    expect(pipe.transform(59)).toBe('00:59');
  });

  it('handles exactly 3599 seconds (just under 1 hour)', () => {
    expect(pipe.transform(3599)).toBe('59:59');
  });

  it('handles large values', () => {
    expect(pipe.transform(36000)).toBe('10:00:00');
  });
});