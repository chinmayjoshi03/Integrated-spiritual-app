import { useState } from 'react';

import { getMyEventCertificate } from '../services/eventsService';
import type { EventCertificate } from '../types/event.types';
import { formatEventDate } from '../utils/eventForm';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './EventRegistrationPanel.css';
import './CertificateView.css';

interface CertificateViewProps {
  eventId: number;
}

const CertificateView = ({ eventId }: CertificateViewProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState<EventCertificate | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError('');

    try {
      const data = await getMyEventCertificate(eventId);
      setCertificate(data);
    } catch (err) {
      setCertificate(null);
      setError(getApiErrorMessage(err, 'Certificate is not available.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="event-registration-button event-registration-button-secondary"
        onClick={() => {
          void handleOpen();
        }}
      >
        View Certificate
      </button>

      {open ? (
        <div className="certificate-view-backdrop" role="dialog" aria-modal="true">
          <div className="certificate-view-card">
            <h3>Certificate</h3>
            {loading ? <p>Loading certificate...</p> : null}
            {!loading && error ? <p className="certificate-view-error">{error}</p> : null}
            {!loading && certificate ? (
              <div className="certificate-view-body">
                <p className="certificate-view-kicker">Issued certificate</p>
                <p className="certificate-view-title">
                  {certificate.event_title ?? 'Event certificate'}
                </p>
                {certificate.event_date ? (
                  <p>Event date: {formatEventDate(certificate.event_date)}</p>
                ) : null}
                <p>Certificate number: {certificate.certificate_number}</p>
                <p>
                  Issued:{' '}
                  {new Date(certificate.issued_at).toLocaleString('en-IN')}
                </p>
                <p className="certificate-view-note">
                  A downloadable certificate file can be attached when document
                  generation is enabled. This record confirms your eligibility
                  and issue details.
                </p>
              </div>
            ) : null}
            <button
              type="button"
              className="event-registration-button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CertificateView;
