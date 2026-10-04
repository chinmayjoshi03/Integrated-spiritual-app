import { useEffect, useRef, useState } from 'react';
import { Bell, Calendar, Flower2, HeartHandshake, LifeBuoy, MessagesSquare, Megaphone, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import type { AppNotification } from '../types/notification.types';
import {
  dismissNotification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
} from '../services/notificationService';
import { formatNotificationTime, getNotificationPath } from '../utils/notificationLinks';
import './NotificationBell.css';

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

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState('');
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  const loadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Keep the last known count if the request fails.
    }
  };

  const loadPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications({ page: 1, limit: 8 });
      setItems(data.notifications);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(() => {
      void loadCount();
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) {
      void loadPreview();
      void loadCount();
    }
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleOpenNotification = async (notification: AppNotification) => {
    setUnavailable('');
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
        setUnreadCount((count) => Math.max(count - 1, 0));
      } catch {
        // Navigation still proceeds.
      }
    }

    const path = getNotificationPath(notification.entity_type, notification.entity_id, user?.role);
    if (path) {
      setOpen(false);
      navigate(path);
      return;
    }

    if (notification.entity_type) {
      setUnavailable('This related item is no longer available.');
      return;
    }

    setOpen(false);
    navigate('/notifications');
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
      if (!notification.is_read) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to dismiss this notification.'));
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="dash-header-icon-btn notification-bell-trigger"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="notification-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-bell-panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell-panel-header">
            <strong>Notifications</strong>
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {unavailable ? <p className="notification-bell-unavailable">{unavailable}</p> : null}
          {loading ? <p className="notification-bell-state">Loading…</p> : null}
          {error ? <p className="notification-bell-state notification-bell-error">{error}</p> : null}
          {!loading && !error && items.length === 0 ? (
            <p className="notification-bell-state">You are all caught up.</p>
          ) : null}
          <ul className="notification-bell-list">
            {items.map((item) => {
              const Icon = iconForType(item.type);
              return (
                <li key={item.id} className={`notification-bell-row${item.is_read ? '' : ' is-unread'}`}>
                  <button
                    type="button"
                    className="notification-bell-item"
                    onClick={() => void handleOpenNotification(item)}
                  >
                    <span className="notification-bell-item-icon">
                      <Icon size={16} />
                    </span>
                    <span>
                      <span className="notification-bell-item-title">{item.title}</span>
                      <span className="notification-bell-item-message">{item.message}</span>
                      <span className="notification-bell-item-time">
                        {formatNotificationTime(item.created_at)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="notification-bell-dismiss"
                    aria-label="Dismiss notification"
                    disabled={dismissingId !== null}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleDismiss(item);
                    }}
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
