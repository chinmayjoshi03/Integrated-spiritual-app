import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import VolunteerForm from '../components/VolunteerForm';
import VolunteerStatusBadge from '../components/VolunteerStatusBadge';
import {
  approveVolunteerApplication,
  cancelVolunteerApplication,
  cancelVolunteerOpportunity,
  closeVolunteerOpportunity,
  completeVolunteerApplication,
  completeVolunteerOpportunity,
  deleteVolunteerOpportunity,
  getVolunteerApplications,
  getVolunteerAttendance,
  getVolunteerOpportunityById,
  issueVolunteerCertificate,
  publishVolunteerOpportunity,
  rejectVolunteerApplication,
  unpublishVolunteerOpportunity,
  updateVolunteerAttendance,
  updateVolunteerOpportunity,
} from '../services/volunteeringService';
import type {
  CreateVolunteerOpportunityData,
  VolunteerApplication,
  VolunteerAttendance,
  VolunteerAttendanceStatus,
  VolunteerOpportunity,
} from '../types/volunteering.types';
import {
  formatVolunteerDate,
  formatVolunteerTime,
} from '../utils/formatVolunteerDate';
import { canEditVolunteerCoreDetails } from '../utils/volunteerLifecycle';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/pages/AdminCreateEventPage.css';
import '@/features/events/pages/AdminEventManagePage.css';
import './volunteering.css';

type ManageTab = 'overview' | 'applications' | 'attendance' | 'completion';

