import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { DIAS_SEMANA } from "./constants";

/**
 * Sección de horarios de atención del negocio
 */
const HorariosSection = ({
  formData,
  onChange,
  onDiaChange,
  onFieldFocus,
}) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faClock} />
        Horario de Atención
      </h2>

      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="horario_apertura">Hora de apertura</label>
          <input
            type="time"
            id="horario_apertura"
            name="horario_apertura"
            value={formData.horario_apertura}
            onChange={onChange}
            onFocus={onFieldFocus}
          />
        </div>

        <div className="publicar-negocio__field">
          <label htmlFor="horario_cierre">Hora de cierre</label>
          <input
            type="time"
            id="horario_cierre"
            name="horario_cierre"
            value={formData.horario_cierre}
            onChange={onChange}
            onFocus={onFieldFocus}
          />
        </div>
      </div>

      <div className="publicar-negocio__field">
        <label>Días de atención</label>
        <div className="publicar-negocio__dias">
          {DIAS_SEMANA.map((dia) => (
            <label key={dia} className="publicar-negocio__dia-checkbox">
              <input
                type="checkbox"
                checked={formData.dias_atencion.includes(dia)}
                onChange={() => onDiaChange(dia)}
              />
              <span>{dia}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorariosSection;
