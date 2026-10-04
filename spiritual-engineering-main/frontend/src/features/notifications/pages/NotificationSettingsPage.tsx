import { useEffect, useState } from 'react';

import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import NotificationAppShell from '../components/NotificationAppShell';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationService';
import type { NotificationPreferences } from '../types/notification.types';
import './notifications.css';

const TOGGLES: { key: keyof NotificationPreferences; label: string; help: string }[] = [
  { key: 'event_notifications', label: 'Events', help: 'New events and event updates' },
  { key: 'volunteering_notifications', label: 'Volunteering', help: 'New opportunities and updates' },
  { key: 'camp_notifications', label: 'Camps', help: 'Future camp announcements' },
  { key: 'course_notifications', label: 'Courses', help: 'New course announcements' },
  { key: 'meditation_notifications', label: 'Meditation', help: 'New meditations and sessions' },
  { key: 'community_notifications', label: 'Community', help: 'Answers and comments on your discussions' },
  { key: 'reminder_notifications', label: 'Reminders', help: 'Upcoming event and volunteering reminders' },
];

const NotificationSettingsPage = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setPreferences(await getNotificationPreferences());
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load notification preferences.'));
      }
    };
    void load();
  }, []);

  const toggle = async (key: keyof NotificationPreferences) => {
    if (!preferences || typeof preferences[key] !== 'boolean') {
      return;
    }

    const nextValue = !preferences[key];
    setPreferences({ ...preferences, [key]: nextValue });
    setSaving(true);
    setError('');

    try {
      const updated = await updateNotificationPreferences({ [key]: nextValue });
      setPreferences(updated);
    } catch (err) {
      setPreferences({ ...preferences, [key]: !nextValue });
      setError(getApiErrorMessage(err, 'Unable to update this preference.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <NotificationAppShell>
      <DashboardHeader
        title="Notification settings"
        subtitle="Choose which informational updates you want to receive."
      />
      <p className="notifications-copy">
        Registration confirmations, approvals, cancellations, and moderation notices are still sent
        so you do not miss important account activity.
      </p>
      {error ? <p className="notifications-error">{error}</p> : null}
      <div className="notifications-settings">
        {TOGGLES.map((item) => (
          <label key={item.key} className="notifications-toggle">
            <span>
              <strong>{item.label}</strong>
              <span>{item.help}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(preferences?.[item.key])}
              disabled={!preferences || saving}
              onChange={() => void toggle(item.key)}
            />
          </label>
        ))}
      </div>
    </NotificationAppShell>
  );
};

export default NotificationSettingsPage;
