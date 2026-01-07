import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCalendarWeek,
  faArrowRight,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/date-range-picker.css";

/**
 * Componente para selección de fechas con soporte para eventos multi-día
 * Incluye checkbox animado y selector de rango de fechas
 */
const DateRangePicker = ({
  fechaEvento,
  fechaFin,
  esMultidia,
  mismoHorario,
  horaInicio,
  horaFin,
  onChange,
  errors,
}) => {
  // Estado local para animación del panel
  const [isExpanded, setIsExpanded] = useState(esMultidia);

  // Sincronizar estado expandido con prop
  useEffect(() => {
    setIsExpanded(esMultidia);
  }, [esMultidia]);

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split("T")[0];

  // Manejar cambio del checkbox multi-día
  const handleMultidiaChange = (e) => {
    const checked = e.target.checked;

    // Crear evento sintético para el onChange padre
    onChange({
      target: { name: "es_multidia", value: checked, type: "checkbox" },
    });

    // Si se desmarca, limpiar fecha fin
    if (!checked) {
      onChange({ target: { name: "fecha_fin", value: "" } });
    }
  };

  // Manejar cambio de mismo horario
  const handleMismoHorarioChange = (e) => {
    onChange({
      target: {
        name: "mismo_horario",
        value: e.target.checked,
        type: "checkbox",
      },
    });
  };

  // Calcular duración del evento
  const calcularDuracion = () => {
    if (!fechaEvento || !fechaFin) return null;

    const inicio = new Date(fechaEvento);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  const duracion = calcularDuracion();

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="date-range-picker">
      {/* Fila principal: Fecha inicio y checkbox */}
      <div className="date-range-picker__main-row">
        {/* Fecha de inicio (siempre visible) */}
        <div className="date-range-picker__date-group">
          <label className="publicar-form__label" htmlFor="fecha_evento">
            <FontAwesomeIcon icon={faCalendarDays} />
            {esMultidia ? " Fecha Inicio *" : " Fecha del Evento *"}
          </label>
          <input
            type="date"
            id="fecha_evento"
            name="fecha_evento"
            className={`publicar-form__input ${
              errors?.fecha_evento ? "error" : ""
            }`}
            value={fechaEvento}
            onChange={onChange}
            min={today}
          />
          {errors?.fecha_evento && (
            <span className="publicar-form__error">{errors.fecha_evento}</span>
          )}
        </div>

        {/* Checkbox multi-día */}
        <div className="date-range-picker__checkbox-wrapper">
          <label className="date-range-picker__checkbox-label">
            <input
              type="checkbox"
              checked={esMultidia}
              onChange={handleMultidiaChange}
              className="date-range-picker__checkbox"
            />
            <span className="date-range-picker__checkbox-custom"></span>
            <span className="date-range-picker__checkbox-text">
              <FontAwesomeIcon icon={faCalendarWeek} />
              ¿Tu panorama dura más de un día?
            </span>
          </label>
          <p className="date-range-picker__checkbox-hint">
            Festivales, ferias, exposiciones, etc.
          </p>
        </div>
      </div>

      {/* Panel expandible para eventos multi-día */}
      <div
        className={`date-range-picker__expanded ${isExpanded ? "open" : ""}`}>
        <div className="date-range-picker__expanded-content">
          {/* Indicador visual del rango */}
          <div className="date-range-picker__range-indicator">
            <div className="date-range-picker__range-line">
              <span className="date-range-picker__range-start">
                {formatearFecha(fechaEvento) || "Inicio"}
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="date-range-picker__range-arrow"
              />
              <span className="date-range-picker__range-end">
                {formatearFecha(fechaFin) || "Fin"}
              </span>
            </div>
            {duracion && (
              <span className="date-range-picker__duration-badge">
                {duracion} {duracion === 1 ? "día" : "días"}
              </span>
            )}
          </div>

          {/* Fecha fin */}
          <div className="date-range-picker__date-group date-range-picker__date-group--end">
            <label className="publicar-form__label" htmlFor="fecha_fin">
              <FontAwesomeIcon icon={faCalendarDays} /> Fecha Fin *
            </label>
            <input
              type="date"
              id="fecha_fin"
              name="fecha_fin"
              className={`publicar-form__input ${
                errors?.fecha_fin ? "error" : ""
              }`}
              value={fechaFin}
              onChange={onChange}
              min={fechaEvento || today}
            />
            {errors?.fecha_fin && (
              <span className="publicar-form__error">{errors.fecha_fin}</span>
            )}
          </div>

          {/* Opción de mismo horario */}
          <div className="date-range-picker__schedule-option">
            <label className="date-range-picker__checkbox-label date-range-picker__checkbox-label--small">
              <input
                type="checkbox"
                checked={mismoHorario}
                onChange={handleMismoHorarioChange}
                className="date-range-picker__checkbox"
              />
              <span className="date-range-picker__checkbox-custom"></span>
              <span className="date-range-picker__checkbox-text">
                El horario es el mismo todos los días
              </span>
            </label>
          </div>

          {/* Info adicional */}
          <div className="date-range-picker__info">
            <FontAwesomeIcon icon={faInfoCircle} />
            <p>
              Tu evento aparecerá en la superguía durante todas las fechas
              seleccionadas.
              {!mismoHorario && (
                <span className="date-range-picker__info-note">
                  {" "}
                  Puedes indicar horarios diferentes en la descripción.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
