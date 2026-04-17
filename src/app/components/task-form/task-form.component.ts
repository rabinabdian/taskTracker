// ─── TaskFormComponent ────────────────────────────────────────────────────────
// Demonstrates: Reactive Forms, FormGroup, FormBuilder, Validators,
//               custom validator, Output EventEmitter, Two-way binding

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Task, TaskFormData, TaskPriority } from '../../models/task.model';

// ── Custom Validator ──────────────────────────────────────────────────────────
export function noOnlySpaces(control: AbstractControl): ValidationErrors | null {
  if (control.value && control.value.trim().length === 0) {
    return { noOnlySpaces: true };
  }
  return null;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-overlay" (click)="onOverlayClick($event)">
      <div class="form-panel">

        <div class="form-header">
          <h2>{{ editTask ? 'Edit Task' : 'New Task' }}</h2>
          <button class="btn-close" (click)="cancel.emit()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- Title -->
          <div class="field" [class.field-error]="isInvalid('title')">
            <label for="title">Title <span class="required">*</span></label>
            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="What needs to be done?"
              autocomplete="off"
            />
            @if (isInvalid('title')) {
              <span class="error-msg">{{ getError('title') }}</span>
            }
          </div>

          <!-- Description -->
          <div class="field">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              placeholder="Add more context…"
            ></textarea>
          </div>

          <!-- Priority + Estimate row -->
          <div class="field-row">
            <div class="field" [class.field-error]="isInvalid('priority')">
              <label for="priority">Priority <span class="required">*</span></label>
              <select id="priority" formControlName="priority">
                @for (p of priorities; track p.value) {
                  <option [value]="p.value">{{ p.label }}</option>
                }
              </select>
            </div>

            <div class="field" [class.field-error]="isInvalid('estimatedMinutes')">
              <label for="estimated">Estimate (min)</label>
              <input
                id="estimated"
                type="number"
                formControlName="estimatedMinutes"
                min="0"
                max="480"
                placeholder="30"
              />
              @if (isInvalid('estimatedMinutes')) {
                <span class="error-msg">0 – 480 min</span>
              }
            </div>
          </div>

          <!-- Tags -->
          <div class="field">
            <label for="tags">Tags <span class="hint">(comma-separated)</span></label>
            <input
              id="tags"
              type="text"
              formControlName="tags"
              placeholder="angular, rxjs, typescript"
            />
          </div>

          <!-- Form status display — demonstrates form.status & dirty/touched -->
          <div class="form-meta">
            <span class="status-badge" [class]="'status-' + form.status.toLowerCase()">
              Form: {{ form.status }}
            </span>
            @if (form.dirty) {
              <span class="dirty-badge">● unsaved changes</span>
            }
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancel.emit()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid">
              {{ editTask ? 'Save Changes' : 'Create Task' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    .form-panel {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      width: 100%;
      max-width: 520px;
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    .form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .form-header h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .btn-close {
      background: none; border: none;
      color: var(--text-muted); font-size: 1rem;
      cursor: pointer; padding: 4px 8px;
      border-radius: 6px;
      transition: color 0.2s;
    }
    .btn-close:hover { color: var(--text-primary); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .required { color: var(--accent-red); }
    .hint { color: var(--text-muted); font-size: 0.7rem; text-transform: none; letter-spacing: 0; font-weight: 400; }
    input, textarea, select {
      background: var(--surface-2);
      border: 1.5px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.9rem;
      padding: 10px 12px;
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--accent-blue); }
    .field-error input, .field-error select { border-color: var(--accent-red); }
    .error-msg { font-size: 0.72rem; color: var(--accent-red); }
    select option { background: var(--surface-1); }
    .form-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .status-badge {
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--surface-2);
      color: var(--text-muted);
    }
    .status-valid { color: var(--accent-green); border: 1px solid var(--accent-green); background: transparent; }
    .status-invalid { color: var(--accent-red); border: 1px solid var(--accent-red); background: transparent; }
    .dirty-badge { color: var(--accent-yellow); }
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent-blue);
      color: #fff;
    }
    .btn-primary:hover:not([disabled]) { filter: brightness(1.15); }
    .btn-primary[disabled] { opacity: 0.4; cursor: not-allowed; }
    .btn-secondary {
      background: var(--surface-2);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { border-color: var(--text-secondary); }
  `],
})
export class TaskFormComponent implements OnInit, OnChanges {
  @Input() editTask: Task | null = null;
  @Output() save = new EventEmitter<TaskFormData>();
  @Output() cancel = new EventEmitter<void>();

  private _fb = inject(FormBuilder);

  form!: FormGroup;

  readonly priorities: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: '🔵 Low' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'high', label: '🟠 High' },
    { value: 'critical', label: '🔴 Critical' },
  ];

  ngOnInit(): void {
    this._buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editTask'] && this.form) {
      this._patchForm();
    }
  }

  private _buildForm(): void {
    this.form = this._fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), noOnlySpaces]],
      description: ['', [Validators.maxLength(300)]],
      priority: ['medium' as TaskPriority, Validators.required],
      estimatedMinutes: [30, [Validators.min(0), Validators.max(480)]],
      tags: [''],
    });
    if (this.editTask) this._patchForm();
  }

  private _patchForm(): void {
    if (!this.editTask) return;
    this.form.patchValue({
      title: this.editTask.title,
      description: this.editTask.description,
      priority: this.editTask.priority,
      estimatedMinutes: this.editTask.estimatedMinutes,
      tags: this.editTask.tags.join(', '),
    });
    this.form.markAsPristine();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as TaskFormData);
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('form-overlay')) {
      this.cancel.emit();
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'This field is required.';
    if (c.errors['minlength']) return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    if (c.errors['maxlength']) return `Maximum ${c.errors['maxlength'].requiredLength} characters.`;
    if (c.errors['noOnlySpaces']) return 'Cannot be blank spaces.';
    return 'Invalid value.';
  }
}
