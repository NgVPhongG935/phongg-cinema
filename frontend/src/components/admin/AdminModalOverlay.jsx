import { createPortal } from 'react-dom'
import { useEffect } from 'react'

/**
 * Modal overlay render qua portal (document.body) — căn giữa màn hình, tránh lệch khi ancestor có transform.
 */
export default function AdminModalOverlay({ children, onBackdropClick, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      className="admin-modal-overlay"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`admin-modal-overlay-content ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function AdminModalPanel({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`admin-modal-panel ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function AdminModalHeader({ children, className = '' }) {
  return <div className={`admin-modal-header ${className}`}>{children}</div>
}

export function AdminModalBody({ children, className = '' }) {
  return <div className={`admin-modal-body ${className}`}>{children}</div>
}

export function AdminModalFooter({ children, className = '' }) {
  return <div className={`admin-modal-footer ${className}`}>{children}</div>
}
