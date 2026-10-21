export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  isActive: boolean;
}

// Contrato estricto para POST (evita enviar id o campos extra que rechazaría forbidNonWhitelisted)
export interface CreateCategoryDto {
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

// Contrato estricto para PATCH
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  isActive?: boolean;
}