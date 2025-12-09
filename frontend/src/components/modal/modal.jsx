import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './modal.css';

// Botão de fechar do modal
const ModalCloseButton = ({ onClose, label = "Fechar modal" }) => (
  <button 
    className="modal-close-btn" 
    onClick={onClose} 
    aria-label={label}
  >
    &times;
  </button>
);

ModalCloseButton.propTypes = {
  onClose: PropTypes.func.isRequired,
  label: PropTypes.string,
};

// Header do modal
const ModalHeader = ({ title, onClose, showCloseButton = true }) => (
  <header className="modal-header">
    <h2 id="modal-title">{title}</h2>
    {showCloseButton && (
      <ModalCloseButton onClose={onClose} />
    )}
  </header>
);

ModalHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  showCloseButton: PropTypes.bool,
};

// Footer do modal
const ModalFooter = ({ children, align = "right" }) => (
  <footer className={`modal-footer modal-footer--${align}`}>
    {children}
  </footer>
);

ModalFooter.propTypes = {
  children: PropTypes.node,
  align: PropTypes.oneOf(["left", "center", "right", "space-between"]),
};

ModalFooter.defaultProps = {
  align: "right",
};

// Componente principal Modal
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = "medium",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showHeader = true,
  showFooter = false,
  footerContent,
  className = "",
}) {
  // Fechar modal com ESC
  const handleKeyDown = useCallback((e) => {
    if (closeOnEscape && e.key === 'Escape') {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Previne scroll da página
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="modal-overlay" 
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      <div 
        className={`modal-content modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={showHeader ? "modal-title" : undefined}
      >
        {showHeader && (
          <ModalHeader 
            title={title} 
            onClose={onClose}
          />
        )}
        
        <div className="modal-body">
          {children}
        </div>
        
        {showFooter && footerContent && (
          <ModalFooter>
            {footerContent}
          </ModalFooter>
        )}
      </div>
    </>
  );
}

// Modal de confirmação (especializado)
export const ConfirmModal = ({
  isOpen,
  onClose,
  title = "Confirmação",
  message,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="small"
    showFooter={true}
    footerContent={
      <>
        <button 
          className={`modal-button modal-button--cancel modal-button--${variant}`}
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button 
          className={`modal-button modal-button--confirm modal-button--${variant}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </>
    }
  >
    <p className="modal-message">{message}</p>
  </Modal>
);

// Modal de loading
export const LoadingModal = ({ isOpen, title = "Carregando...", message }) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {}}
    title={title}
    size="small"
    showCloseButton={false}
    closeOnOverlayClick={false}
    closeOnEscape={false}
  >
    <div className="modal-loading">
      <div className="modal-spinner"></div>
      {message && <p className="modal-loading-message">{message}</p>}
    </div>
  </Modal>
);

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["small", "medium", "large", "fullscreen"]),
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
  footerContent: PropTypes.node,
  className: PropTypes.string,
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(["default", "danger", "success", "warning"]),
};

LoadingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
};

Modal.defaultProps = {
  size: "medium",
  closeOnOverlayClick: true,
  closeOnEscape: true,
  showHeader: true,
  showFooter: false,
  className: "",
};

ConfirmModal.defaultProps = {
  title: "Confirmação",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "default",
};