import { Prisma } from '@prisma/client';

export const userPublicSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  nationalIdVerified: true,
  identityStatus: true,
  createdAt: true,
  idCardPublicId: true,
} satisfies Prisma.UserSelect;
