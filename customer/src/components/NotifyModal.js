import { Modal, Button } from 'react-bootstrap';

import '../styles/NotifyModal.css';

export default function NotifyModal({
    show,
    title,
    message,
    type = 'success',
    customButtons = [],
    onClose,
}) {

    const getTypeConfig = (type) => {
        const configs = {
            success: { icon: '✅', className: 'success-modal'},
            error: { icon: '❌', className: 'error-modal'},
            warning: { icon: '⚠️', className: 'warning-modal' },
            info: { icon: 'ℹ️', className: 'info-modal' }
        };
        return configs[type] || configs.success;
    };

    const typeConfig = getTypeConfig(type);

    return (
        <div className="notify-modal-wrapper">
            <Modal
                show={show}
                onHide={onClose}
                centered
                className={`notify-modal ${typeConfig.className}`}
                id="notify-modal"
                dialogClassName="notify-modal-dialog"
            >
                {title && (
                    <Modal.Header className={`notify-modal-header ${typeConfig.headerClass}`}>
                        <Modal.Title className="notify-modal-title">
                            <span className="modal-icon">{typeConfig.icon}</span>
                            {title}
                        </Modal.Title>
                    </Modal.Header>
                )}

                <Modal.Body className="notify-modal-body">
                    {message}
                </Modal.Body>

                <Modal.Footer className="notify-modal-footer">
                    {customButtons.map((button, index) => (
                        <Button
                            key={index}
                            variant={button.variant || 'secondary'}
                            className={button.className || ''}
                            onClick={() => {
                                button.onClick && button.onClick();
                                if (button.closeOnClick !== false) onClose();
                            }}
                        >
                            {button.label}
                        </Button>
                    ))}

                    {customButtons.length === 0 && (
                        <Button
                            variant="warning"
                            className="notify-modal-close-btn"
                            onClick={onClose}
                        >
                            {type === 'error' ? 'Try Again' : 'Done'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}