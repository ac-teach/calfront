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

import { CategoriesService } from '../../services/categories.service';
import { Category, CreateCategoryDto } from '../../models/category.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

@Component({
  selector: 'app-categories-page',
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
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);

  displayedColumns: string[] = ['color', 'name', 'slug', 'status', 'actions'];

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    color: ['#10B981', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    icon: [''],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.categoriesService.listarTodos().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  generateSlug(): void {
    const name = this.categoryForm.controls.name.value;
    if (!this.editingId() && name) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      this.categoryForm.controls.slug.setValue(slug);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.categoryForm.getRawValue();
    const payload: CreateCategoryDto = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      color: raw.color,
      ...(raw.icon.trim() ? { icon: raw.icon.trim() } : {}),
    };

    const currentId = this.editingId();
    const request$ = currentId
      ? this.categoriesService.modificar(currentId, payload)
      : this.categoriesService.crear(payload);

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.loadCategories();
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.categoryForm.patchValue({
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      icon: cat.icon ?? '',
    });
  }

  toggleStatus(cat: Category): void {
    this.categoriesService.desactivar(cat.id, !cat.isActive).subscribe({
      next: () => this.loadCategories(),
      error: (err: ApiError) => this.errorMessage.set(err.message),
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.categoryForm.reset({
      name: '',
      slug: '',
      color: '#10B981',
      icon: '',
    });
  }
}
