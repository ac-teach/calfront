import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  listarTodos(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  buscarPorId(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  crear(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, dto);
  }

  modificar(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`${this.baseUrl}/${id}`, dto);
  }

  // Desactivación lógica modificando isActive (sin borrar el registro físico)
  desactivar(id: string, isActive: boolean): Observable<Category> {
    return this.http.patch<Category>(`${this.baseUrl}/${id}`, { isActive });
  }
}