import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskService } from './task.service';
import { TaskFormData } from '../models/task.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FORM_DATA: TaskFormData = {
  title: 'Test Task',
  description: 'A test description',
  priority: 'medium',
  tags: 'angular, testing',
  estimatedMinutes: 30,
};

function makeTask(overrides: Partial<TaskFormData> = {}): TaskFormData {
  return { ...FORM_DATA, ...overrides };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    // Start every test with empty storage so seed data is never loaded
    localStorage.setItem('taskflow_tasks', '[]');

    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── addTask() ─────────────────────────────────────────────────────────────

  describe('addTask()', () => {
    it('appends the new task to the list', () => {
      service.addTask(makeTask());
      expect(service.filteredTasks().length).toBe(1);
    });

    it('returns the created task with correct fields', () => {
      const task = service.addTask(makeTask({ title: 'My Task', priority: 'high' }));
      expect(task.title).toBe('My Task');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');
      expect(task.elapsedSeconds).toBe(0);
      expect(task.activeSessionStart).toBeNull();
    });

    it('splits comma-separated tags into an array', () => {
      const task = service.addTask(makeTask({ tags: 'angular, testing, signals' }));
      expect(task.tags).toEqual(['angular', 'testing', 'signals']);
    });

    it('trims whitespace from title', () => {
      const task = service.addTask(makeTask({ title: '  Trimmed  ' }));
      expect(task.title).toBe('Trimmed');
    });

    it('emits a "created" event on taskEvents$', () => {
      const events: { type: string; taskId: string }[] = [];
      service.taskEvents$.subscribe((e) => events.push(e));

      const task = service.addTask(makeTask());
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('created');
      expect(events[0].taskId).toBe(task.id);
    });

    it('emits a notification message', (done) => {
      service.notification$.subscribe((msg) => {
        if (msg !== null) {
          expect(msg).toContain('Test Task');
          done();
        }
      });
      service.addTask(makeTask());
    });
  });

  // ─── updateTask() ──────────────────────────────────────────────────────────

  describe('updateTask()', () => {
    it('updates matching task fields', () => {
      const task = service.addTask(makeTask());
      service.updateTask(task.id, { title: 'Updated', priority: 'critical' });

      const updated = service.getTaskById(task.id)!;
      expect(updated.title).toBe('Updated');
      expect(updated.priority).toBe('critical');
    });

    it('sets updatedAt to the current time', () => {
      const before = new Date();
      const task = service.addTask(makeTask());
      service.updateTask(task.id, { title: 'Changed' });

      const updated = service.getTaskById(task.id)!;
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('does not affect other tasks', () => {
      const a = service.addTask(makeTask({ title: 'A' }));
      const b = service.addTask(makeTask({ title: 'B' }));
      service.updateTask(a.id, { title: 'A-modified' });

      expect(service.getTaskById(b.id)!.title).toBe('B');
    });

    it('emits an "updated" event', () => {
      const task = service.addTask(makeTask());
      const events: { type: string; taskId: string }[] = [];
      service.taskEvents$.subscribe((e) => events.push(e));

      service.updateTask(task.id, { title: 'Changed' });
      expect(events[0].type).toBe('updated');
      expect(events[0].taskId).toBe(task.id);
    });
  });

  // ─── deleteTask() ──────────────────────────────────────────────────────────

  describe('deleteTask()', () => {
    it('removes the task from the list', () => {
      const task = service.addTask(makeTask());
      service.deleteTask(task.id);
      expect(service.filteredTasks().length).toBe(0);
    });

    it('does not remove other tasks', () => {
      const a = service.addTask(makeTask({ title: 'A' }));
      const b = service.addTask(makeTask({ title: 'B' }));
      service.deleteTask(a.id);

      expect(service.filteredTasks().length).toBe(1);
      expect(service.getTaskById(b.id)).toBeDefined();
    });

    it('emits a "deleted" event', () => {
      const task = service.addTask(makeTask());
      const events: { type: string; taskId: string }[] = [];
      service.taskEvents$.subscribe((e) => events.push(e));

      service.deleteTask(task.id);
      expect(events[0].type).toBe('deleted');
      expect(events[0].taskId).toBe(task.id);
    });

    it('emits a notification containing the task title', (done) => {
      const task = service.addTask(makeTask({ title: 'Gone Task' }));
      // BehaviorSubject replays the current value on subscribe — filter to the
      // "deleted" message specifically so done() is only called once.
      service.notification$.subscribe((msg) => {
        if (msg?.includes('deleted')) {
          expect(msg).toContain('Gone Task');
          done();
        }
      });
      service.deleteTask(task.id);
    });

    it('does nothing when the id is not found', () => {
      service.addTask(makeTask());
      service.deleteTask('nonexistent-id');
      expect(service.filteredTasks().length).toBe(1);
    });
  });

  // ─── getTaskById() ─────────────────────────────────────────────────────────

  describe('getTaskById()', () => {
    it('returns the task matching the id', () => {
      const task = service.addTask(makeTask({ title: 'Find Me' }));
      expect(service.getTaskById(task.id)?.title).toBe('Find Me');
    });

    it('returns undefined for an unknown id', () => {
      expect(service.getTaskById('no-such-id')).toBeUndefined();
    });
  });

  // ─── filteredTasks computed ────────────────────────────────────────────────

  describe('filteredTasks computed', () => {
    beforeEach(() => {
      service.addTask(makeTask({ title: 'Alpha', priority: 'low' }));
      service.addTask(makeTask({ title: 'Beta', priority: 'high' }));
      service.addTask(makeTask({ title: 'Gamma', priority: 'critical' }));
    });

    it('returns all tasks when no filters are active', () => {
      expect(service.filteredTasks().length).toBe(3);
    });

    it('filters by status', () => {
      const beta = service.filteredTasks().find((t) => t.title === 'Beta')!;
      service.updateTask(beta.id, { status: 'done' });
      service.filterStatus.set('done');

      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].title).toBe('Beta');
    });

    it('filters by priority', () => {
      service.filterPriority.set('critical');
      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].title).toBe('Gamma');
    });

    it('filters by title using searchQuery', () => {
      service.searchQuery.set('alpha');
      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].title).toBe('Alpha');
    });

    it('filters by description using searchQuery', () => {
      service.searchQuery.set('test description');
      expect(service.filteredTasks().length).toBe(3);
    });

    it('filters by tags using searchQuery', () => {
      service.searchQuery.set('angular');
      expect(service.filteredTasks().length).toBe(3);
    });

    it('returns empty array when no tasks match the search query', () => {
      service.searchQuery.set('zzznomatch');
      expect(service.filteredTasks().length).toBe(0);
    });

    it('sorts by priority descending (default)', () => {
      service.sortField.set('priority');
      const titles = service.filteredTasks().map((t) => t.title);
      expect(titles).toEqual(['Gamma', 'Beta', 'Alpha']);
    });

    it('sorts by title A-Z', () => {
      service.sortField.set('title');
      const titles = service.filteredTasks().map((t) => t.title);
      expect(titles).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('sorts by elapsed time descending', () => {
      const tasks = service.filteredTasks();
      service.updateTask(tasks[1].id, { elapsedSeconds: 100 }); // Beta
      service.sortField.set('elapsed');

      expect(service.filteredTasks()[0].elapsedSeconds).toBe(100);
    });

    it('combines status filter and search query', () => {
      const alpha = service.filteredTasks().find((t) => t.title === 'Alpha')!;
      service.updateTask(alpha.id, { status: 'done' });
      service.filterStatus.set('done');
      service.searchQuery.set('alpha');

      expect(service.filteredTasks().length).toBe(1);
    });
  });

  // ─── stats computed ────────────────────────────────────────────────────────

  describe('stats computed', () => {
    it('returns zeroes when the list is empty', () => {
      const s = service.stats();
      expect(s.total).toBe(0);
      expect(s.todo).toBe(0);
      expect(s.inProgress).toBe(0);
      expect(s.paused).toBe(0);
      expect(s.done).toBe(0);
      expect(s.totalElapsed).toBe(0);
    });

    it('counts total tasks correctly', () => {
      service.addTask(makeTask());
      service.addTask(makeTask());
      expect(service.stats().total).toBe(2);
    });

    it('counts tasks per status', () => {
      const a = service.addTask(makeTask());
      const b = service.addTask(makeTask());
      service.addTask(makeTask());

      service.updateTask(a.id, { status: 'in-progress' });
      service.updateTask(b.id, { status: 'done' });

      const s = service.stats();
      expect(s.inProgress).toBe(1);
      expect(s.done).toBe(1);
      expect(s.todo).toBe(1);
    });

    it('sums elapsedSeconds across all tasks', () => {
      const a = service.addTask(makeTask());
      const b = service.addTask(makeTask());
      service.updateTask(a.id, { elapsedSeconds: 120 });
      service.updateTask(b.id, { elapsedSeconds: 80 });

      expect(service.stats().totalElapsed).toBe(200);
    });
  });

  // ─── runningTask computed ──────────────────────────────────────────────────

  describe('runningTask computed', () => {
    it('returns null when no timer is active', () => {
      service.addTask(makeTask());
      expect(service.runningTask()).toBeNull();
    });

    it('returns the task whose timer is running', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      expect(service.runningTask()?.id).toBe(task.id);
    });
  });

  // ─── startTimer() ──────────────────────────────────────────────────────────

  describe('startTimer()', () => {
    it('sets activeSessionStart to a number and status to in-progress', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);

      const updated = service.getTaskById(task.id)!;
      expect(typeof updated.activeSessionStart).toBe('number');
      expect(updated.status).toBe('in-progress');
    });

    it('pauses the currently running timer before starting a new one', () => {
      const a = service.addTask(makeTask({ title: 'A' }));
      const b = service.addTask(makeTask({ title: 'B' }));

      service.startTimer(a.id);
      service.startTimer(b.id);

      expect(service.getTaskById(a.id)!.activeSessionStart).toBeNull();
      expect(service.getTaskById(b.id)!.activeSessionStart).not.toBeNull();
    });

    it('emits a "timer-start" event', () => {
      const task = service.addTask(makeTask());
      const events: { type: string; taskId: string }[] = [];
      service.taskEvents$.subscribe((e) => events.push(e));

      service.startTimer(task.id);
      expect(events[0].type).toBe('timer-start');
    });

    it('does not restart a timer that is already running', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      const firstStart = service.getTaskById(task.id)!.activeSessionStart;

      service.startTimer(task.id);
      expect(service.getTaskById(task.id)!.activeSessionStart).toBe(firstStart);
    });
  });

  // ─── pauseTimer() ──────────────────────────────────────────────────────────

  describe('pauseTimer()', () => {
    it('clears activeSessionStart and sets status to paused', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      service.pauseTimer(task.id);

      const updated = service.getTaskById(task.id)!;
      expect(updated.activeSessionStart).toBeNull();
      expect(updated.status).toBe('paused');
    });

    it('accumulates elapsed seconds from the session', fakeAsync(() => {
      jasmine.clock().install();
      const task = service.addTask(makeTask());

      // Manually set activeSessionStart 10 seconds in the past
      const tenSecondsAgo = Date.now() - 10_000;
      service.updateTask(task.id, { activeSessionStart: tenSecondsAgo });
      service.pauseTimer(task.id);

      const updated = service.getTaskById(task.id)!;
      expect(updated.elapsedSeconds).toBeGreaterThanOrEqual(10);

      jasmine.clock().uninstall();
      tick(0);
    }));

    it('emits a "timer-pause" event', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);

      const events: { type: string; taskId: string }[] = [];
      service.taskEvents$.subscribe((e) => events.push(e));
      service.pauseTimer(task.id);

      expect(events[0].type).toBe('timer-pause');
    });

    it('does nothing if the timer is not running', () => {
      const task = service.addTask(makeTask());
      service.pauseTimer(task.id); // timer was never started

      expect(service.getTaskById(task.id)!.elapsedSeconds).toBe(0);
    });
  });

  // ─── resetTimer() ──────────────────────────────────────────────────────────

  describe('resetTimer()', () => {
    it('resets elapsedSeconds to 0 and clears activeSessionStart', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      service.updateTask(task.id, { elapsedSeconds: 300 });
      service.resetTimer(task.id);

      const updated = service.getTaskById(task.id)!;
      expect(updated.elapsedSeconds).toBe(0);
      expect(updated.activeSessionStart).toBeNull();
    });
  });

  // ─── completeTask() ────────────────────────────────────────────────────────

  describe('completeTask()', () => {
    it('sets status to done', () => {
      const task = service.addTask(makeTask());
      service.completeTask(task.id);
      expect(service.getTaskById(task.id)!.status).toBe('done');
    });

    it('sets completedAt', () => {
      const task = service.addTask(makeTask());
      service.completeTask(task.id);
      expect(service.getTaskById(task.id)!.completedAt).toBeDefined();
    });

    it('pauses the timer if it was running', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      service.completeTask(task.id);
      expect(service.getTaskById(task.id)!.activeSessionStart).toBeNull();
    });

    it('emits a completion notification', (done) => {
      const task = service.addTask(makeTask());
      service.notification$.subscribe((msg) => {
        if (msg?.includes('completed')) {
          expect(msg).toContain('completed');
          done();
        }
      });
      service.completeTask(task.id);
    });
  });

  // ─── setStatus() ───────────────────────────────────────────────────────────

  describe('setStatus()', () => {
    it('delegates to completeTask() when status is "done"', () => {
      const task = service.addTask(makeTask());
      spyOn(service, 'completeTask').and.callThrough();
      service.setStatus(task.id, 'done');
      expect(service.completeTask).toHaveBeenCalledWith(task.id);
    });

    it('pauses a running timer when switching to "paused"', () => {
      const task = service.addTask(makeTask());
      service.startTimer(task.id);
      service.setStatus(task.id, 'paused');
      expect(service.getTaskById(task.id)!.activeSessionStart).toBeNull();
    });

    it('updates status directly for non-done statuses', () => {
      const task = service.addTask(makeTask());
      service.setStatus(task.id, 'in-progress');
      expect(service.getTaskById(task.id)!.status).toBe('in-progress');
    });
  });

  // ─── notification$ ─────────────────────────────────────────────────────────

  describe('notification$', () => {
    it('starts with a null value', (done) => {
      service.notification$.subscribe((msg) => {
        expect(msg).toBeNull();
        done();
      });
    });

    it('clears the notification after 3 seconds', fakeAsync(() => {
      const messages: (string | null)[] = [];
      service.notification$.subscribe((m) => messages.push(m));

      service.addTask(makeTask());
      tick(3000);

      // last value should be null (auto-dismiss)
      expect(messages[messages.length - 1]).toBeNull();
    }));
  });

  // ─── localStorage persistence ──────────────────────────────────────────────

  describe('localStorage persistence', () => {
    it('persists tasks to localStorage when a task is added', () => {
      // effect() is synchronous in test environment
      TestBed.flushEffects();
      service.addTask(makeTask({ title: 'Persisted' }));
      TestBed.flushEffects();

      const stored = JSON.parse(localStorage.getItem('taskflow_tasks')!);
      expect(stored.some((t: { title: string }) => t.title === 'Persisted')).toBeTrue();
    });

    it('loads tasks from localStorage on init', () => {
      // Pre-populate storage with one task
      const seed = [{ id: '1', title: 'From Storage', description: '', priority: 'low',
        status: 'todo', tags: [], estimatedMinutes: 0, elapsedSeconds: 0,
        activeSessionStart: null, createdAt: new Date(), updatedAt: new Date() }];
      localStorage.setItem('taskflow_tasks', JSON.stringify(seed));

      // Re-create the service so it reads from storage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(TaskService);

      expect(freshService.filteredTasks().length).toBe(1);
      expect(freshService.filteredTasks()[0].title).toBe('From Storage');
    });
  });
});