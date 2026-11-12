import { useEffect, type ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  accent?: string;
}

export default function Modal({ title, onClose, children, className = '', accent }: Props) {
  useEffect(() => {
    if (!onClose) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={accent ? { borderTopColor: accent } : undefined}
      >
        {(title || onClose) && (
          <div className="modal-head">
            <h2>{title}</h2>
            {onClose && (
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Tutup">
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