const AdminVolunteerManagePage = () => {
  const { id } = useParams();
  const opportunityId = Number(id);
  const [tab, setTab] = useState<ManageTab>('overview');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [attendance, setAttendance] = useState<VolunteerAttendance[]>([]);
  const [durationDrafts, setDurationDrafts] = useState<Record<number, string>>({});
  const [checkInDrafts, setCheckInDrafts] = useState<Record<number, string>>({});
  const [checkOutDrafts, setCheckOutDrafts] = useState<Record<number, string>>({});

  const loadAll = useCallback(async () => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      setError('This opportunity could not be found.');
      setLoading(false);
      return;
    }

    setError('');

    try {
      const [opportunityData, applicationsData, attendanceData] = await Promise.all([
        getVolunteerOpportunityById(opportunityId),
        getVolunteerApplications(opportunityId),
        getVolunteerAttendance(opportunityId),
      ]);

      setOpportunity(opportunityData);
      setApplications(applicationsData);
      setAttendance(attendanceData);
      setDurationDrafts(
        Object.fromEntries(
          attendanceData.map((row) => [
            row.user_id,
            String(row.duration_minutes ?? 0),
          ])
        )
      );
      setCheckInDrafts(
        Object.fromEntries(
          attendanceData.map((row) => [
            row.user_id,
            row.check_in ? row.check_in.slice(0, 16) : '',
          ])
        )
      );
      setCheckOutDrafts(
        Object.fromEntries(
          attendanceData.map((row) => [
            row.user_id,
            row.check_out ? row.check_out.slice(0, 16) : '',
          ])
        )
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to manage this opportunity.');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('You do not have permission to manage volunteering.');
      } else if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('This opportunity could not be found.');
      } else {
        setError(getApiErrorMessage(err, 'Unable to load volunteering management.'));
      }
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    setLoading(true);
    void loadAll();
  }, [loadAll]);

  const run = async (work: () => Promise<void>, success: string) => {
    setBusy(true);
    setActionError('');
    setActionMessage('');

    try {
      await work();
      setActionMessage(success);
      await loadAll();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to complete that action.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (data: CreateVolunteerOpportunityData) => {
    await run(async () => {
      await updateVolunteerOpportunity(opportunityId, data);
      setEditing(false);
    }, 'Opportunity updated.');
  };

  const markAttendance = (
    row: VolunteerAttendance,
    status: VolunteerAttendanceStatus
  ) => {
    void run(async () => {
      await updateVolunteerAttendance(opportunityId, {
        user_id: row.user_id,
        status,
        duration_minutes: Number(durationDrafts[row.user_id] || 0),
        check_in: checkInDrafts[row.user_id] || null,
        check_out: checkOutDrafts[row.user_id] || null,
      });
    }, 'Attendance updated.');
  };

  return (
    <AdminEventsShell>
      <Link to="/admin/volunteering" className="admin-create-event-back">
        <ArrowLeft size={16} />
        Back to volunteering
      </Link>

      {loading ? (
        <p className="admin-create-event-status">Loading opportunity...</p>
      ) : null}

      {!loading && error ? (
        <p className="admin-create-event-error">{error}</p>
      ) : null}

      {!loading && !error && opportunity ? (
        <>
          <div className="admin-event-manage-header">
            <div>
              <p className="admin-events-kicker">Admin</p>
              <h1 className="admin-events-title">{opportunity.title}</h1>
              <p className="admin-events-description">
                {formatVolunteerDate(opportunity.event_date)} ·{' '}
                {formatVolunteerTime(opportunity.start_time)} –{' '}
                {formatVolunteerTime(opportunity.end_time)}
              </p>
            </div>
            <div className="admin-event-manage-badges">
              <VolunteerStatusBadge status={opportunity.status} />
              <VolunteerStatusBadge status={opportunity.volunteer_type} />
            </div>
          </div>

          {actionMessage ? (
            <p className="admin-event-manage-success">{actionMessage}</p>
          ) : null}
          {actionError ? (
            <p className="admin-create-event-error">{actionError}</p>
          ) : null}

          <div className="admin-event-manage-tabs">
            {(
              [
                ['overview', 'Overview'],
                ['applications', 'Applications'],
                ['attendance', 'Attendance'],
                ['completion', 'Completion / Certificates'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={
                  tab === id
                    ? 'admin-event-manage-tab admin-event-manage-tab-active'
                    : 'admin-event-manage-tab'
                }
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <section className="admin-event-manage-section">
              <h2>Overview</h2>
              <p className="admin-event-manage-lead">{opportunity.description}</p>
              <div className="admin-event-manage-stats">
                <article>
                  <p>Capacity</p>
                  <strong>
                    {opportunity.capacity === null
                      ? `${opportunity.occupied} applied`
                      : `${opportunity.occupied} / ${opportunity.capacity}`}
                  </strong>
                </article>
                <article>
                  <p>Applications</p>
                  <strong>{applications.length}</strong>
                </article>
                <article>
                  <p>Approved</p>
                  <strong>
                    {applications.filter((item) => item.status === 'approved').length}
                  </strong>
                </article>
                <article>
                  <p>Completed</p>
                  <strong>
                    {applications.filter((item) => item.status === 'completed').length}
                  </strong>
                </article>
              </div>

              <div className="volunteer-admin-actions">
                {opportunity.status === 'draft' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => publishVolunteerOpportunity(opportunity.id),
                        'Opportunity published.'
                      )
                    }
                  >
                    Publish
                  </button>
                ) : null}
                {opportunity.status === 'published' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => unpublishVolunteerOpportunity(opportunity.id),
                        'Moved to draft.'
                      )
                    }
                  >
                    Unpublish
                  </button>
                ) : null}
                {opportunity.status === 'published' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => closeVolunteerOpportunity(opportunity.id),
                        'Applications closed.'
                      )
                    }
                  >
                    Close applications
                  </button>
                ) : null}
                {opportunity.status !== 'completed' &&
                opportunity.status !== 'cancelled' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => completeVolunteerOpportunity(opportunity.id),
                        'Opportunity marked completed.'
                      )
                    }
                  >
                    Complete opportunity
                  </button>
                ) : null}
                {opportunity.status !== 'cancelled' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => cancelVolunteerOpportunity(opportunity.id),
                        'Opportunity cancelled.'
                      )
                    }
                  >
                    Cancel
                  </button>
                ) : null}
                {canEditVolunteerCoreDetails(opportunity) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing ? 'Close editor' : 'Edit'}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm('Delete this opportunity?')) {
                      return;
                    }
                    void run(async () => {
                      await deleteVolunteerOpportunity(opportunity.id);
                      window.location.assign('/admin/volunteering');
                    }, 'Opportunity deleted.');
                  }}
                >
                  Delete
                </button>
              </div>

              {editing && canEditVolunteerCoreDetails(opportunity) ? (
                <div style={{ marginTop: 24 }}>
                  <VolunteerForm
                    opportunity={opportunity}
                    submitLabel="Save changes"
                    isSubmitting={busy}
                    onSubmit={handleSave}
                    onCancel={() => setEditing(false)}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'applications' ? (
            <section className="admin-event-manage-section">
              <h2>Applications</h2>
              {applications.length === 0 ? (
                <p className="admin-event-manage-empty">No applications yet.</p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Applied</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id}>
                          <td>{application.participant_name}</td>
                          <td>{application.participant_email}</td>
                          <td>{application.participant_role}</td>
                          <td>
                            {new Date(application.applied_at).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <VolunteerStatusBadge status={application.status} />
                          </td>
                          <td>
                            {application.status === 'applied' ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-event-manage-primary"
                                  disabled={busy}
                                  onClick={() =>
                                    void run(
                                      () => approveVolunteerApplication(application.id),
                                      'Application approved.'
                                    )
                                  }
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void run(
                                      () => rejectVolunteerApplication(application.id),
                                      'Application rejected.'
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                            {application.status === 'applied' ||
                            application.status === 'approved' ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void run(
                                    () => cancelVolunteerApplication(application.id),
                                    'Application cancelled.'
                                  )
                                }
                              >
                                Cancel
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

          {tab === 'attendance' ? (
            <section className="admin-event-manage-section">
              <h2>Attendance</h2>
              <p className="admin-event-manage-lead">
                Attendance is admin-controlled. Being logged in does not prove
                physical participation.
              </p>
              {attendance.length === 0 ? (
                <p className="admin-event-manage-empty">
                  Approve volunteers before marking attendance.
                </p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Application</th>
                        <th>Attendance</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Duration (min)</th>
                        <th>Mark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row) => (
                        <tr key={row.user_id}>
                          <td>
                            {row.participant_name}
                            <br />
                            {row.participant_email}
                          </td>
                          <td>{row.application_status}</td>
                          <td>{row.attendance_status ?? 'Not marked'}</td>
                          <td>
                            <input
                              type="datetime-local"
                              value={checkInDrafts[row.user_id] ?? ''}
                              onChange={(e) =>
                                setCheckInDrafts((prev) => ({
                                  ...prev,
                                  [row.user_id]: e.target.value,
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="datetime-local"
                              value={checkOutDrafts[row.user_id] ?? ''}
                              onChange={(e) =>
                                setCheckOutDrafts((prev) => ({
                                  ...prev,
                                  [row.user_id]: e.target.value,
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={durationDrafts[row.user_id] ?? '0'}
                              onChange={(e) =>
                                setDurationDrafts((prev) => ({
                                  ...prev,
                                  [row.user_id]: e.target.value,
                                }))
                              }
                            />
                          </td>
                          <td>
                            {(['present', 'partial', 'absent'] as const).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={busy}
                                  onClick={() => markAttendance(row, status)}
                                >
                                  {status}
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'completion' ? (
            <section className="admin-event-manage-section">
              <h2>Completion / Certificates</h2>
              <p className="admin-event-manage-lead">
                Completion requires an approved volunteer with present or partial
                attendance. Certificate records are metadata only; no PDF is generated.
              </p>
              {attendance.length === 0 ? (
                <p className="admin-event-manage-empty">No approved volunteers yet.</p>
              ) : (
                <div className="admin-event-manage-table-wrap">
                  <table className="admin-event-manage-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Attendance</th>
                        <th>Completion</th>
                        <th>Certificate</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row) => (
                        <tr key={row.application_id}>
                          <td>{row.participant_name}</td>
                          <td>{row.attendance_status ?? 'Not marked'}</td>
                          <td>{row.application_status}</td>
                          <td>
                            {row.certificate_number
                              ? `Issued (${row.certificate_number})`
                              : row.application_status === 'completed'
                                ? 'Eligible / pending'
                                : 'Not eligible'}
                          </td>
                          <td>
                            {row.application_status === 'approved' ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void run(
                                    () =>
                                      completeVolunteerApplication(row.application_id),
                                    'Volunteer marked completed.'
                                  )
                                }
                              >
                                Mark completed
                              </button>
                            ) : null}
                            {row.application_status === 'completed' &&
                            !row.certificate_number ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void run(
                                    () => issueVolunteerCertificate(row.application_id),
                                    'Certificate record issued. No PDF file was created.'
                                  )
                                }
                              >
                                Issue certificate record
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

export default AdminVolunteerManagePage;
