import type { UserRole } from '@/types/user';

const ENTITY_ROUTES: Record<string, (id: number) => string> = {
  event: (id) => `/events/${id}`,
  volunteering: (id) => `/volunteering/${id}`,
  community_question: (id) => `/community/questions/${id}`,
  community_reply: (id) => `/community/questions/${id}`,
  meditation: () => '/dashboard/meditation',
  course: () => '/dashboard/courses',
};

export const getNotificationPath = (
  entityType?: string | null,
  entityId?: number | null,
  role?: UserRole
): string | null => {
  if (!entityType) {
    return null;
  }

  const id = Number(entityId);

  if (entityType === 'support_ticket') {
    if (!Number.isInteger(id) || id <= 0) {
      return role === 'admin' ? '/admin/helpdesk' : '/my-support';
    }
    return role === 'admin' ? `/admin/helpdesk/tickets/${id}` : `/my-support/${id}`;
  }

  const builder = ENTITY_ROUTES[entityType];
  if (!builder) {
    return null;
  }

  if (!Number.isInteger(id) || id <= 0) {
    if (entityType === 'meditation' || entityType === 'course') {
      return builder(0);
    }
    return null;
  }

  return builder(id);
};

export const formatNotificationTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
