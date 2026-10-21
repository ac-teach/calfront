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
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DepartmentsService } from '../../services/departments.service';
import { Department, CreateDepartmentDto } from '../../models/department.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

@Component({
  selector: 'app-departments-page',
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
    MatProgressBarModule,
  ],
  templateUrl: './departments-page.component.html',
  styleUrl: './departments-page.component.scss',
})
export class DepartmentsPageComponent implements OnInit {
  private readonly departmentsService = inject(DepartmentsService);
  private readonly fb = inject(FormBuilder);

  departments = signal<Department[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);

  displayedColumns: string[] = ['color', 'name', 'slug', 'status', 'actions'];

  departmentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    color: ['#3B82F6', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
  });

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.departmentsService.listarTodos().subscribe({
      next: (data) => {
        this.departments.set(data);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  generateSlug(): void {
    const name = this.departmentForm.controls.name.value;
    if (!this.editingId() && name) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      this.departmentForm.controls.slug.setValue(slug);
    }
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.departmentForm.getRawValue();
    const payload: CreateDepartmentDto = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      color: raw.color,
    };

    const currentId = this.editingId();
    const request$ = currentId
      ? this.departmentsService.modificar(currentId, payload)
      : this.departmentsService.crear(payload);

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.loadDepartments();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  startEdit(dept: Department): void {
    this.editingId.set(dept.id);
    this.departmentForm.patchValue({
      name: dept.name,
      slug: dept.slug,
      color: dept.color,
    });
  }

  toggleStatus(dept: Department): void {
    this.departmentsService.desactivar(dept.id, !dept.isActive).subscribe({
      next: () => this.loadDepartments(),
      error: (err: ApiError) => this.errorMessage.set(err.message),
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.departmentForm.reset({
      name: '',
      slug: '',
      color: '#3B82F6',
    });
  }
}
