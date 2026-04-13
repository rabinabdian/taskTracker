// ─── TimerDisplayComponent ────────────────────────────────────────────────────
// Demonstrates: OnInit/OnDestroy lifecycle, interval with RxJS, Input/Output,
//               ChangeDetectionStrategy.OnPush

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { Task, getLiveElapsed } from '../../models/task.model';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-timer-display',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timer-display" [class.timer-running]="isRunning">

      <div class="timer-digits">
        {{ liveSeconds() | duration }}
      </div>

      @if (task.estimatedMinutes > 0) {
        <div class="timer-progress-wrap">
          <div
            class="timer-progress-bar"
            [style.width.%]="progressPercent()"
            [class.over-budget]="isOverBudget()"
          ></div>
        </div>
        <div class="timer-eta">
          @if (isOverBudget()) {
            <span class="over">+{{ overSeconds() | duration:'short' }} over estimate</span>
          } @else {
            <span>{{ remainingSeconds() | duration:'short' }} remaining of {{ task.estimatedMinutes }}min</span>
          }
        </div>
      }

      <div class="timer-controls">
        @if (!isRunning) {
          <button class="btn-timer btn-start" (click)="start.emit(task.id)" title="Start timer">
            ▶
          </button>
        } @else {
          <button class="btn-timer btn-pause" (click)="pause.emit(task.id)" title="Pause timer">
            ⏸
          </button>
        }
        <button
          class="btn-timer btn-reset"
          (click)="reset.emit(task.id)"
          [disabled]="isRunning"
          title="Reset timer"
        >
          ↺
        </button>
      </div>
    </div>
  `,
  styles: [`
    .timer-display {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .timer-digits {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 2px;
      color: var(--text-muted);
      transition: color 0.3s;
    }
    .timer-running .timer-digits {
      color: var(--accent-green);
      text-shadow: 0 0 12px var(--accent-green-glow);
    }
    .timer-progress-wrap {
      height: 3px;
      background: var(--surface-2);
      border-radius: 2px;
      overflow: hidden;
    }
    .timer-progress-bar {
      height: 100%;
      background: var(--accent-green);
      border-radius: 2px;
      transition: width 0.5s ease, background 0.3s;
      max-width: 100%;
    }
    .timer-progress-bar.over-budget {
      background: var(--accent-red);
      width: 100% !important;
    }
    .timer-eta {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .over { color: var(--accent-red); }
    .timer-controls {
      display: flex;
      gap: 6px;
    }
    .btn-timer {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid var(--border);
      background: var(--surface-2);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }
    .btn-start:hover { border-color: var(--accent-green); color: var(--accent-green); }
    .btn-pause:hover { border-color: var(--accent-yellow); color: var(--accent-yellow); }
    .btn-reset:hover:not([disabled]) { border-color: var(--text-muted); }
    .btn-reset[disabled] { opacity: 0.3; cursor: not-allowed; }
  `],
})
export class TimerDisplayComponent implements OnInit, OnDestroy {
  @Input({ required: true }) task!: Task;

  @Output() start = new EventEmitter<string>();
  @Output() pause = new EventEmitter<string>();
  @Output() reset = new EventEmitter<string>();

  liveSeconds = signal(0);

  get isRunning(): boolean {
    return this.task.activeSessionStart !== null;
  }

  progressPercent(): number {
    const estimated = this.task.estimatedMinutes * 60;
    if (estimated === 0) return 0;
    return Math.min(100, (this.liveSeconds() / estimated) * 100);
  }

  isOverBudget(): boolean {
    return this.liveSeconds() > this.task.estimatedMinutes * 60 && this.task.estimatedMinutes > 0;
  }

  remainingSeconds(): number {
    return Math.max(0, this.task.estimatedMinutes * 60 - this.liveSeconds());
  }

  overSeconds(): number {
    return Math.max(0, this.liveSeconds() - this.task.estimatedMinutes * 60);
  }

  private _sub: Subscription | null = null;

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Update every second
    this._sub = interval(1000).subscribe(() => {
      this.liveSeconds.set(getLiveElapsed(this.task));
      this._cdr.markForCheck();
    });
    this.liveSeconds.set(getLiveElapsed(this.task));
  }

  ngOnDestroy(): void {
    // Always unsubscribe to prevent memory leaks — key interview topic!
    this._sub?.unsubscribe();
  }
}
