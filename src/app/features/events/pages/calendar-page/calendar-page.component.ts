import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EventsService } from '../../services/events.service';
import { LocationsService } from '../../../locations/services/locations.service';
import { EventItem, EventException } from '../../models/event.model';
import { LocationItem } from '../../../locations/models/location.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

interface CalendarEventClickArg {
  event: {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
    extendedProps: Record<string, any>;
  };
}

interface CalendarEventInput {
  id: string;
  title: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  duration?: { milliseconds: number };
  rrule?: string;
  exdate?: string[];
  extendedProps: {
    rawEvent: EventItem;
    isRescheduledInstance: boolean;
    originalDateIso?: string;
    exceptionId?: string;
  };
}

interface SelectedOccurrence {
  event: EventItem;
  originalDateIso: string;
  displayStartIso: string;
  displayEndIso: string;
  exceptionId?: string;
  isRescheduled: boolean;
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FullCalendarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly locationsService = inject(LocationsService);
  private readonly fb = inject(FormBuilder);

  events = signal<EventItem[]>([]);
  locations = signal<LocationItem[]>([]);
  selectedOccurrence = signal<SelectedOccurrence | null>(null);
  eventExceptions = signal<EventException[]>([]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showRescheduleForm = signal<boolean>(false);

  rescheduleForm = this.fb.nonNullable.group({
    newStartTime: ['', [Validators.required]],
    newEndTime: ['', [Validators.required]],
  });

  calendarEvents = computed<CalendarEventInput[]>(() => {
    const items: CalendarEventInput[] = [];

    for (const ev of this.events()) {
      if (ev.status === 'CANCELLED') continue;

      const color = ev.category?.color || ev.department?.color || '#3B82F6';
      const durationMs = new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime();

      if (ev.isRecurring && ev.rrule) {
        const exceptions = ev.exceptions ?? [];
        const exdates = exceptions.map((ex) => ex.originalDate);

        items.push({
          id: ev.id,
          title: ev.title,
          allDay: ev.isAllDay,
          backgroundColor: color,
          borderColor: color,
          duration: { milliseconds: Math.max(durationMs, 1800000) },
          rrule: this.buildFullCalendarRRule(ev),
          exdate: exdates,
          extendedProps: { rawEvent: ev, isRescheduledInstance: false },
        });

        for (const ex of exceptions) {
          if (!ex.isCancelled && ex.newStartTime && ex.newEndTime) {
            items.push({
              id: `${ev.id}_ex_${ex.id}`,
              title: `${ev.title} (Reprogramado)`,
              start: ex.newStartTime,
              end: ex.newEndTime,
              allDay: ev.isAllDay,
              backgroundColor: '#F59E0B',
              borderColor: '#D97706',
              extendedProps: {
                rawEvent: ev,
                isRescheduledInstance: true,
                originalDateIso: ex.originalDate,
                exceptionId: ex.id,
              },
            });
          }
        }
      } else {
        items.push({
          id: ev.id,
          title: ev.title,
          start: ev.startTime,
          end: ev.endTime,
          allDay: ev.isAllDay,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { rawEvent: ev, isRescheduledInstance: false },
        });
      }
    }

    return items;
  });

  calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin],
    locale: 'es',
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
    },
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },

    // Nuevas configuraciones solicitadas:
    displayEventTime: true, // Oculta la hora en la pastilla del evento
    slotMinTime: '06:00:00', // Límite de inicio
    slotMaxTime: '19:00:00', // Límite de fin
    //eventContent: (arg: { event: { title: string }; timeText: string }) => {
    // arg.event.title es el nombre del evento
    // arg.timeText es la hora formateada por FullCalendar
    // return {
    // html: `
    // <div style="display: flex; flex-direction: column; overflow: hidden; padding: 1px 3px;">
    // <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
    //  ${arg.event.title}
    // </div>
    // ${
    //  arg.timeText
    //   ? `<div style="font-size: 0.8em; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${arg.timeText}</div>`
    //  : ''
    //  }
    //  </div>
    //  `,
    //};
    //},

    eventClick: (arg: CalendarEventClickArg) => this.onEventClick(arg),
    height: 'auto',
  };

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      events: this.eventsService.listarTodos({ status: 'SCHEDULED' }),
      locations: this.locationsService.listarTodos().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (res) => {
        this.events.set(res.events);
        this.locations.set(res.locations);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  private buildFullCalendarRRule(ev: EventItem): string {
    const dtstart = ev.startTime.replace(/[-:]/g, '').split('.')[0] + 'Z';
    let rule = ev.rrule?.trim() || 'FREQ=WEEKLY;INTERVAL=1';
    if (ev.recurrenceEnd && !rule.includes('UNTIL=')) {
      const until = ev.recurrenceEnd.replace(/[-:]/g, '').split('.')[0] + 'Z';
      rule = `${rule};UNTIL=${until}`;
    }
    return `DTSTART:${dtstart}\nRRULE:${rule}`;
  }

  onEventClick(clickInfo: CalendarEventClickArg): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showRescheduleForm.set(false);

    const props = clickInfo.event.extendedProps;
    const rawEvent: EventItem = props['rawEvent'];
    const isRescheduled: boolean = props['isRescheduledInstance'];

    const startIso = clickInfo.event.start?.toISOString() ?? rawEvent.startTime;
    const endIso = clickInfo.event.end?.toISOString() ?? rawEvent.endTime;
    const originalDateIso = isRescheduled ? props['originalDateIso'] : startIso;

    this.selectedOccurrence.set({
      event: rawEvent,
      originalDateIso,
      displayStartIso: startIso,
      displayEndIso: endIso,
      exceptionId: props['exceptionId'],
      isRescheduled,
    });

    this.rescheduleForm.patchValue({
      newStartTime: this.toLocalInputDateTime(startIso),
      newEndTime: this.toLocalInputDateTime(endIso),
    });

    if (rawEvent.isRecurring) {
      this.loadExceptionsForEvent(rawEvent.id);
    } else {
      this.eventExceptions.set([]);
    }
  }

  closePanel(): void {
    this.selectedOccurrence.set(null);
  }

  getLocationName(ev: EventItem): string {
    if (!ev.locationId) return 'Sin ubicación asignada';
    return (
      ev.location?.name ||
      this.locations().find((l) => l.id === ev.locationId)?.name ||
      'Sin ubicación'
    );
  }

  loadExceptionsForEvent(eventId: string): void {
    this.eventsService.getExceptions(eventId).subscribe({
      next: (list) => this.eventExceptions.set(list),
      error: () => this.eventExceptions.set([]),
    });
  }

  cancelSingleOccurrence(): void {
    const sel = this.selectedOccurrence();
    if (!sel) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventsService
      .cancelOccurrence(sel.event.id, { originalDate: sel.originalDateIso })
      .subscribe({
        next: () => {
          this.successMessage.set('Ocurrencia cancelada correctamente.');
          this.selectedOccurrence.set(null);
          this.loadInitialData();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  submitRescheduleOccurrence(): void {
    const sel = this.selectedOccurrence();
    if (!sel || this.rescheduleForm.invalid) return;

    const raw = this.rescheduleForm.getRawValue();
    const newStart = new Date(raw.newStartTime);
    const newEnd = new Date(raw.newEndTime);

    if (newStart >= newEnd) {
      this.errorMessage.set('La hora de inicio debe ser anterior a la de fin.');
      return;
    }

    this.isLoading.set(true);
    this.eventsService
      .rescheduleOccurrence(sel.event.id, {
        originalDate: sel.originalDateIso,
        newStartTime: newStart.toISOString(),
        newEndTime: newEnd.toISOString(),
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Ocurrencia reprogramada correctamente.');
          this.showRescheduleForm.set(false);
          this.selectedOccurrence.set(null);
          this.loadInitialData();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  restoreException(eventId: string, exceptionId: string): void {
    this.isLoading.set(true);
    this.eventsService.deleteException(eventId, exceptionId).subscribe({
      next: () => {
        this.successMessage.set('Excepción eliminada. La ocurrencia volvió a su regla original.');
        this.loadExceptionsForEvent(eventId);
        this.loadInitialData();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  private toLocalInputDateTime(isoString: string): string {
    const date = new Date(isoString);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }
}
