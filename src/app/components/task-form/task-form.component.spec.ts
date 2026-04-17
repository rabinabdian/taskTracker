import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';

import { TaskFormComponent, noOnlySpaces } from './task-form.component';
import { Task } from '../../models/task.model';

// ─── noOnlySpaces validator — pure function tests ─────────────────────────────

describe('noOnlySpaces validator', () => {
  function ctrl(value: unknown) {
    return new FormControl(value);
  }

  it('returns null for a normal string', () => {
    expect(noOnlySpaces(ctrl('Valid title'))).toBeNull();
  });

  it('returns null for an empty string (required handles that separately)', () => {
    expect(noOnlySpaces(ctrl(''))).toBeNull();
  });

  it('returns null for null value', () => {
    expect(noOnlySpaces(ctrl(null))).toBeNull();
  });

  it('returns { noOnlySpaces: true } for a single space', () => {
    expect(noOnlySpaces(ctrl(' '))).toEqual({ noOnlySpaces: true });
  });

  it('returns { noOnlySpaces: true } for multiple spaces', () => {
    expect(noOnlySpaces(ctrl('     '))).toEqual({ noOnlySpaces: true });
  });

  it('returns { noOnlySpaces: true } for tab characters', () => {
    expect(noOnlySpaces(ctrl('\t\t'))).toEqual({ noOnlySpaces: true });
  });

  it('returns { noOnlySpaces: true } for mixed whitespace', () => {
    expect(noOnlySpaces(ctrl('  \t  \n  '))).toEqual({ noOnlySpaces: true });
  });

  it('returns null when string has at least one non-space character', () => {
    expect(noOnlySpaces(ctrl('  a  '))).toBeNull();
  });
});

// ─── TaskFormComponent — form integration tests ───────────────────────────────

