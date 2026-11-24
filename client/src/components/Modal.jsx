export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        {children}
      </div>
    </div>
  );
}
