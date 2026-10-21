import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UsersService } from '../../services/users.service';
import { DepartmentsService } from '../../../departments/services/departments.service';
import { User, CreateUserDto, UpdateUserDto } from '../../models/user.model';
import { Department } from '../../../departments/models/department.model';
import { ApiError, Role } from '../../../../shared/interfaces/api-types.interface';

@Component({
  selector: 'app-users-page',
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
    MatProgressBarModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly fb = inject(FormBuilder);

  users = signal<User[]>([]);
  departments = signal<Department[]>([]);
  activeDepartments = computed(() => this.departments().filter((d) => d.isActive));

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  hidePassword = signal<boolean>(true);

  displayedColumns: string[] = ['fullName', 'email', 'role', 'department', 'status', 'actions'];

  // Formulario de filtros
  filterForm = this.fb.nonNullable.group({
    search: [''],
    role: ['' as Role | ''],
    departmentId: [''],
    isActive: ['' as boolean | ''],
  });

  // Formulario de Creación / Edición
  userForm = this.fb.group({
    fullName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
    role: this.fb.nonNullable.control<Role>('ORGANIZER', [Validators.required]),
    departmentId: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadUsers();
  }

  loadDepartments(): void {
    this.departmentsService.listarTodos().subscribe({
      next: (data) => this.departments.set(data),
      error: (err: ApiError) =>
        console.error('No se pudieron cargar los departamentos:', err.message),
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = this.filterForm.getRawValue();
    this.usersService.listarTodos(filters).subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      departmentId: '',
      isActive: '',
    });
    this.loadUsers();
  }

  getDepartmentName(user: User): string {
    if (user.department?.name) {
      return user.department.name;
    }
    if (!user.departmentId) {
      return 'Sin asignar';
    }
    const found = this.departments().find((d) => d.id === user.departmentId);
    return found ? found.name : 'Sin asignar';
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.userForm.getRawValue();
    const currentId = this.editingId();

    if (currentId) {
      // Contrato para PATCH: omitimos password si el campo quedó vacío al editar
      const updatePayload: UpdateUserDto = {
        fullName: raw.fullName.trim(),
        email: raw.email.trim().toLowerCase(),
        role: raw.role,
        departmentId: raw.departmentId || null,
        ...(raw.password.trim() ? { password: raw.password.trim() } : {}),
      };

      this.usersService.modificar(currentId, updatePayload).subscribe({
        next: () => {
          this.resetForm();
          this.loadUsers();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
    } else {
      // Contrato para POST
      const createPayload: CreateUserDto = {
        fullName: raw.fullName.trim(),
        email: raw.email.trim().toLowerCase(),
        password: raw.password.trim(),
        role: raw.role,
        ...(raw.departmentId ? { departmentId: raw.departmentId } : {}),
      };

      this.usersService.crear(createPayload).subscribe({
        next: () => {
          this.resetForm();
          this.loadUsers();
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
    }
  }

  startEdit(user: User): void {
    this.editingId.set(user.id);

    // En modo edición, la contraseña pasa a ser opcional
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.addValidators([Validators.minLength(8)]);
    this.userForm.controls.password.updateValueAndValidity();

    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.departmentId ?? null,
    });
  }

  toggleStatus(user: User): void {
    this.usersService.desactivar(user.id, !user.isActive).subscribe({
      next: () => this.loadUsers(),
      error: (err: ApiError) => this.errorMessage.set(err.message),
    });
  }

  resetForm(): void {
    this.editingId.set(null);

    // En modo creación, la contraseña vuelve a ser obligatoria
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.controls.password.updateValueAndValidity();

    this.userForm.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'ORGANIZER',
      departmentId: null,
    });
  }
}
