import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCalendarWeek,
  faArrowRight,
  faInfoCircle,
  faCalendarCheck,
  faPen,
  faPlus,
  faTrash,
  faChevronLeft,
  faChevronRight,
  faStar,
  faBolt,
  faClock,
  faCalendarDay,
  faXmark,
  faChampagneGlasses,
  faFlag,
  faGift,
  faAngleDown,
  faLayerGroup,
  faListCheck,
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

const DIAS_SEMANA_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// ===== FERIADOS DE CHILE =====
const getFeriadosChile = (year) => {
  const fijos = [
    { m: 1, d: 1, nombre: "Año Nuevo" },
    { m: 5, d: 1, nombre: "Día del Trabajo" },
    { m: 5, d: 21, nombre: "Día de las Glorias Navales" },
    { m: 6, d: 20, nombre: "Día Nacional de los Pueblos Indígenas" },
    { m: 6, d: 29, nombre: "San Pedro y San Pablo" },
    { m: 7, d: 16, nombre: "Virgen del Carmen" },
    { m: 8, d: 15, nombre: "Asunción de la Virgen" },
    { m: 9, d: 18, nombre: "Fiestas Patrias" },
    { m: 9, d: 19, nombre: "Día de las Glorias del Ejército" },
    { m: 10, d: 12, nombre: "Encuentro de Dos Mundos" },
    { m: 10, d: 31, nombre: "Día de las Iglesias Evangélicas" },
    { m: 11, d: 1, nombre: "Día de Todos los Santos" },
    { m: 12, d: 8, nombre: "Inmaculada Concepción" },
    { m: 12, d: 25, nombre: "Navidad" },
  ];
  const map = {};
  for (const f of fijos) {
    const key = `${year}-${String(f.m).padStart(2, "0")}-${String(f.d).padStart(2, "0")}`;
    map[key] = f.nombre;
  }
  return map;
};

// ===== HELPERS =====
const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: toISO(new Date(year, month - 1, daysInPrevMonth - i)),
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: toISO(new Date(year, month, d)),
      day: d,
      isCurrentMonth: true,
    });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: toISO(new Date(year, month + 1, i)),
      day: i,
      isCurrentMonth: false,
    });
  }
  return days;
};

const isWeekendCol = (colIndex) => colIndex === 5 || colIndex === 6;

