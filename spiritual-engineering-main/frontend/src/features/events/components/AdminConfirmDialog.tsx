import './AdminConfirmDialog.css';

interface AdminConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

const AdminConfirmDialog = ({
  title,
  message,
  confirmLabel,
  isBusy,
  onConfirm,
  onCancel,
  danger = false,
}: AdminConfirmDialogProps) => {
  return (
    <div className="admin-confirm-overlay" role="presentation">
      <div
        className="admin-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-message"
      >
        <h2 id="admin-confirm-title" className="admin-confirm-title">
          {title}
        </h2>
        <p id="admin-confirm-message" className="admin-confirm-message">
          {message}
        </p>
        <div className="admin-confirm-actions">
          <button
            type="button"
            className="admin-confirm-cancel"
            onClick={onCancel}
            disabled={isBusy}
          >
            Keep event
          </button>
          <button
            type="button"
            className={
              danger
                ? 'admin-confirm-submit admin-confirm-submit-danger'
                : 'admin-confirm-submit'
            }
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
