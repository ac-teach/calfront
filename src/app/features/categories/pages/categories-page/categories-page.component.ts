import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesService } from '../../services/categories.service';
import { Category, CreateCategoryDto } from '../../models/category.model';
import { ApiError } from '../../../../shared/interfaces/api-types.interface';

@Component({
    selector: 'app-categories-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
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

        const rawValues = this.categoryForm.getRawValue();
        // Construimos explícitamente el DTO para no enviar propiedades extra ni strings vacíos en opcionales
        const payload: CreateCategoryDto = {
            name: rawValues.name.trim(),
            slug: rawValues.slug.trim(),
            color: rawValues.color,
            ...(rawValues.icon.trim() ? { icon: rawValues.icon.trim() } : {}),
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

    startEdit(category: Category): void {
        this.editingId.set(category.id);
        this.categoryForm.patchValue({
            name: category.name,
            slug: category.slug,
            color: category.color,
            icon: category.icon ?? '',
        });
    }

    toggleStatus(category: Category): void {
        this.categoriesService.desactivar(category.id, !category.isActive).subscribe({
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