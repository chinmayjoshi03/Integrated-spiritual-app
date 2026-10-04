import { useCallback, useEffect, useState } from 'react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import {
  createAdminNotificationRule,
  deleteAdminNotificationRule,
  getAdminNotificationActivity,
  getAdminNotificationOverview,
  getAdminNotificationRules,
  sendAdminNotification,
  updateAdminNotificationRule,
} from '../services/notificationService';
import type {
  AdminNotificationRecord,
  NotificationOverview,
  NotificationRule,
} from '../types/notification.types';
import { formatNotificationTime } from '../utils/notificationLinks';
import './notifications.css';

type TabId = 'overview' | 'rules' | 'send' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'rules', label: 'Automation Rules' },
  { id: 'send', label: 'Send Notification' },
  { id: 'activity', label: 'Notification Activity' },
];

const FEATURES = [
  { id: 'event', label: 'Events' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'course', label: 'Courses' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'camp', label: 'Camps' },
  { id: 'community_question', label: 'Community' },
];

const AUDIENCES = [
  { id: 'all', label: 'Everyone' },
  { id: 'users', label: 'Users' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'admins', label: 'Admins' },
  { id: 'registered_participants', label: 'Registered participants' },
  { id: 'approved_volunteers', label: 'Approved volunteers' },
];

const SEND_AUDIENCES = [
  { id: 'all', label: 'Everyone' },
  { id: 'users', label: 'Users' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'admins', label: 'Admins' },
  { id: 'specific_user', label: 'Specific participant' },
];

