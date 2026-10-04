import { useCallback, useEffect, useState } from 'react';
import { Bell, Calendar, Flower2, HeartHandshake, LifeBuoy, MessagesSquare, Megaphone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import NotificationAppShell from '../components/NotificationAppShell';
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import type { AppNotification } from '../types/notification.types';
import { formatNotificationTime, getNotificationPath } from '../utils/notificationLinks';
import './notifications.css';

const iconForType = (type: string) => {
  if (type.startsWith('EVENT')) {
    return Calendar;
  }
  if (type.startsWith('VOLUNTEERING')) {
    return HeartHandshake;
  }
  if (type.startsWith('COMMUNITY')) {
    return MessagesSquare;
  }
  if (type.includes('MEDITATION')) {
    return Flower2;
  }
  if (type.startsWith('SUPPORT')) {
    return LifeBuoy;
  }
  return Megaphone;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications({
        page: 1,
        limit: 50,
        unread: filter === 'unread' ? true : undefined,
      });
      setItems(data.notifications);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openNotification = async (notification: AppNotification) => {
    setNotice('');
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
      } catch {
        // Continue navigation.
      }
    }

    const path = getNotificationPath(notification.entity_type, notification.entity_id, user?.role);
    if (path) {
      navigate(path);
      return;
    }

    if (notification.entity_type) {
      setNotice('This related item is no longer available.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to mark notifications as read.'));
    }
  };

  const handleDismiss = async (notification: AppNotification) => {
    if (dismissingId !== null) {
      return;
    }

    setDismissingId(notification.id);
    setError('');

    try {
      await dismissNotification(notification.id);
      setItems((current) => current.filter((item) => item.id !== notification.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to dismiss this notification.'));
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <NotificationAppShell>
      <DashboardHeader title="Notifications" subtitle="Stay current with your practice and community." />

      <div className="notifications-toolbar">
        <div className="notifications-filters" role="tablist" aria-label="Notification filters">
          <button
            type="button"
            className={filter === 'all' ? 'is-active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'unread' ? 'is-active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
        <button type="button" className="notifications-text-btn" onClick={() => void handleMarkAll()}>
          Mark all as read
        </button>
      </div>

      {notice ? <p className="notifications-notice">{notice}</p> : null}
      {loading ? <p className="notifications-state">Loading notifications…</p> : null}
      {error ? <p className="notifications-state notifications-error">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={28} />
          <h2>No notifications yet</h2>
          <p>When something is published or a reminder is due, it will appear here.</p>
        </div>
      ) : null}

      <ul className="notifications-list">
        {items.map((item) => {
          const Icon = iconForType(item.type);
          return (
            <li key={item.id} className="notifications-row">
              <button
                type="button"
                className={`notifications-card${item.is_read ? '' : ' is-unread'}`}
                onClick={() => void openNotification(item)}
              >
                <span className="notifications-card-icon">
                  <Icon size={18} />
                </span>
                <span className="notifications-card-body">
                  <span className="notifications-card-title">{item.title}</span>
                  <span className="notifications-card-message">{item.message}</span>
                  <span className="notifications-card-meta">
                    {formatNotificationTime(item.created_at)}
                    {item.is_read ? '' : ' · Unread'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="notifications-dismiss"
                aria-label="Dismiss notification"
                disabled={dismissingId !== null}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDismiss(item);
                }}
              >
                <X size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </NotificationAppShell>
  );
};

export default NotificationsPage;
