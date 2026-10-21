import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, CreateUserDto, UpdateUserDto, UserFilterParams } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  listarTodos(filters?: UserFilterParams): Observable<User[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search?.trim()) {
        params = params.set('search', filters.search.trim());
      }
      if (filters.role) {
        params = params.set('role', filters.role);
      }
      if (filters.departmentId) {
        params = params.set('departmentId', filters.departmentId);
      }
      if (filters.isActive !== undefined && filters.isActive !== '') {
        params = params.set('isActive', String(filters.isActive));
      }
    }

    return this.http.get<User[]>(this.baseUrl, { params });
  }

  buscarPorId(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  crear(dto: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.baseUrl, dto);
  }

  modificar(id: string, dto: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, dto);
  }

  desactivar(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, { isActive });
  }
}
