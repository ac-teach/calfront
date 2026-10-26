// cat << 'EOF' > src/app/core/services/auth.service.ts;
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginDto } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'agenda_access_token';
  private readonly USER_KEY = 'agenda_user_data';

  currentUser = signal<AuthUser | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.token());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  isOrganizer = computed(() => this.currentUser()?.role === 'ORGANIZER');

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res);
      }),
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private setSession(authResult: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    }
    this.token.set(authResult.accessToken);
    this.currentUser.set(authResult.user);
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
//EOF;