describe('TaskFormComponent (form integration)', () => {
  let fixture: ComponentFixture<TaskFormComponent>;
  let component: TaskFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit → _buildForm()
  });

  // ─── Initial state ──────────────────────────────────────────────────────────

  it('builds the form with default values on init', () => {
    expect(component.form.value).toEqual({
      title: '',
      description: '',
      priority: 'medium',
      estimatedMinutes: 30,
      tags: '',
    });
  });

  it('form is invalid initially because title is empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('form is valid when title meets all rules', () => {
    component.form.patchValue({ title: 'Valid Task' });
    expect(component.form.valid).toBeTrue();
  });

  // ─── title validators ───────────────────────────────────────────────────────

  it('title is invalid when only spaces (noOnlySpaces)', () => {
    component.form.get('title')!.setValue('   ');
    expect(component.form.get('title')!.hasError('noOnlySpaces')).toBeTrue();
  });

  it('title is invalid when shorter than 3 characters', () => {
    component.form.get('title')!.setValue('ab');
    expect(component.form.get('title')!.hasError('minlength')).toBeTrue();
  });

  it('title is invalid when longer than 80 characters', () => {
    component.form.get('title')!.setValue('a'.repeat(81));
    expect(component.form.get('title')!.hasError('maxlength')).toBeTrue();
  });

  it('title is invalid when empty (required)', () => {
    component.form.get('title')!.setValue('');
    expect(component.form.get('title')!.hasError('required')).toBeTrue();
  });

  it('title is valid at exactly 3 characters', () => {
    component.form.get('title')!.setValue('abc');
    expect(component.form.get('title')!.valid).toBeTrue();
  });

  it('title is valid at exactly 80 characters', () => {
    component.form.get('title')!.setValue('a'.repeat(80));
    expect(component.form.get('title')!.valid).toBeTrue();
  });

  // ─── estimatedMinutes validators ────────────────────────────────────────────

  it('estimatedMinutes is invalid below 0', () => {
    component.form.get('estimatedMinutes')!.setValue(-1);
    expect(component.form.get('estimatedMinutes')!.hasError('min')).toBeTrue();
  });

  it('estimatedMinutes is invalid above 480', () => {
    component.form.get('estimatedMinutes')!.setValue(481);
    expect(component.form.get('estimatedMinutes')!.hasError('max')).toBeTrue();
  });

  it('estimatedMinutes is valid at 0', () => {
    component.form.get('estimatedMinutes')!.setValue(0);
    expect(component.form.get('estimatedMinutes')!.valid).toBeTrue();
  });

  it('estimatedMinutes is valid at 480', () => {
    component.form.get('estimatedMinutes')!.setValue(480);
    expect(component.form.get('estimatedMinutes')!.valid).toBeTrue();
  });

  // ─── getError() ─────────────────────────────────────────────────────────────

  it('getError returns "Cannot be blank spaces." for noOnlySpaces', () => {
    component.form.get('title')!.setValue('   ');
    expect(component.getError('title')).toBe('Cannot be blank spaces.');
  });

  it('getError returns required message when title is empty', () => {
    component.form.get('title')!.setValue('');
    expect(component.getError('title')).toBe('This field is required.');
  });

  it('getError returns minlength message', () => {
    component.form.get('title')!.setValue('ab');
    expect(component.getError('title')).toBe('Minimum 3 characters.');
  });

  it('getError returns maxlength message', () => {
    component.form.get('title')!.setValue('a'.repeat(81));
    expect(component.getError('title')).toBe('Maximum 80 characters.');
  });

  it('getError returns empty string for unknown field', () => {
    expect(component.getError('nonexistent')).toBe('');
  });

  // ─── isInvalid() ────────────────────────────────────────────────────────────

  it('isInvalid returns false before the field is touched', () => {
    component.form.get('title')!.setValue('   ');
    expect(component.isInvalid('title')).toBeFalse();
  });

  it('isInvalid returns true after the field is touched and has an error', () => {
    const ctrl = component.form.get('title')!;
    ctrl.setValue('   ');
    ctrl.markAsTouched();
    expect(component.isInvalid('title')).toBeTrue();
  });

  it('isInvalid returns false for a valid touched field', () => {
    const ctrl = component.form.get('title')!;
    ctrl.setValue('Valid title');
    ctrl.markAsTouched();
    expect(component.isInvalid('title')).toBeFalse();
  });

  // ─── onSubmit() ─────────────────────────────────────────────────────────────

  it('does not emit save when form is invalid', () => {
    const emitted: unknown[] = [];
    component.save.subscribe((v) => emitted.push(v));
    component.onSubmit();
    expect(emitted.length).toBe(0);
  });

  it('marks all controls as touched when submitting an invalid form', () => {
    component.onSubmit();
    const allTouched = Object.values(component.form.controls).every((c) => c.touched);
    expect(allTouched).toBeTrue();
  });

  it('emits save with form values when form is valid', () => {
    const emitted: unknown[] = [];
    component.save.subscribe((v) => emitted.push(v));

    component.form.patchValue({ title: 'Valid Task', priority: 'high' });
    component.onSubmit();

    expect(emitted.length).toBe(1);
    expect((emitted[0] as { title: string }).title).toBe('Valid Task');
  });

  // ─── edit mode — ngOnChanges patchValue ─────────────────────────────────────

  it('patches form when editTask input is set after init', () => {
    const mockTask: Task = {
      id: '1', title: 'Edit Me', description: 'Some desc', priority: 'critical',
      status: 'todo', tags: ['a', 'b'], estimatedMinutes: 60, elapsedSeconds: 0,
      activeSessionStart: null, createdAt: new Date(), updatedAt: new Date(),
    };

    component.editTask = mockTask;
    component.ngOnChanges({
      editTask: { currentValue: mockTask, previousValue: null, firstChange: true, isFirstChange: () => true },
    });

    expect(component.form.value.title).toBe('Edit Me');
    expect(component.form.value.priority).toBe('critical');
    expect(component.form.value.tags).toBe('a, b');
  });

  it('marks form as pristine after patching for edit', () => {
    const mockTask: Task = {
      id: '1', title: 'Edit Me', description: '', priority: 'medium',
      status: 'todo', tags: [], estimatedMinutes: 30, elapsedSeconds: 0,
      activeSessionStart: null, createdAt: new Date(), updatedAt: new Date(),
    };

    component.editTask = mockTask;
    component.ngOnChanges({
      editTask: { currentValue: mockTask, previousValue: null, firstChange: true, isFirstChange: () => true },
    });

    expect(component.form.pristine).toBeTrue();
  });
});