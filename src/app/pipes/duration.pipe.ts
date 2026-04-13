// ─── DurationPipe ─────────────────────────────────────────────────────────────
// Demonstrates: Custom Pipe, PipeTransform interface, pure pipes

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true,
  pure: true, // re-runs only when input reference changes
})
export class DurationPipe implements PipeTransform {
  /**
   * Transforms seconds into HH:MM:SS or MM:SS format.
   * @param seconds  - total elapsed seconds
   * @param format   - 'short' → MM:SS  |  'long' → HH:MM:SS (default)
   */
  transform(seconds: number, format: 'short' | 'long' = 'long'): string {
    if (isNaN(seconds) || seconds < 0) return '00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    if (format === 'short' || h === 0) return `${mm}:${ss}`;
    return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  }
}
