# ⬡ TaskFlow — Angular 17 Interview Practice Project

A full-featured **Task Manager with Timers** built with Angular 17+ to help you practice and demonstrate key Angular concepts for junior developer interviews.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm start

# Open http://localhost:4200
```

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── models/
│   │   └── task.model.ts           ← TypeScript interfaces, types, helpers
│   ├── services/
│   │   └── task.service.ts         ← Injectable service, Signals, RxJS
│   ├── components/
│   │   ├── task-board/             ← Main page (smart/container component)
│   │   ├── task-card/              ← Presentational component
│   │   ├── task-form/              ← Reactive Form modal
│   │   ├── timer-display/          ← OnInit/OnDestroy with RxJS interval
│   │   └── stats-panel/            ← Pure display component (OnPush)
│   ├── pipes/
│   │   └── duration.pipe.ts        ← Custom pure Pipe
│   ├── directives/
│   │   └── priority-highlight.directive.ts ← Attribute Directive
│   ├── app.component.ts            ← Root standalone component
│   ├── app.config.ts               ← ApplicationConfig (new bootstrap API)
│   └── app.routes.ts               ← Lazy-loaded routes
└── styles.scss                     ← Global CSS variables + theme
```

---

## 📚 Angular Concepts Covered (Interview Checklist)

### ✅ Architecture
| Concept | Where |
|---|---|
| Standalone Components | All components (`standalone: true`) |
| ApplicationConfig bootstrap | `app.config.ts` |
| Lazy loading with `loadComponent` | `app.routes.ts` |
| Smart vs Presentational components | `task-board` (smart) vs `task-card` (dumb) |
| Dependency Injection with `inject()` | `task-board.component.ts`, `task-form.component.ts` |

### ✅ Signals (Angular 16+)
| Concept | Where |
|---|---|
| `signal()` — writable signal | `TaskService._tasks`, `showForm`, `notification` |
| `computed()` — derived state | `filteredTasks`, `stats`, `runningTask`, `currentViewTitle` |
| `effect()` — side effects | localStorage auto-persist in `TaskService` |
| `signal.update()` — mutate by function | All task mutations in `TaskService` |
| `signal.set()` — direct assignment | UI state in `TaskBoardComponent` |

### ✅ RxJS & Observables
| Concept | Where |
|---|---|
| `Subject` — event bus | `_taskEvents$` in `TaskService` |
| `BehaviorSubject` — stateful stream | `_notification$` in `TaskService` |
| `interval()` — recurring timer | `TimerDisplayComponent.ngOnInit()` |
| `Subscription` + `unsubscribe()` | `TaskBoardComponent._subs` |
| `Subscription.add()` — group subs | `TaskBoardComponent.ngOnInit()` |

### ✅ Reactive Forms
| Concept | Where |
|---|---|
| `FormBuilder` + `FormGroup` | `TaskFormComponent` |
| `Validators` (built-in) | `required`, `minLength`, `maxLength`, `min`, `max` |
| Custom validator function | `noOnlySpaces()` |
| `form.status` (VALID/INVALID/PENDING) | Displayed live in `TaskFormComponent` |
| `form.dirty` / `form.touched` | `TaskFormComponent` template |
| `markAllAsTouched()` | On invalid submit in `TaskFormComponent` |
| `patchValue()` | Edit mode in `TaskFormComponent` |
| `getRawValue()` | Form submission in `TaskFormComponent` |

### ✅ Component Communication
| Concept | Where |
|---|---|
| `@Input({ required: true })` | `TaskCardComponent`, `StatsPanelComponent`, `TimerDisplayComponent` |
| `@Output()` + `EventEmitter` | `TaskCardComponent`, `TaskFormComponent`, `TimerDisplayComponent` |
| `@Input` with `transform` | `StatsPanelComponent` |

### ✅ Lifecycle Hooks
| Hook | Where & Why |
|---|---|
| `ngOnInit()` | Build form, subscribe to observables |
| `ngOnDestroy()` | Unsubscribe to prevent memory leaks |
| `ngOnChanges(SimpleChanges)` | Patch form when `editTask` input changes, directive update |

### ✅ Template Syntax (Angular 17 control flow)
| Syntax | Where |
|---|---|
| `@if / @else` | Conditional rendering throughout |
| `@for ... track` | Task grid, tags, nav items, options |
| `[class]` binding | Dynamic CSS classes |
| `[style.width.%]` | Timer progress bar |
| `(click)`, `(change)`, `(ngSubmit)` | Event bindings |
| `[ngModel]` / `(ngModelChange)` | Search input, sort select |
| `[disabled]` | Form submit, timer reset |

