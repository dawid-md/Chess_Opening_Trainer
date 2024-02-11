export default function SimpleModal({ isOpen, onClose, onSave, children }) {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button onClick={onClose}>Close</button>
          {children}
          <button onClick={onSave}>Save</button>
        </div>
      </div>
    );
}