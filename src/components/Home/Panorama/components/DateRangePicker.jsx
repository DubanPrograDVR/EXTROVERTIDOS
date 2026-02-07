import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCalendarWeek,
  faArrowRight,
  faInfoCircle,
  faRepeat,
  faCalendarCheck,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/date-range-picker.css";

/** Nombres de días en español */
const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

/**
 * Calcula las fechas de recurrencia a partir de una fecha inicio,
 * repitiendo el mismo día de la semana N veces.
 * @param {string} fechaInicio - Fecha ISO (YYYY-MM-DD)
 * @param {number} cantidad - Cantidad de repeticiones (incluye la primera)
 * @returns {string[]} Array de fechas ISO
 */
const calcularFechasRecurrencia = (fechaInicio, cantidad) => {
  if (!fechaInicio || !cantidad || cantidad < 1) return [];
  const fechas = [];
  const inicio = new Date(fechaInicio + "T00:00:00");

  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i * 7); // cada 7 días = mismo día de semana
    fechas.push(fecha.toISOString().split("T")[0]);
  }

  return fechas;
};

/**
 * Componente para selección de fechas con soporte para:
 * - Eventos de un solo día
 * - Eventos multi-día (festivales, ferias)
 * - Eventos recurrentes (talleres que se repiten N semanas)
 */
