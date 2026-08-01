// apps/backend/src/auth/decorators/allow-soft-deleted.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const ALLOW_SOFT_DELETED_KEY = 'allowSoftDeleted';
export const AllowSoftDeleted = () => SetMetadata(ALLOW_SOFT_DELETED_KEY, true);
