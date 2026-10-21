import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EventsService } from '../../services/events.service';
import { CategoriesService } from '../../../categories/services/categories.service';
import { DepartmentsService } from '../../../departments/services/departments.service';
import { LocationsService } from '../../../locations/services/locations.service';
import { UsersService } from '../../../users/services/users.service';

import { EventItem, CreateEventDto } from '../../models/event.model';
import { Category } from '../../../categories/models/category.model';
import { Department } from '../../../departments/models/department.model';
import { LocationItem } from '../../../locations/models/location.model';
import { User } from '../../../users/models/user.model';
import { ApiError, EventStatus } from '../../../../shared/interfaces/api-types.interface';

const dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startTime')?.value;
  const end = group.get('endTime')?.value;
  if (start && end && new Date(start) >= new Date(end)) {
    return { invalidDateRange: true };
  }
  return null;
};

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './events-page.component.html',
  styleUrl: './events-page.component.scss',
})
export class EventsPageComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly locationsService = inject(LocationsService);
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  events = signal<EventItem[]>([]);
  categories = signal<Category[]>([]);
  departments = signal<Department[]>([]);
  locations = signal<LocationItem[]>([]);
  users = signal<User[]>([]);

  // Solo mostramos registros activos en los selectores de creación
  activeCategories = computed(() => this.categories().filter((c) => c.isActive));
  activeDepartments = computed(() => this.departments().filter((d) => d.isActive));
  activeLocations = computed(() => this.locations().filter((l) => l.isActive));
  activeUsers = computed(() => this.users().filter((u) => u.isActive));

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  selectedEventDetail = signal<EventItem | null>(null);

  displayedColumns: string[] = [
    'title',
    'schedule',
    'categoryDept',
    'location',
    'recurrence',
    'status',
    'actions',
  ];

  filterForm = this.fb.nonNullable.group({
    departmentId: [''],
    categoryId: [''],
    locationId: [''],
    status: ['' as EventStatus | ''],
  });

  eventForm = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      description: this.fb.nonNullable.control(''),
      startTime: this.fb.nonNullable.control('', [Validators.required]),
      endTime: this.fb.nonNullable.control('', [Validators.required]),
      isAllDay: this.fb.nonNullable.control(false),
      categoryId: this.fb.nonNullable.control('', [Validators.required]),
      departmentId: this.fb.nonNullable.control('', [Validators.required]),
      locationId: this.fb.control<string | null>(null),
      organizerId: this.fb.nonNullable.control('', [Validators.required]),
      meetingUrl: this.fb.nonNullable.control(''),
      status: this.fb.nonNullable.control<EventStatus>('SCHEDULED'),
      isRecurring: this.fb.nonNullable.control(false),
      rrule: this.fb.nonNullable.control(''),
      recurrenceEnd: this.fb.nonNullable.control(''),
    },
    { validators: [dateRangeValidator] },
  );

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadEvents();
  }

  loadCatalogs(): void {
    forkJoin({
      categories: this.categoriesService.listarTodos(),
      departments: this.departmentsService.listarTodos(),
      locations: this.locationsService.listarTodos(),
      users: this.usersService.listarTodos(),
    }).subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.departments.set(res.departments);
        this.locations.set(res.locations);
        this.users.set(res.users);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(`Error cargando catálogos: ${err.message}`);
      },
    });
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = this.filterForm.getRawValue();
    this.eventsService.listarTodos(filters).subscribe({
      next: (data) => {
        this.events.set(data);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.loadEvents();
  }

  clearFilters(): void {
    this.filterForm.reset({
      departmentId: '',
      categoryId: '',
      locationId: '',
      status: '',
    });
    this.loadEvents();
  }

  onRecurringChange(): void {
    const isRec = this.eventForm.controls.isRecurring.value;
    if (isRec) {
      this.eventForm.controls.rrule.setValidators([Validators.required]);
      if (!this.eventForm.controls.rrule.value) {
        this.eventForm.controls.rrule.setValue('FREQ=WEEKLY;INTERVAL=1');
      }
    } else {
      this.eventForm.controls.rrule.clearValidators();
      this.eventForm.controls.rrule.setValue('');
      this.eventForm.controls.recurrenceEnd.setValue('');
    }
    this.eventForm.controls.rrule.updateValueAndValidity();
  }

  // Convierte ISO UTC del backend a formato YYYY-MM-DDTHH:mm local para el input datetime-local
  private toLocalInputDateTime(isoString?: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.eventForm.getRawValue();

    // Construcción limpia de DTO con fechas en ISO 8601 UTC
    const payload: CreateEventDto = {
      title: raw.title.trim(),
      startTime: new Date(raw.startTime).toISOString(),
      endTime: new Date(raw.endTime).toISOString(),
      isAllDay: raw.isAllDay,
      isRecurring: raw.isRecurring,
      status: raw.status,
      categoryId: raw.categoryId,
      departmentId: raw.departmentId,
      organizerId: raw.organizerId,
      ...(raw.description.trim() ? { description: raw.description.trim() } : {}),
      ...(raw.locationId ? { locationId: raw.locationId } : {}),
      ...(raw.meetingUrl.trim() ? { meetingUrl: raw.meetingUrl.trim() } : {}),
      ...(raw.isRecurring && raw.rrule.trim() ? { rrule: raw.rrule.trim() } : {}),
      ...(raw.isRecurring && raw.recurrenceEnd
        ? { recurrenceEnd: new Date(raw.recurrenceEnd).toISOString() }
        : {}),
    };

    const currentId = this.editingId();
    const request$ = currentId
      ? this.eventsService.modificar(currentId, payload)
      : this.eventsService.crear(payload);

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.loadEvents();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  startEdit(ev: EventItem): void {
    this.editingId.set(ev.id);
    this.eventForm.patchValue({
      title: ev.title,
      description: ev.description ?? '',
      startTime: this.toLocalInputDateTime(ev.startTime),
      endTime: this.toLocalInputDateTime(ev.endTime),
      isAllDay: ev.isAllDay,
      categoryId: ev.categoryId,
      departmentId: ev.departmentId,
      locationId: ev.locationId ?? null,
      organizerId: ev.organizerId,
      meetingUrl: ev.meetingUrl ?? '',
      status: ev.status,
      isRecurring: ev.isRecurring,
      rrule: ev.rrule ?? '',
      recurrenceEnd: this.toLocalInputDateTime(ev.recurrenceEnd),
    });
    this.onRecurringChange();
  }

  cancelEventStatus(ev: EventItem): void {
    this.eventsService.cancelarEvento(ev.id).subscribe({
      next: () => this.loadEvents(),
      error: (err: ApiError) => this.errorMessage.set(err.message),
    });
  }

  viewDetail(ev: EventItem): void {
    this.selectedEventDetail.set(ev);
  }

  getCategoryName(ev: EventItem): string {
    return ev.category?.name || this.categories().find((c) => c.id === ev.categoryId)?.name || '—';
  }

  getDepartmentName(ev: EventItem): string {
    return (
      ev.department?.name || this.departments().find((d) => d.id === ev.departmentId)?.name || '—'
    );
  }

  getLocationName(ev: EventItem): string {
    if (!ev.locationId) return 'Sin ubicación';
    return (
      ev.location?.name ||
      this.locations().find((l) => l.id === ev.locationId)?.name ||
      'Sin ubicación'
    );
  }

  getOrganizerName(ev: EventItem): string {
    return (
      ev.organizer?.fullName || this.users().find((u) => u.id === ev.organizerId)?.fullName || '—'
    );
  }

  resetForm(): void {
    this.editingId.set(null);
    this.eventForm.reset({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      categoryId: '',
      departmentId: '',
      locationId: null,
      organizerId: '',
      meetingUrl: '',
      status: 'SCHEDULED',
      isRecurring: false,
      rrule: '',
      recurrenceEnd: '',
    });
    this.onRecurringChange();
  }
}
