import { EventStatus } from '../../../shared/interfaces/api-types.interface';
import { Category } from '../../categories/models/category.model';
import { Department } from '../../departments/models/department.model';
import { LocationItem } from '../../locations/models/location.model';
import { User } from '../../users/models/user.model';

export interface EventException {
  id: string;
  eventId: string;
  originalDate: string;
  isCancelled: boolean;
  newStartTime?: string | null;
  newEndTime?: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isRecurring: boolean;
  rrule?: string | null;
  recurrenceEnd?: string | null;
  status: EventStatus;
  meetingUrl?: string | null;
  categoryId: string;
  departmentId: string;
  locationId?: string | null;
  organizerId: string;
  category?: Category;
  department?: Department;
  location?: LocationItem | null;
  organizer?: User;
  exceptions?: EventException[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  rrule?: string;
  recurrenceEnd?: string;
  status?: EventStatus;
  meetingUrl?: string;
  categoryId: string;
  departmentId: string;
  locationId?: string | null;
  organizerId: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventFilterParams {
  departmentId?: string;
  categoryId?: string;
  locationId?: string;
  status?: EventStatus | '';
}

// Contratos para Excepciones de Eventos Recurrentes
export interface CancelEventOccurrenceDto {
  originalDate: string;
}

export interface RescheduleEventOccurrenceDto {
  originalDate: string;
  newStartTime: string;
  newEndTime: string;
}
