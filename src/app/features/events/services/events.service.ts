import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EventItem,
  CreateEventDto,
  UpdateEventDto,
  EventFilterParams,
  EventException,
  CancelEventOccurrenceDto,
  RescheduleEventOccurrenceDto,
} from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/events`;

  listarTodos(filters?: EventFilterParams): Observable<EventItem[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.departmentId) {
        params = params.set('departmentId', filters.departmentId);
      }
      if (filters.categoryId) {
        params = params.set('categoryId', filters.categoryId);
      }
      if (filters.locationId) {
        params = params.set('locationId', filters.locationId);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
    }

    return this.http.get<EventItem[]>(this.baseUrl, { params });
  }

  buscarPorId(id: string): Observable<EventItem> {
    return this.http.get<EventItem>(`${this.baseUrl}/${id}`);
  }

  crear(dto: CreateEventDto): Observable<EventItem> {
    return this.http.post<EventItem>(this.baseUrl, dto);
  }

  modificar(id: string, dto: UpdateEventDto): Observable<EventItem> {
    return this.http.patch<EventItem>(`${this.baseUrl}/${id}`, dto);
  }

  cancelarEvento(id: string): Observable<EventItem> {
    return this.http.patch<EventItem>(`${this.baseUrl}/${id}`, {
      status: 'CANCELLED',
    });
  }

  // --- Endpoints de Excepciones para Eventos Recurrentes ---
  getExceptions(eventId: string): Observable<EventException[]> {
    return this.http.get<EventException[]>(`${this.baseUrl}/${eventId}/exceptions`);
  }

  cancelOccurrence(eventId: string, dto: CancelEventOccurrenceDto): Observable<EventException> {
    return this.http.post<EventException>(`${this.baseUrl}/${eventId}/exceptions/cancel`, dto);
  }

  rescheduleOccurrence(
    eventId: string,
    dto: RescheduleEventOccurrenceDto,
  ): Observable<EventException> {
    return this.http.post<EventException>(`${this.baseUrl}/${eventId}/exceptions/reschedule`, dto);
  }

  deleteException(eventId: string, exceptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/exceptions/${exceptionId}`);
  }
}
