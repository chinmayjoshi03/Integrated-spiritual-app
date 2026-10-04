import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '../components/AdminEventsShell';
import EventStatusBadge, {
  EventLifecycleBadge,
} from '../components/EventStatusBadge';
import {
  getEventAnalytics,
  getEventAttendance,
  getEventCertificates,
  getEventRegistrations,
  issueEligibleEventCertificates,
  issueEventCertificate,
  removeEventRegistration,
  updateEventAttendance,
} from '../services/eventsService';
import type {
  AttendanceStatus,
  EventAnalytics,
  EventAttendanceResponse,
  EventCertificatesResponse,
  EventRegistrationsResponse,
} from '../types/event.types';
import {
  formatEventDate,
  formatEventTime,
} from '../utils/eventForm';
import { getEventLifecycleLabel, getEventLifecycleStatus, getEventTypeLabel, canEditEventCoreDetails } from '../utils/eventLifecycle';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './AdminCreateEventPage.css';
import './AdminEventManagePage.css';

type ManageTab = 'overview' | 'registrations' | 'attendance' | 'certificates';

const AdminEventManagePage = () => {
  const { id } = useParams();
  const eventId = Number(id);
  const [tab, setTab] = useState<ManageTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [issuingAll, setIssuingAll] = useState(false);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [registrations, setRegistrations] =
    useState<EventRegistrationsResponse | null>(null);
  const [attendance, setAttendance] = useState<EventAttendanceResponse | null>(null);
  const [certificates, setCertificates] =
    useState<EventCertificatesResponse | null>(null);

  const loadAll = useCallback(async () => {
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setError('This event could not be found.');
      setLoading(false);
      return;
    }

    setError('');

    try {
      const [analyticsData, registrationsData, attendanceData, certificatesData] =
        await Promise.all([
          getEventAnalytics(eventId),
          getEventRegistrations(eventId),
          getEventAttendance(eventId),
          getEventCertificates(eventId),
        ]);

      setAnalytics(analyticsData);
      setRegistrations(registrationsData);
      setAttendance(attendanceData);
      setCertificates(certificatesData);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to manage this event.');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('You do not have permission to manage this event.');
      } else if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('This event could not be found.');
      } else {
        setError(getApiErrorMessage(err, 'Unable to load event management data.'));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    void loadAll();
  }, [loadAll]);

  const runAction = async (userId: number | null, work: () => Promise<void>) => {
    setBusyUserId(userId);
    setActionError('');
    setActionMessage('');

    try {
      await work();
      await loadAll();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to complete that action.'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleAttendance = (userId: number, status: AttendanceStatus) => {
    void runAction(userId, async () => {
      await updateEventAttendance(eventId, userId, status);
      setActionMessage(
        status === 'present' ? 'Marked present.' : 'Marked absent.'
      );
    });
  };

  const handleRemoveRegistration = (userId: number) => {
    if (!window.confirm('Remove this participant registration?')) {
      return;
    }

    void runAction(userId, async () => {
      await removeEventRegistration(eventId, userId);
      setActionMessage('Registration removed.');
    });
  };

  const handleIssueCertificate = (userId: number) => {
    void runAction(userId, async () => {
      await issueEventCertificate(eventId, userId);
      setActionMessage('Certificate issued.');
    });
  };

  const handleIssueEligible = async () => {
    setIssuingAll(true);
    setActionError('');
    setActionMessage('');

    try {
      const result = await issueEligibleEventCertificates(eventId);
      setActionMessage(result.message);
      await loadAll();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to issue certificates.'));
    } finally {
      setIssuingAll(false);
    }
  };

  const lifecycle = analytics ? getEventLifecycleStatus(analytics) : null;
  const remainingLabel =
    analytics?.remaining === null || analytics?.remaining === undefined
      ? 'Unlimited'
      : String(analytics.remaining);
  const registrationLabel =
    analytics?.capacity === null
      ? `${analytics?.registered ?? 0}`
      : `${analytics?.registered ?? 0} / ${analytics?.capacity}`;

  return (
    <AdminEventsShell>
      <Link to="/admin/events" className="admin-create-event-back">
        <ArrowLeft size={16} />
        Back to events
      </Link>

      {loading ? (
        <p className="admin-create-event-status">Loading event management...</p>
      ) : null}

      {!loading && error ? (
        <p className="admin-create-event-error">{error}</p>
      ) : null}

      {!loading && !error && analytics && lifecycle ? (
        <>
          <p className="admin-create-event-kicker">Admin</p>
          <div className="admin-event-manage-header">
            <div>
              <h1 className="admin-create-event-title">{analytics.title}</h1>
              <p className="admin-create-event-description">
                {formatEventDate(analytics.event_date)} ·{' '}
                {formatEventTime(analytics.start_time)} · {analytics.duration_minutes}{' '}
                min · {getEventTypeLabel(analytics.event_type)}
              </p>
            </div>
            <div className="admin-event-manage-badges">
              <EventStatusBadge status={analytics.status} />
              <EventLifecycleBadge status={lifecycle} />
            </div>
          </div>

          <div className="admin-event-manage-tabs" role="tablist">
            {(['overview', 'registrations', 'attendance', 'certificates'] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    tab === item
                      ? 'admin-event-manage-tab admin-event-manage-tab-active'
                      : 'admin-event-manage-tab'
                  }
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {actionError ? (
            <p className="admin-create-event-error">{actionError}</p>
          ) : null}
          {actionMessage ? (
            <p className="admin-event-manage-success">{actionMessage}</p>
          ) : null}

          {tab === 'overview' ? (
            <section className="admin-event-manage-section">
              <h2>Event overview</h2>
              <div className="admin-event-manage-stats">
                <article>
                  <p>Registrations</p>
                  <strong>{registrationLabel}</strong>
                </article>
                <article>
                  <p>Remaining</p>
                  <strong>{remainingLabel}</strong>
                </article>
                <article>
                  <p>Attendance</p>
                  <strong>
                    {analytics.attendance_present} / {analytics.registered}
                  </strong>
                </article>
                <article>
                  <p>Attendance rate</p>
                  <strong>{analytics.attendance_rate}%</strong>
                </article>
                <article>
                  <p>Certificates</p>
                  <strong>
                    {analytics.certificates_issued} issued ·{' '}
                    {analytics.certificates_eligible} eligible
                  </strong>
                </article>
                <article>
                  <p>Status</p>
                  <strong>{getEventLifecycleLabel(lifecycle)}</strong>
                </article>
              </div>
              {canEditEventCoreDetails(analytics) ? (
                <Link
                  to={`/admin/events/${eventId}/edit`}
                  className="admin-event-manage-edit"
                >
                  Edit event
                </Link>
              ) : null}
            </section>
          ) : null}

          {tab === 'registrations' && registrations ? (
            <section className="admin-event-manage-section">
              <h2>Registrations</h2>
              <p className="admin-event-manage-lead">
                {registrations.capacity === null
                  ? `${registrations.registered} registered`
                  : `${registrations.registered} / ${registrations.capacity}`}
                {registrations.remaining !== null
                  ? ` · ${registrations.remaining} seats remaining`
                  : ''}
                {registrations.is_full ? ' · Full' : ''}
              </p>
              {registrations.participants.length === 0 ? (
                <p className="admin-event-manage-empty">No registrations yet.</p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Email</th>
                        <th>Registered</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.participants.map((participant) => (
                        <tr key={participant.id}>
                          <td>{participant.participant_name}</td>
                          <td>{participant.participant_email}</td>
                          <td>
                            {new Date(participant.registered_at).toLocaleString(
                              'en-IN'
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-event-manage-link-btn"
                              disabled={busyUserId === participant.user_id}
                              onClick={() =>
                                handleRemoveRegistration(participant.user_id)
                              }
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'attendance' && attendance ? (
            <section className="admin-event-manage-section">
              <h2>Attendance</h2>
              <p className="admin-event-manage-lead">
                {attendance.present} / {attendance.registered} attended ·{' '}
                {attendance.attendance_rate}% attendance
              </p>
              {attendance.participants.length === 0 ? (
                <p className="admin-event-manage-empty">
                  No attendance recorded yet.
                </p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Registration</th>
                        <th>Join</th>
                        <th>Leave / last seen</th>
                        <th>Duration</th>
                        <th>Result</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.participants.map((participant) => (
                        <tr key={participant.user_id}>
                          <td>
                            {participant.participant_name}
                            <div className="admin-event-manage-sub">
                              {participant.participant_email}
                            </div>
                          </td>
                          <td>Registered</td>
                          <td>
                            {participant.joined_at
                              ? new Date(participant.joined_at).toLocaleString('en-IN')
                              : '—'}
                          </td>
                          <td>
                            {participant.last_seen_at
                              ? new Date(participant.last_seen_at).toLocaleString('en-IN')
                              : '—'}
                          </td>
                          <td>
                            {participant.participation_minutes ?? 0} min
                          </td>
                          <td>
                            {participant.attendance_status === 'present'
                              ? 'Present'
                              : participant.attendance_status === 'absent'
                                ? 'Absent'
                                : 'Not marked'}
                            {participant.source === 'admin' ? ' · override' : ''}
                          </td>
                          <td className="admin-event-manage-actions">
                            <button
                              type="button"
                              disabled={busyUserId === participant.user_id}
                              onClick={() =>
                                handleAttendance(participant.user_id, 'present')
                              }
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              disabled={busyUserId === participant.user_id}
                              onClick={() =>
                                handleAttendance(participant.user_id, 'absent')
                              }
                            >
                              Absent
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'certificates' && certificates ? (
            <section className="admin-event-manage-section">
              <div className="admin-event-manage-cert-head">
                <div>
                  <h2>Certificates</h2>
                  <p className="admin-event-manage-lead">
                    {certificates.eligible} eligible · {certificates.issued} issued ·{' '}
                    {certificates.pending} pending
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-event-manage-primary"
                  onClick={() => void handleIssueEligible()}
                  disabled={issuingAll || certificates.pending === 0}
                >
                  {issuingAll ? 'Issuing...' : 'Issue eligible'}
                </button>
              </div>
              {certificates.participants.length === 0 ? (
                <p className="admin-event-manage-empty">
                  No certificates issued yet.
                </p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Eligibility</th>
                        <th>Certificate</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.participants.map((participant) => (
                        <tr key={participant.user_id}>
                          <td>
                            {participant.participant_name}
                            <div className="admin-event-manage-sub">
                              {participant.participant_email}
                            </div>
                          </td>
                          <td>
                            {participant.attendance_status === 'present'
                              ? 'Eligible'
                              : 'Not eligible'}
                          </td>
                          <td>
                            {participant.certificate_status === 'available'
                              ? participant.certificate_number
                              : participant.certificate_status === 'pending'
                                ? 'Pending'
                                : 'Not available'}
                          </td>
                          <td>
                            {participant.certificate_status === 'pending' ? (
                              <button
                                type="button"
                                className="admin-event-manage-link-btn"
                                disabled={busyUserId === participant.user_id}
                                onClick={() =>
                                  handleIssueCertificate(participant.user_id)
                                }
                              >
                                Issue
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminEventManagePage;