// ===== COMPONENTE =====
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
  const today = new Date();
  const todayISO = toISO(today);
  const initialDate = fechaEvento ? new Date(fechaEvento + "T00:00:00") : today;

  // === Selection mode: "single" | "range" | "specific" ===
  const [selectionMode, setSelectionMode] = useState(() => {
    if (esRecurrente && fechasRecurrencia?.length > 0) return "specific";
    if (esMultidia && fechaFin) return "range";
    return "single";
  });

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [rangeStep, setRangeStep] = useState(
    esMultidia && fechaEvento && fechaFin ? "complete" : "start",
  );
  const [hoverDate, setHoverDate] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const dateInputRefs = useRef({});

  // Feriados
  const feriados = useMemo(
    () => ({
      ...getFeriadosChile(viewYear),
      ...getFeriadosChile(viewYear + 1),
      ...getFeriadosChile(viewYear - 1),
    }),
    [viewYear],
  );

  // Sync mode from props on mount/draft load
  useEffect(() => {
    if (esRecurrente && fechasRecurrencia?.length > 0)
      setSelectionMode("specific");
    else if (esMultidia && fechaFin) setSelectionMode("range");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectionMode === "range") {
      if (fechaEvento && fechaFin) setRangeStep("complete");
      else if (fechaEvento) setRangeStep("end");
      else setRangeStep("start");
    }
  }, [selectionMode, fechaEvento, fechaFin]);

  // Specific dates set for highlighting
  const specificDatesSet = useMemo(
    () => new Set(selectionMode === "specific" ? fechasRecurrencia || [] : []),
    [selectionMode, fechasRecurrencia],
  );

  // Calendar days
  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const calendarDays2 = useMemo(
    () =>
      selectionMode === "range"
        ? getCalendarDays(nextMonthYear, nextMonth)
        : [],
    [selectionMode, nextMonthYear, nextMonth],
  );

  // Days countdown
  const diasRestantes = useMemo(() => {
    if (!fechaEvento) return null;
    const evento = new Date(fechaEvento + "T00:00:00");
    const hoy = new Date(todayISO + "T00:00:00");
    return Math.ceil((evento - hoy) / (1000 * 60 * 60 * 24));
  }, [fechaEvento, todayISO]);

  // ===== MODE SWITCHING =====
  const switchToSingle = () => {
    setSelectionMode("single");
    onChange({
      target: { name: "es_multidia", value: false, type: "checkbox" },
    });
    onChange({
      target: { name: "es_recurrente", value: false, type: "checkbox" },
    });
    onChange({ target: { name: "fecha_fin", value: "" } });
    onChange({ target: { name: "fechas_recurrencia", value: [] } });
    onChange({ target: { name: "dia_recurrencia", value: "" } });
    onChange({ target: { name: "cantidad_repeticiones", value: 2 } });
    setRangeStep("start");
  };

  const switchToRange = () => {
    setSelectionMode("range");
    onChange({
      target: { name: "es_multidia", value: true, type: "checkbox" },
    });
    onChange({
      target: { name: "es_recurrente", value: false, type: "checkbox" },
    });
    onChange({ target: { name: "fechas_recurrencia", value: [] } });
    onChange({ target: { name: "dia_recurrencia", value: "" } });
    onChange({ target: { name: "cantidad_repeticiones", value: 2 } });
    if (fechaEvento) {
      setRangeStep("end");
    } else {
      setRangeStep("start");
    }
  };

  const switchToSpecific = () => {
    setSelectionMode("specific");
    onChange({
      target: { name: "es_recurrente", value: true, type: "checkbox" },
    });
    onChange({
      target: { name: "es_multidia", value: false, type: "checkbox" },
    });
    onChange({ target: { name: "fecha_fin", value: "" } });
    const initial = fechaEvento ? [fechaEvento] : [];
    onChange({ target: { name: "fechas_recurrencia", value: initial } });
    setRangeStep("start");
  };

  // ===== NAVIGATION =====
  const goToPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };
  const goToNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };
  const jumpToMonth = (monthIdx) => {
    setViewMonth(monthIdx);
    setShowYearPicker(false);
  };
  const jumpToYear = (yr) => {
    setViewYear(yr);
  };

  // ===== DAY CLICK HANDLER =====
  const handleDayClick = (dateStr) => {
    if (dateStr < todayISO) return;

    if (selectionMode === "specific") {
      const currentDates = [...(fechasRecurrencia || [])];
      const idx = currentDates.indexOf(dateStr);
      if (idx >= 0) {
        if (currentDates.length <= 1) return;
        currentDates.splice(idx, 1);
      } else {
        if (currentDates.length >= 12) return;
        currentDates.push(dateStr);
      }
      currentDates.sort();
      onChange({ target: { name: "fechas_recurrencia", value: currentDates } });
      onChange({ target: { name: "fecha_evento", value: currentDates[0] } });
      onChange({
        target: { name: "cantidad_repeticiones", value: currentDates.length },
      });
      return;
    }

    if (selectionMode === "range") {
      if (rangeStep === "start" || rangeStep === "complete") {
        onChange({ target: { name: "fecha_evento", value: dateStr } });
        onChange({ target: { name: "fecha_fin", value: "" } });
        setRangeStep("end");
      } else if (rangeStep === "end") {
        if (dateStr < fechaEvento) {
          onChange({ target: { name: "fecha_fin", value: fechaEvento } });
          onChange({ target: { name: "fecha_evento", value: dateStr } });
        } else if (dateStr === fechaEvento) {
          setRangeStep("end");
          return;
        } else {
          onChange({ target: { name: "fecha_fin", value: dateStr } });
        }
        setRangeStep("complete");
      }
      return;
    }

    // Single mode
    onChange({ target: { name: "fecha_evento", value: dateStr } });
    const d = new Date(dateStr + "T00:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleDayHover = (dateStr) => {
    if (selectionMode === "range" && rangeStep === "end") setHoverDate(dateStr);
  };

  // ===== DAY CLASSES =====
  const getDayClasses = (dayObj, colIndex) => {
    const { date, isCurrentMonth } = dayObj;
    const classes = ["drp-calendar__day"];
    if (!isCurrentMonth) classes.push("drp-calendar__day--outside");
    if (date < todayISO) classes.push("drp-calendar__day--past");
    if (date === todayISO) classes.push("drp-calendar__day--today");
    if (isWeekendCol(colIndex)) classes.push("drp-calendar__day--weekend");
    if (feriados[date]) classes.push("drp-calendar__day--holiday");

    if (selectionMode === "range" && fechaEvento && (fechaFin || hoverDate)) {
      const endDate = rangeStep === "end" ? hoverDate : fechaFin;
      if (endDate) {
        const start = fechaEvento < endDate ? fechaEvento : endDate;
        const end = fechaEvento < endDate ? endDate : fechaEvento;
        if (date === start) classes.push("drp-calendar__day--range-start");
        if (date === end) classes.push("drp-calendar__day--range-end");
        if (date > start && date < end)
          classes.push("drp-calendar__day--in-range");
      }
    }

    if (selectionMode === "specific") {
      if (specificDatesSet.has(date))
        classes.push("drp-calendar__day--selected");
    } else {
      if (date === fechaEvento) classes.push("drp-calendar__day--selected");
      if (selectionMode === "range" && date === fechaFin)
        classes.push("drp-calendar__day--selected");
    }
    return classes.join(" ");
  };

  // ===== QUICK SELECTS =====
  const handleQuickSelect = (type) => {
    const now = new Date();
    switch (type) {
      case "today":
        if (selectionMode !== "single") switchToSingle();
        onChange({ target: { name: "fecha_evento", value: todayISO } });
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        break;
      case "tomorrow": {
        const tom = new Date(now);
        tom.setDate(tom.getDate() + 1);
        if (selectionMode !== "single") switchToSingle();
        onChange({ target: { name: "fecha_evento", value: toISO(tom) } });
        setViewYear(tom.getFullYear());
        setViewMonth(tom.getMonth());
        break;
      }
      case "weekend": {
        const sat = new Date(now);
        const dow = sat.getDay();
        sat.setDate(sat.getDate() + (dow === 6 ? 0 : 6 - dow));
        const sun = new Date(sat);
        sun.setDate(sun.getDate() + 1);
        if (selectionMode !== "range") {
          setSelectionMode("range");
          onChange({
            target: { name: "es_multidia", value: true, type: "checkbox" },
          });
          onChange({
            target: { name: "es_recurrente", value: false, type: "checkbox" },
          });
          onChange({ target: { name: "fechas_recurrencia", value: [] } });
        }
        onChange({ target: { name: "fecha_evento", value: toISO(sat) } });
        onChange({ target: { name: "fecha_fin", value: toISO(sun) } });
        setRangeStep("complete");
        setViewYear(sat.getFullYear());
        setViewMonth(sat.getMonth());
        break;
      }
      case "nextweek": {
        const mon = new Date(now);
        const dw = mon.getDay();
        mon.setDate(mon.getDate() + (dw === 0 ? 1 : dw === 1 ? 7 : 8 - dw));
        const fri = new Date(mon);
        fri.setDate(fri.getDate() + 4);
        if (selectionMode !== "range") {
          setSelectionMode("range");
          onChange({
            target: { name: "es_multidia", value: true, type: "checkbox" },
          });
          onChange({
            target: { name: "es_recurrente", value: false, type: "checkbox" },
          });
          onChange({ target: { name: "fechas_recurrencia", value: [] } });
        }
        onChange({ target: { name: "fecha_evento", value: toISO(mon) } });
        onChange({ target: { name: "fecha_fin", value: toISO(fri) } });
        setRangeStep("complete");
        setViewYear(mon.getFullYear());
        setViewMonth(mon.getMonth());
        break;
      }
      default:
        break;
    }
  };

  const handleSeasonSelect = (type) => {
    const yr = today.getFullYear();
    switch (type) {
      case "newyear":
        if (selectionMode !== "single") switchToSingle();
        onChange({
          target: { name: "fecha_evento", value: `${yr + 1}-01-01` },
        });
        setViewYear(yr + 1);
        setViewMonth(0);
        break;
      case "patrias":
        if (selectionMode !== "range") {
          setSelectionMode("range");
          onChange({
            target: { name: "es_multidia", value: true, type: "checkbox" },
          });
          onChange({
            target: { name: "es_recurrente", value: false, type: "checkbox" },
          });
          onChange({ target: { name: "fechas_recurrencia", value: [] } });
        }
        onChange({ target: { name: "fecha_evento", value: `${yr}-09-18` } });
        onChange({ target: { name: "fecha_fin", value: `${yr}-09-19` } });
        setRangeStep("complete");
        setViewYear(yr);
        setViewMonth(8);
        break;
      case "navidad":
        if (selectionMode !== "single") switchToSingle();
        onChange({ target: { name: "fecha_evento", value: `${yr}-12-25` } });
        setViewYear(yr);
        setViewMonth(11);
        break;
      default:
        break;
    }
  };

  // ===== CLEAR =====
  const handleClearSelection = () => {
    setSelectionMode("single");
    onChange({ target: { name: "fecha_evento", value: "" } });
    onChange({ target: { name: "fecha_fin", value: "" } });
    onChange({ target: { name: "hora_inicio", value: "" } });
    onChange({ target: { name: "hora_fin", value: "" } });
    onChange({
      target: { name: "es_multidia", value: false, type: "checkbox" },
    });
    onChange({
      target: { name: "es_recurrente", value: false, type: "checkbox" },
    });
    onChange({ target: { name: "fechas_recurrencia", value: [] } });
    onChange({ target: { name: "dia_recurrencia", value: "" } });
    onChange({ target: { name: "cantidad_repeticiones", value: 2 } });
    setRangeStep("start");
  };

  const handleMismoHorarioChange = (e) => {
    onChange({
      target: {
        name: "mismo_horario",
        value: e.target.checked,
        type: "checkbox",
      },
    });
  };

  // ===== SPECIFIC DATES MANAGEMENT =====
  const handleEditFecha = useCallback((index) => {
    setEditingIndex(index);
    setTimeout(() => {
      const input = dateInputRefs.current[index];
      if (input) {
        input.showPicker?.();
        input.focus();
      }
    }, 50);
  }, []);

  const handleFechaChange = useCallback(
    (index, newDate) => {
      if (!newDate) return;
      const updated = [...(fechasRecurrencia || [])];
      updated[index] = newDate;
      updated.sort();
      onChange({ target: { name: "fechas_recurrencia", value: updated } });
      onChange({ target: { name: "fecha_evento", value: updated[0] } });
      setEditingIndex(null);
    },
    [fechasRecurrencia, onChange],
  );

  const handleRemoveFecha = useCallback(
    (index) => {
      const current = fechasRecurrencia || [];
      if (current.length <= 1) return;
      const updated = current.filter((_, i) => i !== index);
      onChange({ target: { name: "fechas_recurrencia", value: updated } });
      onChange({ target: { name: "fecha_evento", value: updated[0] } });
      onChange({
        target: { name: "cantidad_repeticiones", value: updated.length },
      });
    },
    [fechasRecurrencia, onChange],
  );

  // ===== FORMATTING =====
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatearFechaLarga = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calcularDuracion = () => {
    if (!fechaEvento || !fechaFin) return null;
    return (
      Math.ceil(
        Math.abs(new Date(fechaFin) - new Date(fechaEvento)) /
          (1000 * 60 * 60 * 24),
      ) + 1
    );
  };

  const duracion = calcularDuracion();
  const isPrevDisabled =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  // ===== RENDER GRID =====
  const renderCalendarGrid = (days, monthLabel) => (
    <div className="drp-calendar__month-block">
      {monthLabel && (
        <div className="drp-calendar__month-label">{monthLabel}</div>
      )}
      <div className="drp-calendar__grid">
        {DIAS_SEMANA_CORTOS.map((d, i) => (
          <div
            key={d}
            className={`drp-calendar__day-header ${isWeekendCol(i) ? "drp-calendar__day-header--weekend" : ""}`}>
            {d}
          </div>
        ))}
        {days.map((dayObj, idx) => {
          const colIndex = idx % 7;
          const holidayName = feriados[dayObj.date];
          return (
            <button
              key={dayObj.date}
              type="button"
              className={getDayClasses(dayObj, colIndex)}
              onClick={() => handleDayClick(dayObj.date)}
              onMouseEnter={() => handleDayHover(dayObj.date)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={dayObj.date < todayISO}
              title={
                holidayName
                  ? `${formatearFechaLarga(dayObj.date)}  ${holidayName}`
                  : formatearFechaLarga(dayObj.date)
              }>
              <span className="drp-calendar__day-number">{dayObj.day}</span>
              {dayObj.date === todayISO && (
                <span className="drp-calendar__today-dot" />
              )}
              {specificDatesSet.has(dayObj.date) && (
                <span className="drp-calendar__recurring-dot" />
              )}
              {holidayName && dayObj.isCurrentMonth && (
                <span className="drp-calendar__holiday-dot" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const yearOptions = [];
  for (let y = today.getFullYear(); y <= today.getFullYear() + 3; y++)
    yearOptions.push(y);

  const specificDates = fechasRecurrencia || [];

  return (
    <div className="drp-calendar">
      {/* HEADER */}
      <div className="drp-calendar__header">
        <div className="drp-calendar__header-left">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="drp-calendar__header-icon"
          />
          <span className="drp-calendar__header-title">Fecha del Evento</span>
          <span className="drp-calendar__header-required">*</span>
        </div>
        {fechaEvento && (
          <button
            type="button"
            className="drp-calendar__clear-btn"
            onClick={handleClearSelection}
            title="Quitar fecha">
            <FontAwesomeIcon icon={faXmark} /> Quitar
          </button>
        )}
      </div>

      {/* MODE SELECTOR */}
      <div className="drp-calendar__mode-bar">
        <span className="drp-calendar__mode-label">¿Cómo dura tu evento?</span>
        <div className="drp-calendar__mode-options">
          <button
            type="button"
            className={`drp-calendar__mode-btn ${selectionMode === "single" ? "active" : ""}`}
            onClick={switchToSingle}>
            <FontAwesomeIcon icon={faCalendarDay} />
            <span>Un día</span>
          </button>
          <button
            type="button"
            className={`drp-calendar__mode-btn ${selectionMode === "range" ? "active" : ""}`}
            onClick={switchToRange}>
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>Varios días seguidos</span>
          </button>
          <button
            type="button"
            className={`drp-calendar__mode-btn ${selectionMode === "specific" ? "active" : ""}`}
            onClick={switchToSpecific}>
            <FontAwesomeIcon icon={faListCheck} />
            <span>Fechas específicas</span>
          </button>
        </div>
      </div>

      {/* CONTEXT HINT */}
      <div className="drp-calendar__mode-hint">
        {selectionMode === "single" && (
          <p>
            <FontAwesomeIcon icon={faInfoCircle} /> Haz clic en un día del
            calendario para seleccionarlo
          </p>
        )}
        {selectionMode === "range" && rangeStep === "start" && (
          <p>
            <FontAwesomeIcon icon={faInfoCircle} /> Haz clic en el día de{" "}
            <strong>inicio</strong> de tu evento
          </p>
        )}
        {selectionMode === "range" && rangeStep === "end" && (
          <p>
            <FontAwesomeIcon icon={faInfoCircle} /> Ahora haz clic en el día de{" "}
            <strong>fin</strong> de tu evento
          </p>
        )}
        {selectionMode === "range" && rangeStep === "complete" && !fechaFin && (
          <p>
            <FontAwesomeIcon icon={faInfoCircle} /> Haz clic en el día de{" "}
            <strong>fin</strong> de tu evento
          </p>
        )}
        {selectionMode === "specific" && (
          <p>
            <FontAwesomeIcon icon={faInfoCircle} /> Haz clic en los días del
            calendario para <strong>agregar o quitar</strong> fechas
          </p>
        )}
      </div>

      {/* QUICK BAR */}
      <div className="drp-calendar__quick-bar">
        <button
          type="button"
          className={`drp-calendar__quick-btn ${fechaEvento === todayISO && selectionMode === "single" ? "active" : ""}`}
          onClick={() => handleQuickSelect("today")}>
          <FontAwesomeIcon icon={faBolt} /> Hoy
        </button>
        <button
          type="button"
          className="drp-calendar__quick-btn"
          onClick={() => handleQuickSelect("tomorrow")}>
          <FontAwesomeIcon icon={faCalendarDay} /> Mañana
        </button>
        <button
          type="button"
          className="drp-calendar__quick-btn"
          onClick={() => handleQuickSelect("weekend")}>
          <FontAwesomeIcon icon={faStar} /> Fin de semana
        </button>
        <button
          type="button"
          className="drp-calendar__quick-btn"
          onClick={() => handleQuickSelect("nextweek")}>
          <FontAwesomeIcon icon={faCalendarWeek} /> Próxima semana
        </button>
      </div>

      {/* SEASON BAR */}
      <div className="drp-calendar__season-bar">
        <button
          type="button"
          className="drp-calendar__season-btn"
          onClick={() => handleSeasonSelect("newyear")}>
          <FontAwesomeIcon icon={faChampagneGlasses} /> Año Nuevo
        </button>
        <button
          type="button"
          className="drp-calendar__season-btn"
          onClick={() => handleSeasonSelect("patrias")}>
          <FontAwesomeIcon icon={faFlag} /> Fiestas Patrias
        </button>
        <button
          type="button"
          className="drp-calendar__season-btn"
          onClick={() => handleSeasonSelect("navidad")}>
          <FontAwesomeIcon icon={faGift} /> Navidad
        </button>
      </div>

      {/* MONTH NAV */}
      <div className="drp-calendar__nav">
        <button
          type="button"
          className="drp-calendar__nav-btn"
          onClick={goToPrevMonth}
          disabled={isPrevDisabled}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="drp-calendar__nav-center">
          <button
            type="button"
            className="drp-calendar__nav-current"
            onClick={() => setShowYearPicker(!showYearPicker)}
            title="Saltar a mes">
            {MESES[viewMonth]} {viewYear}{" "}
            <FontAwesomeIcon
              icon={faAngleDown}
              className={`drp-calendar__nav-arrow ${showYearPicker ? "open" : ""}`}
            />
          </button>
        </div>
        <button
          type="button"
          className="drp-calendar__nav-btn"
          onClick={goToNextMonth}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* YEAR PICKER */}
      {showYearPicker && (
        <div className="drp-calendar__year-picker">
          <div className="drp-calendar__year-tabs">
            {yearOptions.map((yr) => (
              <button
                key={yr}
                type="button"
                className={`drp-calendar__year-tab ${yr === viewYear ? "active" : ""}`}
                onClick={() => jumpToYear(yr)}>
                {yr}
              </button>
            ))}
          </div>
          <div className="drp-calendar__month-grid">
            {MESES_CORTOS.map((m, i) => {
              const isPast =
                viewYear === today.getFullYear() && i < today.getMonth();
              return (
                <button
                  key={m}
                  type="button"
                  className={`drp-calendar__month-cell ${i === viewMonth ? "active" : ""} ${isPast ? "past" : ""}`}
                  onClick={() => jumpToMonth(i)}
                  disabled={isPast}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDAR GRID(S) */}
      <div
        className={`drp-calendar__grids-container ${selectionMode === "range" ? "drp-calendar__grids-container--dual" : ""}`}>
        {renderCalendarGrid(
          calendarDays,
          selectionMode === "range" ? `${MESES[viewMonth]} ${viewYear}` : null,
        )}
        {selectionMode === "range" &&
          renderCalendarGrid(
            calendarDays2,
            `${MESES[nextMonth]} ${nextMonthYear}`,
          )}
      </div>

      {/* LEGEND */}
      <div className="drp-calendar__legend">
        <span className="drp-calendar__legend-item">
          <span className="drp-calendar__legend-dot drp-calendar__legend-dot--today" />{" "}
          Hoy
        </span>
        <span className="drp-calendar__legend-item">
          <span className="drp-calendar__legend-dot drp-calendar__legend-dot--holiday" />{" "}
          Feriado
        </span>
        <span className="drp-calendar__legend-item">
          <span className="drp-calendar__legend-dot drp-calendar__legend-dot--weekend" />{" "}
          Fin de semana
        </span>
        {selectionMode === "specific" && (
          <span className="drp-calendar__legend-item">
            <span className="drp-calendar__legend-dot drp-calendar__legend-dot--selected" />{" "}
            Seleccionado
          </span>
        )}
      </div>

      {/* SELECTION SUMMARY */}
      {selectionMode === "single" && fechaEvento && (
        <div className="drp-calendar__selection-summary">
          <div className="drp-calendar__single-summary">
            <FontAwesomeIcon icon={faCalendarCheck} />
            <span>{formatearFechaLarga(fechaEvento)}</span>
            {diasRestantes !== null && diasRestantes >= 0 && (
              <span className="drp-calendar__countdown">
                {diasRestantes === 0
                  ? "¡Es hoy!"
                  : diasRestantes === 1
                    ? "Mañana"
                    : `Faltan ${diasRestantes} días`}
              </span>
            )}
          </div>
          {feriados[fechaEvento] && (
            <div className="drp-calendar__holiday-badge">
              <FontAwesomeIcon icon={faStar} /> {feriados[fechaEvento]}
            </div>
          )}
        </div>
      )}

      {selectionMode === "range" && fechaEvento && fechaFin && (
        <div className="drp-calendar__selection-summary">
          <div className="drp-calendar__range-summary">
            <span className="drp-calendar__range-date">
              {formatearFecha(fechaEvento)}
            </span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="drp-calendar__range-arrow"
            />
            <span className="drp-calendar__range-date">
              {formatearFecha(fechaFin)}
            </span>
            {duracion && (
              <span className="drp-calendar__duration-badge">
                {duracion} {duracion === 1 ? "día" : "días"}
              </span>
            )}
          </div>
          <div className="drp-calendar__schedule-opt">
            <label className="drp-calendar__mini-toggle">
              <input
                type="checkbox"
                checked={mismoHorario}
                onChange={handleMismoHorarioChange}
                className="drp-calendar__toggle-input"
              />
              <span className="drp-calendar__toggle-switch drp-calendar__toggle-switch--sm" />
              <span className="drp-calendar__schedule-text">
                <FontAwesomeIcon icon={faClock} /> Mismo horario todos los días
              </span>
            </label>
          </div>
        </div>
      )}

      {selectionMode === "range" && fechaEvento && !fechaFin && (
        <div className="drp-calendar__selection-summary">
          <div className="drp-calendar__range-hint">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>
              Inicio: <strong>{formatearFecha(fechaEvento)}</strong> Selecciona
              la fecha de fin
            </span>
          </div>
        </div>
      )}

      {selectionMode === "specific" && specificDates.length > 0 && (
        <div className="drp-calendar__selection-summary">
          <div className="drp-calendar__specific-summary">
            <p className="drp-calendar__dates-title">
              <FontAwesomeIcon icon={faCalendarDays} /> {specificDates.length}{" "}
              {specificDates.length === 1
                ? "fecha seleccionada"
                : "fechas seleccionadas"}
            </p>
            <div className="drp-calendar__dates-list">
              {specificDates.map((fecha, index) => (
                <div
                  key={`${fecha}-${index}`}
                  className={`drp-calendar__date-chip ${editingIndex === index ? "drp-calendar__date-chip--editing" : ""}`}>
                  {editingIndex === index ? (
                    <input
                      ref={(el) => (dateInputRefs.current[index] = el)}
                      type="date"
                      className="drp-calendar__date-edit-input"
                      value={fecha}
                      min={todayISO}
                      onChange={(e) => handleFechaChange(index, e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                    />
                  ) : (
                    <>
                      <span
                        className="drp-calendar__date-text"
                        onClick={() => handleEditFecha(index)}
                        title="Clic para cambiar">
                        {formatearFecha(fecha)}
                      </span>
                      <button
                        type="button"
                        className="drp-calendar__date-edit-btn"
                        onClick={() => handleEditFecha(index)}
                        title="Editar">
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      {specificDates.length > 1 && (
                        <button
                          type="button"
                          className="drp-calendar__date-remove-btn"
                          onClick={() => handleRemoveFecha(index)}
                          title="Quitar">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="drp-calendar__tip">
              <FontAwesomeIcon icon={faInfoCircle} />
              <p>
                Tu evento se mostrará en la superguía en cada una de estas
                fechas. También puedes agregar fechas haciendo clic en el
                calendario.
              </p>
            </div>
          </div>
        </div>
      )}

      {errors?.fecha_evento && (
        <span className="publicar-form__error">{errors.fecha_evento}</span>
      )}

      {/* TIME INPUTS */}
      {fechaEvento && (
        <div className="drp-calendar__time-section">
          <div className="drp-calendar__time-row">
            <div className="drp-calendar__time-field">
              <label className="drp-calendar__time-label" htmlFor="hora_inicio">
                <FontAwesomeIcon icon={faClock} /> Hora Inicio
                <span className="drp-calendar__time-hint">(Opcional)</span>
              </label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                className="drp-calendar__time-input"
                value={horaInicio}
                onChange={onChange}
              />
            </div>
            <div className="drp-calendar__time-field">
              <label className="drp-calendar__time-label" htmlFor="hora_fin">
                <FontAwesomeIcon icon={faClock} /> Hora Fin
                <span className="drp-calendar__time-hint">(Opcional)</span>
              </label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                className="drp-calendar__time-input"
                value={horaFin}
                onChange={onChange}
              />
            </div>
          </div>
          {selectionMode === "range" && mismoHorario && horaInicio && (
            <p className="drp-calendar__time-note">
              <FontAwesomeIcon icon={faInfoCircle} /> Este horario aplica para
              todos los días del evento
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
