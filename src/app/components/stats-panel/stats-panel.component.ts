// ─── StatsPanelComponent ──────────────────────────────────────────────────────
// Demonstrates: Input with transform, computed display, DurationPipe

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DurationPipe } from '../../pipes/duration.pipe';

interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  paused: number;
  done: number;
  totalElapsed: number;
}

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-panel">
      <div class="stat-card">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card todo">
        <span class="stat-num">{{ stats.todo }}</span>
        <span class="stat-label">To Do</span>
      </div>
      <div class="stat-card in-progress">
        <span class="stat-num">{{ stats.inProgress }}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-card done">
        <span class="stat-num">{{ stats.done }}</span>
        <span class="stat-label">Done</span>
      </div>
      <div class="stat-card elapsed">
        <span class="stat-num mono">{{ stats.totalElapsed | duration }}</span>
        <span class="stat-label">Total Time</span>
      </div>
      <div class="stat-card rate">
        <span class="stat-num">{{ completionRate }}%</span>
        <span class="stat-label">Done Rate</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-panel {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
    }
    @media (max-width: 900px) {
      .stats-panel { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 520px) {
      .stats-panel { grid-template-columns: repeat(2, 1fr); }
    }
    .stat-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .stat-num {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .stat-num.mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
    }
    .stat-label {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .todo .stat-num { color: var(--accent-blue); }
    .in-progress .stat-num { color: var(--accent-green); }
    .done .stat-num { color: var(--text-muted); }
    .elapsed .stat-num { color: var(--accent-yellow); }
    .rate .stat-num { color: var(--accent-purple); }
  `],
})
export class StatsPanelComponent {
  @Input({ required: true }) stats!: Stats;

  get completionRate(): number {
    if (this.stats.total === 0) return 0;
    return Math.round((this.stats.done / this.stats.total) * 100);
  }
}
