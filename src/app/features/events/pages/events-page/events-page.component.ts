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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
import { MatButtonToggleModule } from '@angular/material/button-toggle'; // <-- NUEVO IMPORT

import { ActivatedRoute } from '@angular/router';
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
    MatButtonToggleModule, // <-- REGISTRADO AQUÍ
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
  private readonly route = inject(ActivatedRoute);

  events = signal<EventItem[]>([]);
  categories = signal<Category[]>([]);
  departments = signal<Department[]>([]);
  locations = signal<LocationItem[]>([]);
  users = signal<User[]>([]);

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

  // Días de la semana para el mapeo de botones
  weekDays = [
    { value: 'MO', label: 'L' },
    { value: 'TU', label: 'M' },
    { value: 'WE', label: 'X' },
    { value: 'TH', label: 'J' },
    { value: 'FR', label: 'V' },
    { value: 'SA', label: 'S' },
    { value: 'SU', label: 'D' },
  ];

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
      // Controles personalizados para generar RRULE
      recurrenceType: this.fb.nonNullable.control('WEEKLY'),
      byDay: this.fb.nonNullable.control<string[]>([]),
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
      categories: this.categoriesService.listarTodos().pipe(catchError(() => of([]))),
      departments: this.departmentsService.listarTodos().pipe(catchError(() => of([]))),
      locations: this.locationsService.listarTodos().pipe(catchError(() => of([]))),
      users: this.usersService.listarTodos().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.departments.set(res.departments);
        this.locations.set(res.locations);
        this.users.set(res.users);
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
        const editId = this.route.snapshot.queryParamMap.get('editId');
        if (editId) {
          const targetEvent = data.find((e) => e.id === editId);
          if (targetEvent) {
            this.startEdit(targetEvent);
          }
        }
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
    this.filterForm.reset({ departmentId: '', categoryId: '', locationId: '', status: '' });
    this.loadEvents();
  }

  onRecurringChange(): void {
    if (!this.eventForm.controls.isRecurring.value) {
      this.eventForm.controls.recurrenceEnd.setValue('');
      this.eventForm.controls.byDay.setValue([]);
    }
  }

  private toLocalInputDateTime(isoString?: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  // Desencripta la cadena RRULE de la base de datos para pintar los controles
  private parseRRuleToForm(rrule: string | null | undefined): { type: string; days: string[] } {
    if (!rrule) return { type: 'WEEKLY', days: [] };

    let type = 'WEEKLY';
    let days: string[] = [];

    if (rrule.includes('FREQ=DAILY')) type = 'DAILY';
    else if (rrule.includes('FREQ=MONTHLY')) type = 'MONTHLY';
    else {
      type = 'WEEKLY';
      const byDayMatch = rrule.match(/BYDAY=([^;]+)/);
      if (byDayMatch) {
        days = byDayMatch[1].split(',');
      }
    }
    return { type, days };
  }

  // Genera la cadena RRULE exacta para FullCalendar y la Base de datos
  private buildRRuleString(type: string, days: string[]): string {
    let rule = `FREQ=${type};INTERVAL=1`;
    if (type === 'WEEKLY' && days.length > 0) {
      rule += `;BYDAY=${days.join(',')}`;
    }
    return rule;
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.eventForm.getRawValue();
    const generatedRRule = raw.isRecurring
      ? this.buildRRuleString(raw.recurrenceType, raw.byDay)
      : undefined;

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
      ...(generatedRRule ? { rrule: generatedRRule } : {}),
      ...(raw.isRecurring && raw.recurrenceEnd
        ? { recurrenceEnd: new Date(raw.recurrenceEnd).toISOString() }
        : {}),
    };

    const currentId = this.editingId();
    //imprimir payload en cosola para descartar front
    console.log(payload);
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
    const parsedRule = this.parseRRuleToForm(ev.rrule);

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
      recurrenceType: parsedRule.type,
      byDay: parsedRule.days,
      recurrenceEnd: this.toLocalInputDateTime(ev.recurrenceEnd),
    });
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
      recurrenceType: 'WEEKLY',
      byDay: [],
      recurrenceEnd: '',
    });
  }
}