### ✅ Pipes
| Concept | Where |
|---|---|
| Custom `PipeTransform` pipe | `DurationPipe` — formats seconds → HH:MM:SS |
| `pure: true` pipe | `DurationPipe` — only re-runs when input changes |
| Pipe with argument | `{{ seconds \| duration:'short' }}` |

### ✅ Directives
| Concept | Where |
|---|---|
| Attribute Directive | `PriorityHighlightDirective` |
| `@HostBinding` | Sets CSS class and `data-` attribute |
| `@Input` on directive | `[appPriorityHighlight]="task.priority"` |
| `OnChanges` in directive | React to priority input changes |

### ✅ Performance
| Concept | Where |
|---|---|
| `ChangeDetectionStrategy.OnPush` | `TaskCardComponent`, `TimerDisplayComponent`, `StatsPanelComponent` |
| `track` in `@for` | All list renderings (prevents full re-render) |
| `pure` pipe | `DurationPipe` |

### ✅ Routing
| Concept | Where |
|---|---|
| `provideRouter()` | `app.config.ts` |
| `loadComponent` (lazy loading) | `app.routes.ts` |
| Redirect + wildcard routes | `app.routes.ts` |
| `RouterOutlet` | `AppComponent` |

### ✅ Persistence
| Concept | Where |
|---|---|
| `localStorage` read/write | `TaskService` — load on init, save via `effect()` |
| Seed data | Loaded when localStorage is empty |

---

## 🎯 Interview Q&A Quick Reference

**Q: What is the difference between `signal()` and `BehaviorSubject`?**
> `signal()` is Angular's built-in reactivity primitive — synchronous, glitch-free, and integrated with change detection. `BehaviorSubject` is RxJS — async, supports operators (map, filter, etc.), and is ideal for event streams and async workflows. Both are used in this project.

**Q: Why use `ChangeDetectionStrategy.OnPush`?**
> It tells Angular to only check a component when its `@Input` references change, an event originates from the component, or an async pipe resolves. This avoids unnecessary checks on every tick and improves performance. See `TaskCardComponent`.

**Q: What happens if you forget to unsubscribe from an `interval()`?**
> The subscription keeps running after the component is destroyed, causing a memory leak. Every timer tick tries to update a dead component. Always unsubscribe in `ngOnDestroy()`. See `TimerDisplayComponent`.

**Q: What is the `track` expression in `@for`?**
> It's Angular's identity function for list items. When the list changes, Angular uses `track` to match existing DOM nodes to new data, reusing elements instead of recreating them. Using `task.id` is better than `$index` for stable identity.

**Q: What is a pure vs impure pipe?**
> A **pure pipe** (default) only re-executes when its input reference changes — efficient for primitives. An **impure pipe** re-runs on every change detection cycle — necessary for mutable objects/arrays but expensive.

**Q: What is `inject()` vs constructor injection?**
> Both achieve the same DI result. `inject()` (functional injection) can be called at class field declaration level or inside functions, making it useful in standalone components and reducing constructor boilerplate. Angular recommends `inject()` in modern Angular.

---

## 🔥 Practice Tasks (extend this project)

1. **Add a `TrackByFunction`** (legacy `*ngFor trackBy`)
2. **Implement `takeUntilDestroyed()`** from `@angular/core/rxjs-interop`
3. **Add route params** — e.g., `/board/:id` for task detail page
4. **Write a unit test** for `DurationPipe` with Jasmine
5. **Add `HttpClient`** — mock a REST API with `json-server`
6. **Implement a `CanDeactivate` route guard** on the form
7. **Add `@angular/cdk/drag-drop`** to reorder tasks
8. **Convert `TaskService` to use `toSignal()`** from an Observable
9. **Add `NgRx`** for state management (senior-level practice)
10. **Add `@defer` blocks** for lazy-loading the stats panel

---

## 🛠️ Tech Stack

- **Angular 17.3** — Standalone components, new `@if`/`@for` control flow
- **TypeScript 5.4** — Strict mode enabled
- **RxJS 7.8** — Observables, Subject, BehaviorSubject
- **Angular Signals** — signal, computed, effect
- **Angular Reactive Forms** — FormBuilder, validators
- **Angular Router** — Lazy loading
- CSS Variables — Dark theme design tokens
- localStorage — Client-side persistence
