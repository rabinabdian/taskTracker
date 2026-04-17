
# TaskTracker — Claude Code Rules

## Project Context
Angular 17 task manager built as a hands-on learning project for junior developer interview preparation.

---

## Learning Milestones Rule

When suggesting improvements or implementing features, always align work with the following milestone track. Prioritize earlier milestones over later ones unless the user specifies otherwise.

### Milestone 1 — Testing Foundation
- Unit test `DurationPipe`
- Unit test `TaskService` (addTask, deleteTask, computed stats signal)
- Unit test `task-form` custom validator (`noOnlySpaces`)
- Component test `TaskCardComponent` @Output emitters

### Milestone 2 — HTTP & Backend
- Replace localStorage with `HttpClient` (GET/POST/PUT/DELETE against json-server)
- Add `isLoading` signal shown during requests
- Add error handling with toast notifications
- Use `switchMap` to cancel in-flight requests when filters change

### Milestone 3 — Route Guards & Navigation
- `CanDeactivate` guard on task form (warn on unsaved changes)
- `TaskDetailComponent` at `/board/:id`
- Route resolver to pre-fetch task data
- Real `NotFoundComponent` for 404

### Milestone 4 — Advanced RxJS
- `debounceTime(300)` + `distinctUntilChanged()` on search input
- `switchMap` for chained HTTP calls
- `combineLatest` to merge filter + sort + search streams
- `retry(3)` on failed HTTP calls

### Milestone 5 — NgRx State Management
- `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`
- `tasks.actions.ts`, `tasks.reducer.ts`, `tasks.selectors.ts`
- HTTP calls moved to `tasks.effects.ts`

### Milestone 6 — Advanced UI
- `@defer` block for `StatsPanelComponent`
- CDK drag-drop for task reordering
- Angular Animations API for card transitions
- `FormArray` for tags input
- ARIA labels and keyboard navigation

---

## Immediate Code Quality Rules

- **No duplicate subscriptions** — subscribe once, in `ngOnInit` with `takeUntilDestroyed()`, not both as field initializers and in lifecycle hooks
- **Business logic in the service** — derived metrics like `completionRate` belong in `task.service.ts` computed signals, not in components
- **No hardcoded status/priority strings** — use the `TASK_STATUSES` and `TASK_PRIORITIES` constants from `task.model.ts`
- **Consistent form bindings** — do not mix `[(ngModel)]` with reactive forms in the same feature; prefer reactive forms throughout
- **No unnecessary `markForCheck()`** — only call it when data changes outside Angular's zone; do not call it on every timer tick for off-screen components

---

## Interview Readiness Rule

When explaining or implementing anything in this project, frame it in terms of interview questions the user should be able to answer. Always map a pattern back to its concept:

| Pattern used | Interview concept |
|---|---|
| `signal()`, `computed()`, `effect()` | Angular Signals reactivity |
| `Subject` vs `BehaviorSubject` | RxJS multicasting |
| `FormBuilder.group()` + validators | Reactive Forms |
| `ChangeDetectionStrategy.OnPush` + `markForCheck()` | Change Detection |
| `providedIn: 'root'` | Dependency Injection |
| `pure: true` on pipe | Pure vs impure pipes |
| `@HostBinding` in directive | Attribute directives |
| `takeUntilDestroyed()` | Subscription memory management |