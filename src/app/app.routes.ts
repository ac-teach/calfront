import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/pages/categories-page/categories-page.component').then(
        (m) => m.CategoriesPageComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'categories',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'categories',
  },
  {
    path: 'departments',
    loadComponent: () =>
      import('./features/departments/pages/departments-page/departments-page.component').then(
        (m) => m.DepartmentsPageComponent,
      ),
  },
  {
    path: 'locations',
    loadComponent: () =>
      import('./features/locations/pages/locations-page/locations-page.component').then(
        (m) => m.LocationsPageComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/pages/users-page/users-page.component').then(
        (m) => m.UsersPageComponent,
      ),
  },
  {
    path: 'events',
    loadComponent: () =>
      import('./features/events/pages/events-page/events-page.component').then(
        (m) => m.EventsPageComponent,
      ),
  },
  // Próximas fases según el orden recomendado:
  // { path: 'events', loadComponent: ... },
];
``;
