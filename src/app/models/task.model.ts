// ─── Task Model ──────────────────────────────────────────────────────────────
// Demonstrates: TypeScript interfaces, enums, and type utilities

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in-progress' | 'paused' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  estimatedMinutes: number;
  elapsedSeconds: number;   // total accumulated seconds (from previous sessions)
  activeSessionStart: number | null; // Date.now() when timer last started, null if stopped
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  tags: string;
  estimatedMinutes: number;
}

// ─── Helper ──────────────────────────────────────────────────────────────────
export function createTask(data: TaskFormData): Task {
  return {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    status: 'todo',
    tags: data.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    estimatedMinutes: data.estimatedMinutes,
    elapsedSeconds: 0,
    activeSessionStart: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getLiveElapsed(task: Task): number {
  if (task.activeSessionStart === null) return task.elapsedSeconds;
  const sessionSeconds = Math.floor((Date.now() - task.activeSessionStart) / 1000);
  return task.elapsedSeconds + sessionSeconds;
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
