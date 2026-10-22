import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
//import type { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
// import esLocale from '@fullcalendar/core/locales/es';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

import { EventsService } from '../../services/events.service';
import { EventItem, EventException } from '../../models/event.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

interface SelectedOccurrence {
  event: EventItem;
  originalDateIso: string; // Regla semántica: siempre identifica la ocurrencia original
  displayStartIso: string;
  displayEndIso: string;
  exceptionId?: string;
  isRescheduled: boolean;
}

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
  private readonly fb = inject(FormBuilder);

  events = signal<EventItem[]>([]);
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
        // Las fechas con excepción (canceladas o reprogramadas) se excluyen de la serie base
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
          extendedProps: {
            rawEvent: ev,
            isRescheduledInstance: false,
          },
        });

        // Agregamos como eventos individuales las ocurrencias reprogramadas (no canceladas)
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
        // Evento único
        items.push({
          id: ev.id,
          title: ev.title,
          start: ev.startTime,
          end: ev.endTime,
          allDay: ev.isAllDay,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            rawEvent: ev,
            isRescheduledInstance: false,
          },
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
    eventClick: (arg: CalendarEventClickArg) => this.onEventClick(arg),
    height: 'auto',
  };

  ngOnInit(): void {
    this.loadCalendarData();
  }

  loadCalendarData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventsService.listarTodos({ status: 'SCHEDULED' }).subscribe({
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

    // Respetamos la regla semántica: originalDate identifica siempre la ocurrencia original
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

  loadExceptionsForEvent(eventId: string): void {
    this.eventsService.getExceptions(eventId).subscribe({
      next: (list) => this.eventExceptions.set(list),
      error: () => this.eventExceptions.set([]),
    });
  }

  // POST /api/events/:eventId/exceptions/cancel
  cancelSingleOccurrence(): void {
    const sel = this.selectedOccurrence();
    if (!sel) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventsService
      .cancelOccurrence(sel.event.id, {
        originalDate: sel.originalDateIso,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Ocurrencia cancelada correctamente.');
          this.selectedOccurrence.set(null);
          this.loadCalendarData();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  // POST /api/events/:eventId/exceptions/reschedule
  submitRescheduleOccurrence(): void {
    const sel = this.selectedOccurrence();
    if (!sel || this.rescheduleForm.invalid) return;

    const raw = this.rescheduleForm.getRawValue();
    const newStart = new Date(raw.newStartTime);
    const newEnd = new Date(raw.newEndTime);

    if (newStart >= newEnd) {
      this.errorMessage.set('La nueva hora de inicio debe ser anterior a la nueva hora de fin.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

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
          this.loadCalendarData();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  // DELETE /api/events/:eventId/exceptions/:exceptionId
  restoreException(eventId: string, exceptionId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventsService.deleteException(eventId, exceptionId).subscribe({
      next: () => {
        this.successMessage.set('Excepción eliminada. La ocurrencia volvió a su regla original.');
        this.loadExceptionsForEvent(eventId);
        this.loadCalendarData();
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
