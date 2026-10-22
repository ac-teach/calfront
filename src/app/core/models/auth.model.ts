import { Role } from '../../shared/interfaces/api-types.interface';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
