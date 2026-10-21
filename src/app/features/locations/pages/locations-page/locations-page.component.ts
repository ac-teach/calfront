import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { LocationsService } from '../../services/locations.service';
import { LocationItem, CreateLocationDto } from '../../models/location.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './locations-page.component.html',
  styleUrl: './locations-page.component.scss',
})
export class LocationsPageComponent implements OnInit {
  private readonly locationsService = inject(LocationsService);
  private readonly fb = inject(FormBuilder);

  locations = signal<LocationItem[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);

  displayedColumns: string[] = ['name', 'type', 'capacity', 'exclusive', 'status', 'actions'];

  locationForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    capacity: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.pattern(/^[0-9]+$/),
    ]),
    isVirtual: this.fb.nonNullable.control(false),
    isExclusive: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.locationsService.listarTodos().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.locationForm.getRawValue();
    const parsedCapacity =
      raw.capacity !== null && raw.capacity !== undefined && String(raw.capacity) !== ''
        ? Number(raw.capacity)
        : undefined;

    const payload: CreateLocationDto = {
      name: raw.name.trim(),
      isVirtual: raw.isVirtual,
      isExclusive: raw.isExclusive,
      ...(parsedCapacity !== undefined ? { capacity: parsedCapacity } : {}),
    };

    const currentId = this.editingId();
    const request$ = currentId
      ? this.locationsService.modificar(currentId, payload)
      : this.locationsService.crear(payload);

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.loadLocations();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  startEdit(loc: LocationItem): void {
    this.editingId.set(loc.id);
    this.locationForm.patchValue({
      name: loc.name,
      capacity: loc.capacity ?? null,
      isVirtual: loc.isVirtual,
      isExclusive: loc.isExclusive,
    });
  }

  toggleStatus(loc: LocationItem): void {
    this.locationsService.desactivar(loc.id, !loc.isActive).subscribe({
      next: () => this.loadLocations(),
      error: (err: ApiError) => this.errorMessage.set(err.message),
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.locationForm.reset({
      name: '',
      capacity: null,
      isVirtual: false,
      isExclusive: true,
    });
  }
}
