import type { SupportPriority, SupportStatus } from '../types/help.types';

export const statusLabel = (status: SupportStatus | string): string => {
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_for_user: 'Waiting for User',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
};

export const priorityLabel = (priority: SupportPriority | string): string => {
  const labels: Record<string, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority] || priority;
};

export const formatRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

export const relatedEntityLabel = (type?: string | null): string => {
  if (!type) return '';
  const labels: Record<string, string> = {
    event: 'Event',
    volunteering: 'Volunteering',
    community_question: 'Community',
    meditation: 'Meditation',
  };
  return labels[type] || type;
};
