//import { Role } from '../../../../shared/interfaces/api-types.interface';
import { Department } from '../../departments/models/department.model';
import { Role } from '../../../shared/interfaces/api-types.interface';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  departmentId?: string | null;
  department?: Department | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
  departmentId?: string | null;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  role?: Role;
  departmentId?: string | null;
  isActive?: boolean;
}

export interface UserFilterParams {
  search?: string;
  role?: Role | '';
  departmentId?: string;
  isActive?: boolean | '';
}