const ruleTitle = (rule: NotificationRule) => {
  const type = rule.notification_type.replaceAll('_', ' ').toLowerCase();
  return type.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const AdminNotificationsPage = () => {
  const [tab, setTab] = useState<TabId>('overview');
  const [overview, setOverview] = useState<NotificationOverview | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [activity, setActivity] = useState<AdminNotificationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timingDrafts, setTimingDrafts] = useState<Record<number, string>>({});

  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendAudience, setSendAudience] = useState('all');
  const [sendEntityType, setSendEntityType] = useState('');
  const [sendEntityId, setSendEntityId] = useState('');
  const [sendUserId, setSendUserId] = useState('');
  const [sending, setSending] = useState(false);

  const [newType, setNewType] = useState('EVENT_REMINDER');
  const [newEntity, setNewEntity] = useState('event');
  const [newAudience, setNewAudience] = useState('registered_participants');
  const [newTiming, setNewTiming] = useState('120');
  const [newTitle, setNewTitle] = useState('Reminder');
  const [newMessage, setNewMessage] = useState('{{title}} is coming up soon.');

  const loadOverview = useCallback(async () => {
    setOverview(await getAdminNotificationOverview());
  }, []);

  const loadRules = useCallback(async () => {
    const data = await getAdminNotificationRules();
    setRules(data);
    setTimingDrafts(
      Object.fromEntries(
        data.map((rule) => [rule.id, rule.timing_minutes ? String(rule.timing_minutes) : ''])
      )
    );
  }, []);

  const loadActivity = useCallback(async () => {
    const data = await getAdminNotificationActivity({
      search: search || undefined,
      source: sourceFilter || undefined,
      page: 1,
      limit: 50,
    });
    setActivity(data.notifications);
  }, [search, sourceFilter]);

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        if (tab === 'overview') {
          await loadOverview();
        }
        if (tab === 'rules') {
          await loadRules();
        }
        if (tab === 'activity') {
          await loadActivity();
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load notification data.'));
      }
    };
    void load();
  }, [tab, loadOverview, loadRules, loadActivity]);

  const handleToggle = async (rule: NotificationRule) => {
    try {
      const updated = await updateAdminNotificationRule(rule.id, { enabled: !rule.enabled });
      setRules((current) => current.map((item) => (item.id === rule.id ? updated : item)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update this rule.'));
    }
  };

  const handleTimingSave = async (rule: NotificationRule) => {
    const minutes = Number(timingDrafts[rule.id]);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setError('Reminder timing must be greater than 0 minutes.');
      return;
    }
    try {
      const updated = await updateAdminNotificationRule(rule.id, { timing_minutes: minutes });
      setRules((current) => current.map((item) => (item.id === rule.id ? updated : item)));
      setNotice('Reminder timing updated.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update reminder timing.'));
    }
  };

  const handleDeleteRule = async (rule: NotificationRule) => {
    try {
      await deleteAdminNotificationRule(rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to remove this rule.'));
    }
  };

  const handleCreateRule = async () => {
    try {
      const created = await createAdminNotificationRule({
        notification_type: newType,
        entity_type: newEntity,
        audience: newAudience,
        title_template: newTitle,
        message_template: newMessage,
        timing_minutes: newType.includes('REMINDER') ? Number(newTiming) : null,
        enabled: true,
      });
      setRules((current) => [...current, created]);
      setNotice('Automation rule created.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create this rule.'));
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    setNotice('');
    try {
      const result = await sendAdminNotification({
        title: sendTitle,
        message: sendMessage,
        audience: sendAudience,
        entity_type: sendEntityType || null,
        entity_id: sendEntityId ? Number(sendEntityId) : null,
        user_id: sendUserId ? Number(sendUserId) : null,
      });
      setNotice(`Notification sent to ${result.delivered} recipient(s).`);
      setSendTitle('');
      setSendMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send this notification.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminEventsShell>
      <DashboardHeader
        title="Notifications"
        subtitle="Manage automation, reminders, and announcements."
      />

      <div className="notifications-filters" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="notifications-error">{error}</p> : null}
      {notice ? <p className="notifications-success">{notice}</p> : null}

      {tab === 'overview' && overview ? (
        <div className="notifications-overview-grid">
          <article>
            <strong>{overview.total_notifications}</strong>
            <span>Total notifications</span>
          </article>
          <article>
            <strong>{overview.automatic_notifications}</strong>
            <span>Automatic</span>
          </article>
          <article>
            <strong>{overview.manual_notifications}</strong>
            <span>Manual</span>
          </article>
          <article>
            <strong>{overview.unread_notifications}</strong>
            <span>Unread</span>
          </article>
          <article>
            <strong>{overview.active_rules}</strong>
            <span>Active rules</span>
          </article>
        </div>
      ) : null}

      {tab === 'rules' ? (
        <div className="notifications-rules">
          {rules.map((rule) => (
            <article key={rule.id} className="notifications-rule-card">
              <div>
                <h3>{ruleTitle(rule)}</h3>
                <p>
                  {rule.entity_type}
                  {rule.timing_label ? ` · ${rule.timing_label}` : ''}
                  {` · ${rule.audience.replaceAll('_', ' ')}`}
                </p>
              </div>
              <div className="notifications-rule-actions">
                {rule.notification_type.includes('REMINDER') ? (
                  <label>
                    Minutes
                    <input
                      type="number"
                      min={1}
                      value={timingDrafts[rule.id] ?? ''}
                      onChange={(event) =>
                        setTimingDrafts((current) => ({
                          ...current,
                          [rule.id]: event.target.value,
                        }))
                      }
                    />
                    <button type="button" onClick={() => void handleTimingSave(rule)}>
                      Save
                    </button>
                  </label>
                ) : null}
                <button type="button" onClick={() => void handleToggle(rule)}>
                  {rule.enabled ? 'On' : 'Off'}
                </button>
                <button type="button" className="is-danger" onClick={() => void handleDeleteRule(rule)}>
                  Remove
                </button>
              </div>
            </article>
          ))}

          <form
            className="notifications-rule-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateRule();
            }}
          >
            <h3>Add reminder or automation rule</h3>
            <label>
              Type
              <input value={newType} onChange={(event) => setNewType(event.target.value)} />
            </label>
            <label>
              Feature
              <select value={newEntity} onChange={(event) => setNewEntity(event.target.value)}>
                {FEATURES.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Audience
              <select value={newAudience} onChange={(event) => setNewAudience(event.target.value)}>
                {AUDIENCES.map((audience) => (
                  <option key={audience.id} value={audience.id}>
                    {audience.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Timing (minutes)
              <input
                type="number"
                min={1}
                value={newTiming}
                onChange={(event) => setNewTiming(event.target.value)}
              />
            </label>
            <label>
              Title
              <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
            </label>
            <label>
              Message
              <input value={newMessage} onChange={(event) => setNewMessage(event.target.value)} />
            </label>
            <button type="submit">Add rule</button>
          </form>
        </div>
      ) : null}

      {tab === 'send' ? (
        <form
          className="notifications-send-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <label>
            Title
            <input value={sendTitle} onChange={(event) => setSendTitle(event.target.value)} required />
          </label>
          <label>
            Message
            <textarea
              value={sendMessage}
              onChange={(event) => setSendMessage(event.target.value)}
              required
              rows={5}
            />
          </label>
          <label>
            Audience
            <select value={sendAudience} onChange={(event) => setSendAudience(event.target.value)}>
              {SEND_AUDIENCES.map((audience) => (
                <option key={audience.id} value={audience.id}>
                  {audience.label}
                </option>
              ))}
            </select>
          </label>
          {sendAudience === 'specific_user' ? (
            <label>
              Participant user ID
              <input value={sendUserId} onChange={(event) => setSendUserId(event.target.value)} />
            </label>
          ) : null}
          <label>
            Related feature (optional)
            <select value={sendEntityType} onChange={(event) => setSendEntityType(event.target.value)}>
              <option value="">None</option>
              {FEATURES.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.label}
                </option>
              ))}
            </select>
          </label>
          {sendEntityType ? (
            <label>
              Related ID
              <input value={sendEntityId} onChange={(event) => setSendEntityId(event.target.value)} />
            </label>
          ) : null}
          <button type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send notification'}
          </button>
        </form>
      ) : null}

      {tab === 'activity' ? (
        <div>
          <div className="notifications-activity-filters">
            <input
              type="search"
              placeholder="Search title, message, or name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="">All sources</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="notifications-activity-table">
            {activity.map((item) => (
              <article key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.type}</span>
                <span>{item.user_name} · {item.user_role}</span>
                <span>{item.source}</span>
                <span>{item.entity_type ? `${item.entity_type} #${item.entity_id}` : '—'}</span>
                <span>{formatNotificationTime(item.created_at)}</span>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminNotificationsPage;
