// apps/backend/src/admin/dto/update-user-role.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(
    [UserRole.tenant, UserRole.landlord, UserRole.admin, UserRole.provider],
    { message: 'لا يمكن تعيين هذا الدور (مسموح بـ tenant, landlord, admin, provider)' },
  )
  @IsNotEmpty({ message: 'الدور مطلوب' })
  role!: UserRole;
}
