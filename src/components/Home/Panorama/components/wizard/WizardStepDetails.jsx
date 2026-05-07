import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faPhone, faXmark } from "@fortawesome/free-solid-svg-icons";
import SocialInputs from "../SocialInputs";
import TicketModal from "../TicketModal";
import { formatChileanPhone } from "../../../../../lib/textWrap";

/**
 * Wizard Step 3: Detalles del Evento
 * Entradas, Redes Sociales, Contacto
 */
const WizardStepDetails = ({ formData, errors, onChange }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const hasSelectedTicketType = Boolean(formData.tipo_entrada);

  const getTicketDisplayText = () => {
    const tipos = {
      sin_entrada: "Pronto más información",
      info_descripcion: "Info en Descripción",
      gratuito: "Entrada gratuita",
      pagado: formData.precio
        ? `Entrada General - $${formData.precio} CLP`
        : "Entrada General",
      venta_externa: "Venta externa",
    };
    return tipos[formData.tipo_entrada] || "Selecciona un tipo de entrada";
  };

  const handleTicketSave = (ticketData) => {
    onChange({
      target: { name: "tipo_entrada", value: ticketData.tipo_entrada },
    });
    onChange({ target: { name: "precio", value: ticketData.precio } });
    onChange({ target: { name: "url_venta", value: ticketData.url_venta } });
  };

  const handleTicketClear = () => {
    onChange({ target: { name: "tipo_entrada", value: "" } });
    onChange({ target: { name: "precio", value: "" } });
    onChange({ target: { name: "url_venta", value: "" } });
  };

  return (
    <div className="wizard-step">
      {/* Opciones de Entrada */}
      <div className="publicar-form__group">
        <label className="publicar-form__label">
          <FontAwesomeIcon icon={faTicket} /> Opciones de Entrada
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <div className="publicar-form__ticket-actions">
          <button
            type="button"
            className={`publicar-form__ticket-btn ${!hasSelectedTicketType ? "publicar-form__ticket-btn--placeholder" : ""}`}
            onClick={() => setIsTicketModalOpen(true)}>
            <FontAwesomeIcon icon={faTicket} />
            {getTicketDisplayText()}
          </button>
          {hasSelectedTicketType && (
            <button
              type="button"
              className="publicar-form__ticket-clear"
              onClick={handleTicketClear}
              aria-label="Quitar tipo de entrada"
              title="Quitar tipo de entrada">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
        {errors.tipo_entrada && (
          <span className="publicar-form__error">{errors.tipo_entrada}</span>
        )}
      </div>

      {/* Redes Sociales */}
      <SocialInputs
        redes_sociales={formData.redes_sociales}
        sitio_web={formData.sitio_web}
        onChange={onChange}
      />

      {/* Número de Contacto */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="telefono_contacto">
          <FontAwesomeIcon icon={faPhone} /> Número de Contacto
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Contacto Directo
          </span>
          <span className="publicar-form__label-hint"> (Opcional)</span>
        </label>
        <input
          type="tel"
          id="telefono_contacto"
          name="telefono_contacto"
          className="publicar-form__input"
          placeholder="Ej: +56 9 1234 5678"
          value={formatChileanPhone(formData.telefono_contacto || "")}
          onChange={(e) =>
            onChange({
              target: {
                name: e.target.name,
                value: formatChileanPhone(e.target.value),
              },
            })
          }
          maxLength={20}
        />
      </div>

      {/* Modal de configuración de entradas */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        currentValues={{
          tipo_entrada: formData.tipo_entrada,
          precio: formData.precio,
          url_venta: formData.url_venta,
        }}
        onSave={handleTicketSave}
      />
    </div>
  );
};

export default WizardStepDetails;
