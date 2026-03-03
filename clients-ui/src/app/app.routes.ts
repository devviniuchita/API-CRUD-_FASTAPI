import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/clients', pathMatch: 'full' },
  { path: 'clients', loadChildren: () => import('./features/clients/clients.routes') },
];
