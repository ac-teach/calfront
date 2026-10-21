export interface Department {
  id: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  createAt?: string;
}

export interface CreateDepartmentDto {
  name: string;
  slug: string;
  color?: string;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  isActive?: boolean;
}
