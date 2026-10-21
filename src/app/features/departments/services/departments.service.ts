import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Department, CreateDepartmentDto, UpdateDepartmentDto } from '../models/department.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '${enviroment.apiUrl}/departments';

  listarTodos(): Observable<Department[]> {
    return this.http.get<Department[]>(this.baseUrl);
  }

  buscarPorId(id: string): Observable<Department> {
    return this.http.get<Department>('${this.baseUrl}/${id}');
  }

  crear(dto: CreateDepartmentDto): Observable<Department> {
    return this.http.post<Department>(this.baseUrl, dto);
  }

  modificar(id: string, dto: UpdateDepartmentDto): Observable<Department> {
    return this.http.patch<Department>('${this.baseUrl}/${id}', dto);
  }

  desactivar(id: string, isActive: boolean): Observable<Department> {
    return this.http.patch<Department>(`${this.baseUrl}/${id}`, { isActive });
  }
}
