// ─── TaskBoardComponent ───────────────────────────────────────────────────────
// Demonstrates: RouterOutlet pattern, Signal-based state, Subscription management,
//               @if/@for new control flow syntax, toSignal(), effect()

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
    DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { TaskService, SortField, FilterStatus } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskFormData } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { StatsPanelComponent } from '../stats-panel/stats-panel.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TaskCardComponent,
    TaskFormComponent,
    StatsPanelComponent,
  ],
  template: `
    <div class="board-shell">

      <!-- ── Sidebar ─────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-icon">⬡</span>
          <div>
            <div class="brand-name">TaskFlow</div>
            <div class="brand-sub">Angular 17 Practice</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button
            class="nav-item"
            [class.active]="filterStatus() === 'all'"
            (click)="taskService.filterStatus.set('all')"
          >
            <span>All Tasks</span>
            <span class="nav-count">{{ taskService.stats().total }}</span>
          </button>
          @for (s of statusItems; track s.value) {
            <button
              class="nav-item"
              [class.active]="filterStatus() === s.value"
              (click)="taskService.filterStatus.set(s.value)"
            >
              <span>{{ s.icon }} {{ s.label }}</span>
              <span class="nav-count">{{ getStatusCount(s.value) }}</span>
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="btn-new-task" (click)="openForm()">
            + New Task
          </button>
        </div>
      </aside>

      <!-- ── Main Content ────────────────────────────────────── -->
      <main class="board-main">

        <!-- Header -->
        <header class="board-header">
          <div>
            <h1 class="board-title">{{ currentViewTitle() }}</h1>
            <p class="board-subtitle">{{ taskService.filteredTasks().length }} tasks</p>
          </div>
          <div class="header-actions">
            <input
              class="search-input"
              type="text"
              placeholder="Search tasks…"
              [ngModel]="searchQuery()"
              (ngModelChange)="taskService.searchQuery.set($event)"
            />
          </div>
        </header>

        <!-- Stats -->
        <app-stats-panel [stats]="taskService.stats()" />

        <!-- Filters & Sort -->
        <div class="toolbar">
          <div class="filter-group">
            <span class="toolbar-label">Priority</span>
            @for (p of priorityFilters; track p.value) {
              <button
                class="filter-chip"
                [class.active]="filterPriority() === p.value"
                (click)="taskService.filterPriority.set(p.value)"
              >{{ p.label }}</button>
            }
          </div>

          <div class="sort-group">
            <span class="toolbar-label">Sort</span>
            <select
              class="sort-select"
              [ngModel]="sortField()"
              (ngModelChange)="taskService.sortField.set($event)"
            >
              @for (opt of sortOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Task Grid -->
        @if (taskService.filteredTasks().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No tasks found</p>
            <button class="btn-new-task" (click)="openForm()">Create your first task</button>
          </div>
        } @else {
          <div class="task-grid">
            @for (task of taskService.filteredTasks(); track task.id) {
              <app-task-card
                [task]="task"
                (edit)="openForm($event)"
                (delete)="onDelete($event)"
                (statusChange)="onStatusChange($event)"
                (timerStart)="taskService.startTimer($event)"
                (timerPause)="taskService.pauseTimer($event)"
                (timerReset)="taskService.resetTimer($event)"
              />
            }
          </div>
        }

      </main>

      <!-- ── Notification Toast ──────────────────────────────── -->
      @if (notification()) {
        <div class="toast">{{ notification() }}</div>
      }

      <!-- ── Task Form Modal ────────────────────────────────── -->
      @if (showForm()) {
        <app-task-form
          [editTask]="editingTask()"
          (save)="onSave($event)"
          (cancel)="closeForm()"
        />
      }

    </div>
  `,
  styles: [`
    .board-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg);
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--surface-1);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      gap: 24px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }
    .brand-icon {
      font-size: 1.8rem;
      color: var(--accent-blue);
      line-height: 1;
    }
    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .brand-sub {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 12px;
      border-radius: 8px;
      border: none;
      background: none;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-family: 'Space Grotesk', sans-serif;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }
    .nav-item:hover { background: var(--surface-2); color: var(--text-primary); }
    .nav-item.active { background: var(--accent-blue-bg); color: var(--accent-blue); font-weight: 600; }
    .nav-count {
      background: var(--surface-2);
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .sidebar-footer { margin-top: auto; }
    .btn-new-task {
      width: 100%;
      padding: 10px 16px;
      background: var(--accent-blue);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Space Grotesk', sans-serif;
      transition: filter 0.2s;
    }
    .btn-new-task:hover { filter: brightness(1.2); }

    /* ── Main ── */
    .board-main {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .board-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .board-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 2px;
      font-family: 'JetBrains Mono', monospace;
    }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .search-input {
      background: var(--surface-1);
      border: 1.5px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      padding: 8px 14px;
      width: 220px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--accent-blue); }
    .search-input::placeholder { color: var(--text-muted); }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }
    .toolbar-label {
      font-size: 0.72rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
    }
    .filter-group, .sort-group { display: flex; align-items: center; gap: 8px; }
    .filter-chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-size: 0.78rem;
      cursor: pointer;
      font-family: 'Space Grotesk', sans-serif;
      transition: all 0.15s;
    }
    .filter-chip:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
    .filter-chip.active { background: var(--accent-blue); color: #fff; border-color: var(--accent-blue); }
    .sort-select {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.82rem;
      padding: 5px 10px;
      cursor: pointer;
      outline: none;
    }

    /* ── Grid ── */
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    /* ── Empty State ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 80px 20px;
      color: var(--text-muted);
    }
    .empty-icon { font-size: 3rem; }
    .empty-state p { font-size: 1rem; }
    .empty-state .btn-new-task { width: auto; padding: 10px 24px; }

    /* ── Toast ── */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface-1);
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 0.88rem;
      font-family: 'JetBrains Mono', monospace;
      z-index: 200;
      animation: toastIn 0.3s ease;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    @keyframes toastIn {
      from { transform: translateY(10px); opacity: 0 }
      to { transform: translateY(0); opacity: 1 }
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .board-main { padding: 16px; }
      .task-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class TaskBoardComponent {
    // inject() at field level
    private _destroyRef = inject(DestroyRef);
  readonly taskService = inject(TaskService);
// subscriptions declared as fields — no ngOnInit needed
    private _notificationSub = this.taskService.notification$
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((msg) => this.notification.set(msg));

    private _eventsSub = this.taskService.taskEvents$
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(({ type, taskId }) =>
            console.log(`[TaskBoard] Event: ${type} → ${taskId}`)
        );
  // ── Local UI signals ───────────────────────────────────────────────────────
  showForm = signal(false);
  editingTask = signal<Task | null>(null);
  notification = signal<string | null>(null);

  // ── Aliases for template convenience ──────────────────────────────────────
  filterStatus = this.taskService.filterStatus;
  filterPriority = this.taskService.filterPriority;
  sortField = this.taskService.sortField;
  searchQuery = this.taskService.searchQuery;

  // ── Computed ───────────────────────────────────────────────────────────────
  currentViewTitle = computed(() => {
    const s = this.filterStatus();
    const map: Record<string, string> = {
      all: 'All Tasks',
      todo: 'To Do',
      'in-progress': 'In Progress',
      paused: 'Paused',
      done: 'Completed',
    };
    return map[s] ?? 'Tasks';
  });

  // ── Config data ────────────────────────────────────────────────────────────
  readonly statusItems: { value: FilterStatus; icon: string; label: string }[] = [
    { value: 'todo', icon: '📋', label: 'To Do' },
    { value: 'in-progress', icon: '🔄', label: 'In Progress' },
    { value: 'paused', icon: '⏸', label: 'Paused' },
    { value: 'done', icon: '✅', label: 'Done' },
  ];

  readonly priorityFilters: { value: TaskPriority | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: '🔴 Critical' },
    { value: 'high', label: '🟠 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🔵 Low' },
  ];

  readonly sortOptions: { value: SortField; label: string }[] = [
    { value: 'priority', label: 'Priority' },
    { value: 'createdAt', label: 'Newest' },
    { value: 'elapsed', label: 'Time Spent' },
    { value: 'title', label: 'Title A–Z' },
  ];

  // ── Subscriptions (demonstrate proper cleanup) ─────────────────────────────
//    private _destroyRef = inject(DestroyRef);

// AFTER
    ngOnInit(): void {
        this.taskService.notification$
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((msg) => {
                this.notification.set(msg);
            });

        this.taskService.taskEvents$
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe(({ type, taskId }) => {
                console.log(`[TaskBoard] Event: ${type} → ${taskId}`);
            });
    }

  // ── Event Handlers ─────────────────────────────────────────────────────────
  openForm(task?: Task): void {
    this.editingTask.set(task ?? null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingTask.set(null);
  }

  onSave(data: TaskFormData): void {
    if (this.editingTask()) {
      this.taskService.updateTask(this.editingTask()!.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
    } else {
      this.taskService.addTask(data);
    }
    this.closeForm();
  }

  onDelete(id: string): void {
    this.taskService.deleteTask(id);
  }

  onStatusChange({ id, status }: { id: string; status: TaskStatus }): void {
    this.taskService.setStatus(id, status);
  }

  getStatusCount(status: string): number {
    const s = this.taskService.stats();
    const map: Record<string, number> = {
      todo: s.todo,
      'in-progress': s.inProgress,
      paused: s.paused,
      done: s.done,
    };
    return map[status] ?? 0;
  }
}
