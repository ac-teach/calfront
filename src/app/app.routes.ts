import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/categories/pages/categories-page/categories-page.component').then(
        (m) => m.CategoriesPageComponent,
      ),
  },
  {
    path: 'departments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/departments/pages/departments-page/departments-page.component').then(
        (m) => m.DepartmentsPageComponent,
      ),
  },
  {
    path: 'locations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/locations/pages/locations-page/locations-page.component').then(
        (m) => m.LocationsPageComponent,
      ),
  },

  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/events/pages/events-page/events-page.component').then(
        (m) => m.EventsPageComponent,
      ),
  },
  {
    path: 'calendar',
    //canActivate: [authGuard],
    loadComponent: () =>
      import('./features/events/pages/calendar-page/calendar-page.component').then(
        (m) => m.CalendarPageComponent,
      ),
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/users/pages/users-page/users-page.component').then(
        (m) => m.UsersPageComponent,
      ),
  },
];
``;
