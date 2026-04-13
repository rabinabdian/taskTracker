// ─── TaskService ─────────────────────────────────────────────────────────────
// Demonstrates: Injectable service, Signals, computed(), effect(),
//               localStorage persistence, RxJS Subject & BehaviorSubject

import { Injectable, signal, computed, effect } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  Task,
  TaskFormData,
  TaskStatus,
  TaskPriority,
  createTask,
  PRIORITY_ORDER,
} from '../models/task.model';

export type SortField = 'priority' | 'createdAt' | 'elapsed' | 'title';
export type FilterStatus = TaskStatus | 'all';

const STORAGE_KEY = 'taskflow_tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // ── Signals ────────────────────────────────────────────────────────────────
  private readonly _tasks = signal<Task[]>(this._loadFromStorage());
  readonly filterStatus = signal<FilterStatus>('all');
  readonly filterPriority = signal<TaskPriority | 'all'>('all');
  readonly sortField = signal<SortField>('priority');
  readonly searchQuery = signal<string>('');

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredTasks = computed(() => {
    let tasks = [...this._tasks()];

    const status = this.filterStatus();
    if (status !== 'all') {
      tasks = tasks.filter((t) => t.status === status);
    }

    const priority = this.filterPriority();
    if (priority !== 'all') {
      tasks = tasks.filter((t) => t.priority === priority);
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    const sort = this.sortField();
    tasks.sort((a, b) => {
      if (sort === 'priority') return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (sort === 'createdAt') return b.createdAt.getTime() - a.createdAt.getTime();
      if (sort === 'elapsed') return b.elapsedSeconds - a.elapsedSeconds;
      if (sort === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return tasks;
  });

  readonly stats = computed(() => {
    const all = this._tasks();
    return {
      total: all.length,
      todo: all.filter((t) => t.status === 'todo').length,
      inProgress: all.filter((t) => t.status === 'in-progress').length,
      paused: all.filter((t) => t.status === 'paused').length,
      done: all.filter((t) => t.status === 'done').length,
      totalElapsed: all.reduce((sum, t) => sum + t.elapsedSeconds, 0),
    };
  });

  readonly runningTask = computed(() =>
    this._tasks().find((t) => t.activeSessionStart !== null) ?? null
  );

  // ── RxJS – event bus (demonstrates Subject usage) ──────────────────────────
  private readonly _taskEvents$ = new Subject<{ type: string; taskId: string }>();
  readonly taskEvents$ = this._taskEvents$.asObservable();

  private readonly _notification$ = new BehaviorSubject<string | null>(null);
  readonly notification$ = this._notification$.asObservable();

  constructor() {
    // ── effect() – auto-persist to localStorage whenever _tasks changes ──────
    effect(() => {
      this._persistToStorage(this._tasks());
    });
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  addTask(data: TaskFormData): Task {
    const task = createTask(data);
    this._tasks.update((tasks) => [...tasks, task]);
    this._emit('created', task.id);
    this._notify(`Task "${task.title}" created!`);
    return task;
  }

  updateTask(id: string, partial: Partial<Task>): void {
    this._tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id ? { ...t, ...partial, updatedAt: new Date() } : t
      )
    );
    this._emit('updated', id);
  }

  deleteTask(id: string): void {
    const task = this._tasks().find((t) => t.id === id);
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    this._emit('deleted', id);
    if (task) this._notify(`Task "${task.title}" deleted.`);
  }

  getTaskById(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  // ── Timer Actions ──────────────────────────────────────────────────────────
  startTimer(id: string): void {
    // Stop any running timer first
    const running = this.runningTask();
    if (running && running.id !== id) {
      this.pauseTimer(running.id);
    }

    this._tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id && t.activeSessionStart === null
          ? { ...t, activeSessionStart: Date.now(), status: 'in-progress', updatedAt: new Date() }
          : t
      )
    );
    this._emit('timer-start', id);
  }

  pauseTimer(id: string): void {
    this._tasks.update((tasks) =>
      tasks.map((t) => {
        if (t.id !== id || t.activeSessionStart === null) return t;
        const sessionSeconds = Math.floor((Date.now() - t.activeSessionStart) / 1000);
        return {
          ...t,
          elapsedSeconds: t.elapsedSeconds + sessionSeconds,
          activeSessionStart: null,
          status: 'paused',
          updatedAt: new Date(),
        };
      })
    );
    this._emit('timer-pause', id);
  }

  resetTimer(id: string): void {
    this._tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id
          ? { ...t, elapsedSeconds: 0, activeSessionStart: null, updatedAt: new Date() }
          : t
      )
    );
  }

  completeTask(id: string): void {
    // Stop timer if running
    const task = this._tasks().find((t) => t.id === id);
    if (task?.activeSessionStart !== null) {
      this.pauseTimer(id);
    }
    this.updateTask(id, { status: 'done', completedAt: new Date() });
    this._notify('Task completed! 🎉');
  }

  setStatus(id: string, status: TaskStatus): void {
    if (status === 'done') {
      this.completeTask(id);
    } else {
      if (status !== 'in-progress') {
        const task = this._tasks().find((t) => t.id === id);
        if (task?.activeSessionStart !== null) this.pauseTimer(id);
      }
      this.updateTask(id, { status });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private _emit(type: string, taskId: string): void {
    this._taskEvents$.next({ type, taskId });
  }

  private _notify(msg: string): void {
    this._notification$.next(msg);
    setTimeout(() => this._notification$.next(null), 3000);
  }

  private _persistToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore storage errors
    }
  }

  private _loadFromStorage(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this._seedData();
      const parsed = JSON.parse(raw) as Task[];
      return parsed.map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        activeSessionStart: null, // reset timers on reload
      }));
    } catch {
      return this._seedData();
    }
  }

  private _seedData(): Task[] {
    const seed: TaskFormData[] = [
      { title: 'Set up Angular project', description: 'Initialize workspace with Angular CLI and configure routing', priority: 'high', tags: 'angular, setup', estimatedMinutes: 30 },
      { title: 'Learn Angular Signals', description: 'Study signal(), computed(), and effect() reactive primitives', priority: 'critical', tags: 'angular, signals, rxjs', estimatedMinutes: 60 },
      { title: 'Implement reactive forms', description: 'Build a complex form with FormGroup, validators, and error handling', priority: 'medium', tags: 'forms, validation', estimatedMinutes: 45 },
      { title: 'Create reusable components', description: 'Build Input/Output, Content Projection, and ViewChild patterns', priority: 'high', tags: 'components, patterns', estimatedMinutes: 90 },
      { title: 'Study Angular lifecycle hooks', description: 'Practice ngOnInit, ngOnDestroy, ngOnChanges with real examples', priority: 'medium', tags: 'lifecycle, angular', estimatedMinutes: 40 },
    ];
    return seed.map(createTask);
  }
}
