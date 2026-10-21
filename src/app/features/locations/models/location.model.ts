export interface LocationItem {
  id: string;
  name: string;
  capacity?: number | null;
  isVirtual: boolean;
  isExclusive: boolean;
  isActive: boolean;
}

export interface CreateLocationDto {
  name: string;
  capacity?: number | null;
  isVirtual?: boolean;
  isExclusive?: boolean;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {
  isActive?: boolean;
}
