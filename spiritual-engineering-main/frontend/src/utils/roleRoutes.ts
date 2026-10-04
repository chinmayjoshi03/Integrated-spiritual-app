import type { UserRole } from '@/types/user';

export const getDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'mentor':
      return '/mentor';
    default:
      return '/dashboard';
  }
};