const DateRangePicker = ({
  fechaEvento,
  fechaFin,
  esMultidia,
  esRecurrente,
  cantidadRepeticiones,
  fechasRecurrencia,
  mismoHorario,
  horaInicio,
  horaFin,
  onChange,
  errors,
}) => {
  // Estado local para animación de paneles
  const [isExpanded, setIsExpanded] = useState(esMultidia);
  const [isRecurrentExpanded, setIsRecurrentExpanded] = useState(esRecurrente);
  const [editingIndex, setEditingIndex] = useState(null);
  const dateInputRefs = useRef({});

  // Sincronizar estados expandidos con props
  useEffect(() => {
    setIsExpanded(esMultidia);
  }, [esMultidia]);

  useEffect(() => {
    setIsRecurrentExpanded(esRecurrente);
  }, [esRecurrente]);

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split("T")[0];

  // Detectar día de la semana de la fecha seleccionada
  const diaDetectado = useMemo(() => {
    if (!fechaEvento) return null;
    const date = new Date(fechaEvento + "T00:00:00");
    return DIAS_SEMANA[date.getDay()];
  }, [fechaEvento]);

  // Calcular fechas de recurrencia automáticamente (base sugerida)
  const fechasCalculadas = useMemo(() => {
    if (!esRecurrente || !fechaEvento) return [];
    return calcularFechasRecurrencia(fechaEvento, cantidadRepeticiones || 2);
  }, [esRecurrente, fechaEvento, cantidadRepeticiones]);

  // Las fechas finales son las personalizadas si existen, si no las calculadas
  const fechasFinales = useMemo(() => {
    if (fechasRecurrencia && fechasRecurrencia.length > 0) {
      return fechasRecurrencia;
    }
    return fechasCalculadas;
  }, [fechasRecurrencia, fechasCalculadas]);

  // Propagar fechas calculadas al padre cuando cambien (solo si no hay ediciones manuales)
  useEffect(() => {
    if (esRecurrente && fechasCalculadas.length > 0) {
      // Solo auto-propagar si no hay fechas personalizadas o si la cantidad cambió
      const currentLen = fechasRecurrencia?.length || 0;
      if (currentLen === 0 || currentLen !== fechasCalculadas.length) {
        onChange({
          target: {
            name: "fechas_recurrencia",
            value: fechasCalculadas,
          },
        });
      }
      // También actualizar el día de recurrencia
      if (diaDetectado) {
        onChange({
          target: {
            name: "dia_recurrencia",
            value: diaDetectado,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechasCalculadas.length, esRecurrente, diaDetectado]);

  // === Handlers para editar fechas individuales ===

  // Editar una fecha específica por índice
  const handleEditFecha = useCallback((index) => {
    setEditingIndex(index);
    // Abrir el date picker nativo después de un tick
    setTimeout(() => {
      const input = dateInputRefs.current[index];
      if (input) {
        input.showPicker?.();
        input.focus();
      }
    }, 50);
  }, []);

  // Guardar fecha editada
  const handleFechaChange = useCallback(
    (index, newDate) => {
      if (!newDate) return;
      const updated = [...fechasFinales];
      updated[index] = newDate;
      // Ordenar cronológicamente
      updated.sort();
      onChange({
        target: { name: "fechas_recurrencia", value: updated },
      });
      setEditingIndex(null);
    },
    [fechasFinales, onChange],
  );

  // Agregar una nueva fecha
  const handleAddFecha = useCallback(() => {
    // Sugerir la próxima semana después de la última fecha
    const lastDate = fechasFinales[fechasFinales.length - 1];
    let newDate = "";
    if (lastDate) {
      const d = new Date(lastDate + "T00:00:00");
      d.setDate(d.getDate() + 7);
      newDate = d.toISOString().split("T")[0];
    }
    const updated = [...fechasFinales, newDate];
    updated.sort((a, b) => (a && b ? a.localeCompare(b) : 0));
    onChange({
      target: { name: "fechas_recurrencia", value: updated },
    });
    // Abrir el editor en la nueva fecha
    setTimeout(() => {
      const newIndex = updated.indexOf(newDate);
      handleEditFecha(newIndex >= 0 ? newIndex : updated.length - 1);
    }, 100);
  }, [fechasFinales, onChange, handleEditFecha]);

  // Eliminar una fecha (mínimo 2)
  const handleRemoveFecha = useCallback(
    (index) => {
      if (fechasFinales.length <= 2) return;
      const updated = fechasFinales.filter((_, i) => i !== index);
      onChange({
        target: { name: "fechas_recurrencia", value: updated },
      });
      // Actualizar cantidad de repeticiones
      onChange({
        target: { name: "cantidad_repeticiones", value: updated.length },
      });
    },
    [fechasFinales, onChange],
  );

  // Manejar cambio del checkbox multi-día
  const handleMultidiaChange = (e) => {
    const checked = e.target.checked;

    // Si se activa multidía, desactivar recurrente
    if (checked) {
      onChange({
        target: { name: "es_recurrente", value: false, type: "checkbox" },
      });
      onChange({
        target: { name: "fechas_recurrencia", value: [] },
      });
      onChange({
        target: { name: "dia_recurrencia", value: "" },
      });
      onChange({
        target: { name: "cantidad_repeticiones", value: 2 },
      });
    }

    onChange({
      target: { name: "es_multidia", value: checked, type: "checkbox" },
    });

    // Si se desmarca, limpiar fecha fin
    if (!checked) {
      onChange({ target: { name: "fecha_fin", value: "" } });
    }
  };

  // Manejar cambio del checkbox recurrente
  const handleRecurrenteChange = (e) => {
    const checked = e.target.checked;

    // Si se activa recurrente, desactivar multidía
    if (checked) {
      onChange({
        target: { name: "es_multidia", value: false, type: "checkbox" },
      });
      onChange({ target: { name: "fecha_fin", value: "" } });
    } else {
      // Limpiar campos de recurrencia
      onChange({
        target: { name: "fechas_recurrencia", value: [] },
      });
      onChange({
        target: { name: "dia_recurrencia", value: "" },
      });
      onChange({
        target: { name: "cantidad_repeticiones", value: 2 },
      });
    }

    onChange({
      target: { name: "es_recurrente", value: checked, type: "checkbox" },
    });
  };

  // Manejar cambio de cantidad de repeticiones
  const handleRepeticionesChange = (e) => {
    const value = Math.min(12, Math.max(2, parseInt(e.target.value) || 2));
    onChange({
      target: { name: "cantidad_repeticiones", value },
    });
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
      {/* Fila principal: Fecha inicio y checkboxes */}
      <div className="date-range-picker__main-row">
        {/* Fecha de inicio (siempre visible) */}
        <div className="date-range-picker__date-group">
          <label className="publicar-form__label" htmlFor="fecha_evento">
            <FontAwesomeIcon icon={faCalendarDays} />
            {esMultidia
              ? " Fecha Inicio *"
              : esRecurrente
                ? " Primera Fecha *"
                : " Fecha del Evento *"}
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

        {/* Checkboxes: multi-día y recurrente */}
        <div className="date-range-picker__options-column">
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
                ¿Dura más de un día?
              </span>
            </label>
            <p className="date-range-picker__checkbox-hint">
              Festivales, ferias, exposiciones
            </p>
          </div>

          {/* Checkbox recurrente */}
          <div className="date-range-picker__checkbox-wrapper">
            <label className="date-range-picker__checkbox-label">
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={handleRecurrenteChange}
                className="date-range-picker__checkbox"
              />
              <span className="date-range-picker__checkbox-custom"></span>
              <span className="date-range-picker__checkbox-text">
                <FontAwesomeIcon icon={faRepeat} />
                ¿Se repite ciertos días?
              </span>
            </label>
            <p className="date-range-picker__checkbox-hint">
              Talleres, clases, eventos semanales
            </p>
          </div>
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

      {/* ===== Panel expandible para eventos recurrentes ===== */}
      <div
        className={`date-range-picker__expanded ${isRecurrentExpanded ? "open" : ""}`}>
        <div className="date-range-picker__expanded-content date-range-picker__expanded-content--recurrent">
          {/* Día detectado automáticamente */}
          {diaDetectado && (
            <div className="date-range-picker__detected-day">
              <FontAwesomeIcon icon={faCalendarCheck} />
              <span>
                Tu evento cae en día{" "}
                <strong>
                  {diaDetectado.charAt(0).toUpperCase() + diaDetectado.slice(1)}
                </strong>
              </span>
            </div>
          )}

          {!fechaEvento && (
            <div className="date-range-picker__detected-day date-range-picker__detected-day--warning">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>
                Primero selecciona la fecha de inicio para detectar el día
              </span>
            </div>
          )}

          {/* Selector de cantidad de repeticiones */}
          <div className="date-range-picker__repeticiones">
            <label className="date-range-picker__repeticiones-label">
              ¿Cuántas veces se repite?
            </label>
            <div className="date-range-picker__repeticiones-control">
              <button
                type="button"
                className="date-range-picker__repeticiones-btn"
                onClick={() =>
                  handleRepeticionesChange({
                    target: { value: (cantidadRepeticiones || 2) - 1 },
                  })
                }
                disabled={cantidadRepeticiones <= 2}>
                −
              </button>
              <span className="date-range-picker__repeticiones-value">
                {cantidadRepeticiones || 2}
              </span>
              <button
                type="button"
                className="date-range-picker__repeticiones-btn"
                onClick={() =>
                  handleRepeticionesChange({
                    target: { value: (cantidadRepeticiones || 2) + 1 },
                  })
                }
                disabled={cantidadRepeticiones >= 12}>
                +
              </button>
              <span className="date-range-picker__repeticiones-suffix">
                {diaDetectado
                  ? `${diaDetectado.charAt(0).toUpperCase() + diaDetectado.slice(1)}s seguidos`
                  : "semanas seguidas"}
              </span>
            </div>
          </div>

          {/* Vista previa de fechas — editables */}
          {fechasFinales.length > 0 && (
            <div className="date-range-picker__fechas-preview">
              <p className="date-range-picker__fechas-title">
                <FontAwesomeIcon icon={faCalendarDays} /> Tu evento aparecerá
                estas fechas:
              </p>
              <p className="date-range-picker__fechas-hint">
                Haz clic en una fecha para cambiarla
              </p>
              <div className="date-range-picker__fechas-list">
                {fechasFinales.map((fecha, index) => (
                  <div
                    key={`${fecha}-${index}`}
                    className={`date-range-picker__fecha-chip ${
                      index === 0 ? "date-range-picker__fecha-chip--first" : ""
                    } ${editingIndex === index ? "date-range-picker__fecha-chip--editing" : ""}`}>
                    {editingIndex === index ? (
                      <input
                        ref={(el) => (dateInputRefs.current[index] = el)}
                        type="date"
                        className="date-range-picker__fecha-edit-input"
                        value={fecha}
                        min={today}
                        onChange={(e) =>
                          handleFechaChange(index, e.target.value)
                        }
                        onBlur={() => setEditingIndex(null)}
                      />
                    ) : (
                      <>
                        <span
                          className="date-range-picker__fecha-text"
                          onClick={() => handleEditFecha(index)}
                          title="Clic para cambiar esta fecha">
                          {formatearFecha(fecha)}
                          {index === 0 && (
                            <span className="date-range-picker__fecha-badge">
                              Inicio
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="date-range-picker__fecha-edit-btn"
                          onClick={() => handleEditFecha(index)}
                          title="Editar fecha">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        {fechasFinales.length > 2 && (
                          <button
                            type="button"
                            className="date-range-picker__fecha-remove-btn"
                            onClick={() => handleRemoveFecha(index)}
                            title="Eliminar fecha">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Botón para agregar más fechas */}
                {fechasFinales.length < 12 && (
                  <button
                    type="button"
                    className="date-range-picker__fecha-add"
                    onClick={handleAddFecha}
                    title="Agregar otra fecha">
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info adicional */}
          <div className="date-range-picker__info">
            <FontAwesomeIcon icon={faInfoCircle} />
            <p>
              Tu evento se mostrará en la superguía en cada una de las fechas
              indicadas. Puedes editar cualquier fecha para ajustarla a tu
              necesidad. El horario será el mismo para todas las fechas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
