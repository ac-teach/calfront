import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocationItem, CreateLocationDto, UpdateLocationDto } from '../models/location.model';

@Injectable({
  providedIn: 'root',
})
export class LocationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/locations`;

  listarTodos(): Observable<LocationItem[]> {
    return this.http.get<LocationItem[]>(this.baseUrl);
  }

  buscarPorId(id: string): Observable<LocationItem> {
    return this.http.get<LocationItem>(`${this.baseUrl}/${id}`);
  }

  crear(dto: CreateLocationDto): Observable<LocationItem> {
    return this.http.post<LocationItem>(this.baseUrl, dto);
  }

  modificar(id: string, dto: UpdateLocationDto): Observable<LocationItem> {
    return this.http.patch<LocationItem>(`${this.baseUrl}/${id}`, dto);
  }

  desactivar(id: string, isActive: boolean): Observable<LocationItem> {
    return this.http.patch<LocationItem>(`${this.baseUrl}/${id}`, { isActive });
  }
}
