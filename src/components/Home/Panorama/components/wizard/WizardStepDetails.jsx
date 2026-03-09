import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faPhone } from "@fortawesome/free-solid-svg-icons";
import SocialInputs from "../SocialInputs";
import TicketModal from "../TicketModal";

/**
 * Wizard Step 3: Detalles del Evento
 * Entradas, Redes Sociales, Contacto
 */
const WizardStepDetails = ({ formData, errors, onChange }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const getTicketDisplayText = () => {
    const tipos = {
      sin_entrada: "No informar",
      gratuito: "Entrada gratuita",
      pagado: formData.precio
        ? `Entrada General - $${formData.precio} CLP`
        : "Entrada General",
      venta_externa: "Venta externa",
    };
    return tipos[formData.tipo_entrada] || "Configurar entradas";
  };

  const handleTicketSave = (ticketData) => {
    onChange({
      target: { name: "tipo_entrada", value: ticketData.tipo_entrada },
    });
    onChange({ target: { name: "precio", value: ticketData.precio } });
    onChange({ target: { name: "url_venta", value: ticketData.url_venta } });
  };

  return (
    <div className="wizard-step">
      {/* Opciones de Entrada */}
      <div className="publicar-form__group">
        <label className="publicar-form__label">
          <FontAwesomeIcon icon={faTicket} /> Opciones de Entrada
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <button
          type="button"
          className="publicar-form__ticket-btn"
          onClick={() => setIsTicketModalOpen(true)}>
          <FontAwesomeIcon icon={faTicket} />
          {getTicketDisplayText()}
        </button>
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
          value={formData.telefono_contacto || ""}
          onChange={onChange}
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
