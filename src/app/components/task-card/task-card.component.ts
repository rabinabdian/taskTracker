// ─── TaskCardComponent ────────────────────────────────────────────────────────
// Demonstrates: Input/Output, HostListener, @if/@for (new control flow),
//               custom directive usage, ChangeDetectionStrategy.OnPush

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus } from '../../models/task.model';
import { TimerDisplayComponent } from '../timer-display/timer-display.component';
import { PriorityHighlightDirective } from '../../directives/priority-highlight.directive';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, TimerDisplayComponent, PriorityHighlightDirective, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="task-card"
      [class]="'status-' + task.status"
      [class.running]="task.activeSessionStart !== null"
    >
      <!-- Card Header -->
      <div class="card-header">
        <span [appPriorityHighlight]="task.priority">{{ task.priority }}</span>
        <div class="card-actions">
          <button class="icon-btn" (click)="edit.emit(task)" title="Edit">✏️</button>
          <button class="icon-btn danger" (click)="delete.emit(task.id)" title="Delete">🗑️</button>
        </div>
      </div>

      <!-- Title & Description -->
      <h3 class="card-title" [class.done-title]="task.status === 'done'">
        @if (task.status === 'done') { <span class="check">✓</span> }
        {{ task.title }}
      </h3>

      @if (task.description) {
        <p class="card-desc">{{ task.description }}</p>
      }

      <!-- Tags -->
      @if (task.tags.length > 0) {
        <div class="tags">
          @for (tag of task.tags; track tag) {
            <span class="tag">#{{ tag }}</span>
          }
        </div>
      }

      <!-- Timer Display -->
      @if (task.status !== 'done') {
        <div class="card-timer">
          <app-timer-display
            [task]="task"
            (start)="timerStart.emit($event)"
            (pause)="timerPause.emit($event)"
            (reset)="timerReset.emit($event)"
          />
        </div>
      } @else {
        <div class="done-elapsed">
          ⏱ Total: {{ task.elapsedSeconds | duration }}
        </div>
      }

      <!-- Status Selector -->
      <div class="status-row">
        <label class="status-label">Status</label>
        <select
          class="status-select"
          [value]="task.status"
          (change)="onStatusChange($event)"
        >
          @for (s of statuses; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
      </div>

      @if (task.status === 'in-progress') {
        <div class="running-indicator">
          <span class="pulse"></span> Running
        </div>
      }
    </div>
  `,
  styles: [`
    .task-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    }
    .task-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--border);
      transition: background 0.3s;
    }
    .task-card.status-in-progress::before { background: var(--accent-green); }
    .task-card.status-paused::before { background: var(--accent-yellow); }
    .task-card.status-done::before { background: var(--text-muted); }
    .task-card.status-todo::before { background: var(--accent-blue); }
    .task-card.running {
      border-color: var(--accent-green);
      box-shadow: 0 0 20px var(--accent-green-glow);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-actions { display: flex; gap: 4px; }
    .icon-btn {
      background: none; border: none;
      cursor: pointer; padding: 4px 6px;
      border-radius: 6px; font-size: 0.9rem;
      opacity: 0.6; transition: opacity 0.2s;
    }
    .icon-btn:hover { opacity: 1; }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.4;
    }
    .done-title { color: var(--text-muted); text-decoration: line-through; }
    .check { color: var(--accent-green); margin-right: 4px; }
    .card-desc {
      font-size: 0.83rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      font-size: 0.7rem;
      color: var(--accent-blue);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .card-timer {
      padding: 12px;
      background: var(--surface-2);
      border-radius: 10px;
    }
    .done-elapsed {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
      padding: 8px;
      background: var(--surface-2);
      border-radius: 8px;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-label {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-select {
      flex: 1;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem;
      padding: 5px 8px;
      cursor: pointer;
      outline: none;
    }
    .running-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      color: var(--accent-green);
      font-family: 'JetBrains Mono', monospace;
    }
    .pulse {
      width: 8px; height: 8px;
      background: var(--accent-green);
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.5; }
    }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() timerStart = new EventEmitter<string>();
  @Output() timerPause = new EventEmitter<string>();
  @Output() timerReset = new EventEmitter<string>();

  readonly statuses: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: '📋 To Do' },
    { value: 'in-progress', label: '🔄 In Progress' },
    { value: 'paused', label: '⏸ Paused' },
    { value: 'done', label: '✅ Done' },
  ];

  onStatusChange(e: Event): void {
    const value = (e.target as HTMLSelectElement).value as TaskStatus;
    this.statusChange.emit({ id: this.task.id, status: value });
  }
}
