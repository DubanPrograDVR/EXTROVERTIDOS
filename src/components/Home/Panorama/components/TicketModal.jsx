import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faTicket,
  faBan,
  faGift,
  faDollarSign,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/ticket-modal.css";

/**
 * Tipos de entrada disponibles
 */
const TICKET_OPTIONS = [
  {
    value: "sin_entrada",
    label: "Sin entrada",
    description: "No se requiere entrada para este evento",
    icon: faBan,
  },
  {
    value: "gratuito",
    label: "Entrada gratuita",
    description: "Los asistentes pueden entrar sin costo",
    icon: faGift,
  },
  {
    value: "pagado",
    label: "Entrada General",
    description: "Entrada con precio fijo",
    icon: faDollarSign,
    hasPrice: true,
  },
  {
    value: "venta_externa",
    label: "Venta externa",
    description: "Proporciona un enlace para comprar entradas",
    icon: faExternalLinkAlt,
    hasUrl: true,
  },
];

/**
 * Modal para configurar opciones de entrada
 */
const TicketModal = ({ isOpen, onClose, currentValues, onSave }) => {
  const [selectedType, setSelectedType] = useState(
    currentValues?.tipo_entrada || "sin_entrada",
  );
  const [precio, setPrecio] = useState(currentValues?.precio || "");
  const [urlVenta, setUrlVenta] = useState(currentValues?.url_venta || "");

  // Sincronizar con valores externos cuando cambian
  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentValues?.tipo_entrada || "sin_entrada");
      setPrecio(currentValues?.precio || "");
      setUrlVenta(currentValues?.url_venta || "");
    }
  }, [isOpen, currentValues]);

  const handleSave = () => {
    onSave({
      tipo_entrada: selectedType,
      precio: selectedType === "pagado" ? precio : "",
      url_venta: selectedType === "venta_externa" ? urlVenta : "",
    });
    onClose();
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setSelectedType(currentValues?.tipo_entrada || "sin_entrada");
    setPrecio(currentValues?.precio || "");
    setUrlVenta(currentValues?.url_venta || "");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ticket-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Información de entrada">
        {/* Header */}
        <div className="ticket-modal__header">
          <h2 className="ticket-modal__title">
            <FontAwesomeIcon icon={faTicket} />
            Configurar Entradas
          </h2>
          <button
            type="button"
            className="ticket-modal__close"
            onClick={handleCancel}
            aria-label="Cerrar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="ticket-modal__content">
          {TICKET_OPTIONS.map((option) => (
            <div key={option.value} className="ticket-modal__option">
              <label
                className={`ticket-modal__option-label ${
                  selectedType === option.value
                    ? "ticket-modal__option-label--selected"
                    : ""
                }`}>
                <input
                  type="radio"
                  name="ticket_type"
                  value={option.value}
                  checked={selectedType === option.value}
                  onChange={() => setSelectedType(option.value)}
                  className="ticket-modal__radio"
                />
                <span className="ticket-modal__radio-custom"></span>
                <div className="ticket-modal__option-info">
                  <span className="ticket-modal__option-title">
                    <FontAwesomeIcon
                      icon={option.icon}
                      className="ticket-modal__option-icon"
                    />
                    {option.label}
                  </span>
                  <span className="ticket-modal__option-desc">
                    {option.description}
                  </span>
                </div>
              </label>

              {/* Campo de precio para Entrada General */}
              {option.hasPrice && selectedType === "pagado" && (
                <div className="ticket-modal__field">
                  <label className="ticket-modal__field-label">Precio:</label>
                  <div className="ticket-modal__price-input">
                    <span className="ticket-modal__price-symbol">$</span>
                    <input
                      type="number"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="ticket-modal__input"
                    />
                    <span className="ticket-modal__price-currency">CLP</span>
                  </div>
                </div>
              )}

              {/* Campo de URL para Venta externa */}
              {option.hasUrl && selectedType === "venta_externa" && (
                <div className="ticket-modal__field">
                  <label className="ticket-modal__field-label">
                    Enlace de venta:
                  </label>
                  <input
                    type="url"
                    value={urlVenta}
                    onChange={(e) => setUrlVenta(e.target.value)}
                    placeholder="https://ejemplo.com/entradas"
                    className="ticket-modal__input ticket-modal__input--url"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="ticket-modal__footer">
          <button
            type="button"
            className="ticket-modal__btn ticket-modal__btn--cancel"
            onClick={handleCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="ticket-modal__btn ticket-modal__btn--save"
            onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
