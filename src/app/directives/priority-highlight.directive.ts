// ─── PriorityHighlightDirective ───────────────────────────────────────────────
// Demonstrates: Attribute Directive, HostBinding, Input, OnChanges

import {
  Directive,
  Input,
  HostBinding,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TaskPriority } from '../models/task.model';

@Directive({
  selector: '[appPriorityHighlight]',
  standalone: true,
})
export class PriorityHighlightDirective implements OnChanges {
  @Input('appPriorityHighlight') priority: TaskPriority = 'low';

  @HostBinding('class') cssClass = '';
  @HostBinding('attr.data-priority') dataPriority = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['priority']) {
      this.dataPriority = this.priority;
      this.cssClass = `priority-badge priority-${this.priority}`;
    }
  }
}
