import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/clients-list/clients-list.page').then(m => m.ClientsListPage) },
  { path: 'new', loadComponent: () => import('./pages/client-form/client-form.page').then(m => m.ClientFormPage) },
  { path: ':id/edit', loadComponent: () => import('./pages/client-form/client-form.page').then(m => m.ClientFormPage) },
] satisfies Routes;
