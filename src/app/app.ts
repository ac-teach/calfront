import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from './core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  standalone: true,
})
export class App {
  readonly authService = inject(AuthService);
  protected readonly title = signal('calfront');
  isSidenadOpen = signal(true);
  isSidenavOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Calendario', route: '/calendar', icon: 'calendar_month' },
    { label: 'Categorias', route: '/categories', icon: 'category' },
    { label: 'Departamentos', route: '/departments', icon: 'domain' },
    { label: 'Ubicaciones', route: '/locations', icon: 'place' },
    { label: 'Usuarios', route: '/users', icon: 'group' },
    { label: 'Eventos', route: '/events', icon: 'event' },
  ];

  toggleSidenav(): void {
    this.isSidenadOpen.update((val) => !val);
  }

  logout(): void {
    this.authService.logout();
  }
}
