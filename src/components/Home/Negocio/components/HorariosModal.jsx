import { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faTrash,
  faCopy,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import {
  DIAS_SEMANA,
  DEFAULT_TURNO,
  HOURS,
  MINUTES,
} from "./constants";

/**
 * Selector de hora/minuto individual
 */
const TimeSelect = ({ value, onChange }) => {
  const [hora, minuto] = value.split(":");

  return (
    <div className="horarios-modal__time-selects">
      <select
        className="horarios-modal__time-select"
        value={hora}
        onChange={(e) => onChange(`${e.target.value}:${minuto}`)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="horarios-modal__time-separator">:</span>
      <select
        className="horarios-modal__time-select"
        value={minuto}
        onChange={(e) => onChange(`${hora}:${e.target.value}`)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Modal de configuración de horarios por día.
 * Permite definir múltiples turnos por día, abierto 24h, y copiar horarios.
 */
const HorariosModal = ({
  isOpen,
  onClose,
  diasSeleccionados,
  horarios,
  abierto24h: initialAbierto24h,
  onSave,
}) => {
  const [localHorarios, setLocalHorarios] = useState({});
  const [abierto24h, setAbierto24h] = useState(false);

  // Ordenar días según el orden natural de la semana
  const orderedDias = useMemo(() => {
    return [...diasSeleccionados].sort(
      (a, b) => DIAS_SEMANA.indexOf(a) - DIAS_SEMANA.indexOf(b),
    );
  }, [diasSeleccionados]);

  // Inicializar estado local cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initial = {};
      diasSeleccionados.forEach((dia) => {
        initial[dia] =
          horarios[dia]?.length > 0
            ? horarios[dia].map((t) => ({ ...t }))
            : [{ ...DEFAULT_TURNO }];
      });
      setLocalHorarios(initial);
      setAbierto24h(initialAbierto24h || false);
    }
  }, [isOpen, diasSeleccionados, horarios, initialAbierto24h]);

  // Cambiar hora de un turno específico
  const handleTimeChange = useCallback((dia, slotIndex, field, value) => {
    setLocalHorarios((prev) => ({
      ...prev,
      [dia]: prev[dia].map((slot, i) =>
        i === slotIndex ? { ...slot, [field]: value } : slot,
      ),
    }));
  }, []);

  // Agregar turno adicional (ej: mañana + tarde)
  const addSlot = useCallback((dia) => {
    setLocalHorarios((prev) => ({
      ...prev,
      [dia]: [...prev[dia], { apertura: "14:00", cierre: "18:00" }],
    }));
  }, []);

  // Eliminar turno (solo si hay más de uno)
  const removeSlot = useCallback((dia, slotIndex) => {
    setLocalHorarios((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== slotIndex),
    }));
  }, []);

  // Copiar horarios del primer día a todos los demás
  const applyToAll = useCallback(
    (sourceDia) => {
      setLocalHorarios((prev) => {
        const sourceSlots = prev[sourceDia];
        const updated = {};
        Object.keys(prev).forEach((dia) => {
          updated[dia] = sourceSlots.map((s) => ({ ...s }));
        });
        return updated;
      });
    },
    [],
  );

  // Guardar y cerrar
  const handleSave = useCallback(() => {
    onSave(localHorarios, abierto24h);
    onClose();
  }, [localHorarios, abierto24h, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="horarios-modal__overlay" onClick={onClose}>
      <div
        className="horarios-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="horarios-modal__header">
          <h2 className="horarios-modal__title">
            <FontAwesomeIcon icon={faClock} />
            Configuración de Horarios
          </h2>
          <button
            type="button"
            className="horarios-modal__close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="horarios-modal__body">
          {/* Toggle 24h */}
          <label className="horarios-modal__24h-toggle">
            <input
              type="checkbox"
              checked={abierto24h}
              onChange={(e) => setAbierto24h(e.target.checked)}
            />
            <span>Abierto las 24 horas</span>
          </label>

          {/* Cards por día (ocultas si es 24h) */}
          {!abierto24h &&
            orderedDias.map((dia, diaIndex) => (
              <div className="horarios-modal__day-card" key={dia}>
                <h3 className="horarios-modal__day-name">{dia}</h3>

                {localHorarios[dia]?.map((turno, idx) => (
                  <div className="horarios-modal__turno" key={idx}>
                    <div className="horarios-modal__time-group">
                      <span className="horarios-modal__time-label">
                        Hora de Inicio
                      </span>
                      <TimeSelect
                        value={turno.apertura}
                        onChange={(val) =>
                          handleTimeChange(dia, idx, "apertura", val)
                        }
                      />
                    </div>

                    <div className="horarios-modal__time-group">
                      <span className="horarios-modal__time-label">
                        Hora de Término
                      </span>
                      <TimeSelect
                        value={turno.cierre}
                        onChange={(val) =>
                          handleTimeChange(dia, idx, "cierre", val)
                        }
                      />
                    </div>

                    {idx > 0 && (
                      <button
                        type="button"
                        className="horarios-modal__remove-turno"
                        onClick={() => removeSlot(dia, idx)}
                        title="Eliminar turno"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}

                <div className="horarios-modal__day-actions">
                  <button
                    type="button"
                    className="horarios-modal__add-turno"
                    onClick={() => addSlot(dia)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Agregar horario
                  </button>

                  {diaIndex === 0 && orderedDias.length > 1 && (
                    <button
                      type="button"
                      className="horarios-modal__apply-all"
                      onClick={() => applyToAll(dia)}
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      Aplicar a todos los días
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="horarios-modal__footer">
          <button
            type="button"
            className="horarios-modal__cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="horarios-modal__save"
            onClick={handleSave}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default HorariosModal;
