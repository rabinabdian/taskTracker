import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'board',
    pathMatch: 'full',
  },
  {
    path: 'board',
    loadComponent: () =>
      import('./components/task-board/task-board.component').then(
        (m) => m.TaskBoardComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'board',
  },
];
