import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCog } from "@fortawesome/free-solid-svg-icons";
import { DIAS_SEMANA, DIAS_SEMANA_SHORT } from "./constants";
import HorariosModal from "./HorariosModal";

/**
 * Sección de horarios de atención del negocio.
 * Permite seleccionar días con pills circulares y configurar
 * horarios individuales por día a través de un modal.
 */
const HorariosSection = ({
  formData,
  onDiaChange,
  onSaveHorarios,
  onFieldFocus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasConfiguredHorarios =
    Object.keys(formData.horarios_detalle).length > 0 || formData.abierto_24h;

  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faClock} />
        Horario de Atención
        <span className="publicar-negocio__label-hint">(Opcional)</span>
      </h2>

      {/* Días de atención — pills circulares */}
      <div className="publicar-negocio__field">
        <label>
          Días de atención
          <span className="publicar-negocio__label-hint">
            (Selecciona tus días)
          </span>
        </label>
        <div className="publicar-negocio__dias-pills">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia}
              type="button"
              className={`publicar-negocio__dia-pill ${
                formData.dias_atencion.includes(dia) ? "active" : ""
              }`}
              onClick={() => {
                onFieldFocus();
                onDiaChange(dia);
              }}
            >
              {DIAS_SEMANA_SHORT[dia]}
            </button>
          ))}
        </div>
      </div>

      {/* Botón para abrir modal de configuración */}
      {formData.dias_atencion.length > 0 && (
        <div className="publicar-negocio__configurar-wrapper">
          <button
            type="button"
            className="publicar-negocio__configurar-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <FontAwesomeIcon icon={faCog} />
            Configurar Horarios
          </button>
        </div>
      )}

      {/* Resumen de horarios configurados */}
      {hasConfiguredHorarios && (
        <div className="publicar-negocio__horarios-summary">
          <h4 className="publicar-negocio__summary-title">
            <FontAwesomeIcon icon={faClock} />
            Horario de atención (Resumen)
          </h4>

          {formData.abierto_24h ? (
            <div className="publicar-negocio__24h-badge">
              🕐 Abierto las 24 horas
            </div>
          ) : (
            <div className="publicar-negocio__summary-list">
              {formData.dias_atencion
                .sort(
                  (a, b) =>
                    DIAS_SEMANA.indexOf(a) - DIAS_SEMANA.indexOf(b),
                )
                .map((dia) => (
                  <div key={dia} className="publicar-negocio__summary-row">
                    <span className="publicar-negocio__summary-dia">
                      {DIAS_SEMANA_SHORT[dia]}
                    </span>
                    <span className="publicar-negocio__summary-horario">
                      {formData.horarios_detalle[dia]?.map((turno, i) => (
                        <span key={i}>
                          {turno.apertura} - {turno.cierre}
                          {i < formData.horarios_detalle[dia].length - 1 &&
                            " | "}
                        </span>
                      )) || "Sin configurar"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de configuración */}
      <HorariosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        diasSeleccionados={formData.dias_atencion}
        horarios={formData.horarios_detalle}
        abierto24h={formData.abierto_24h}
        onSave={onSaveHorarios}
      />
    </section>
  );
};

export default HorariosSection;
