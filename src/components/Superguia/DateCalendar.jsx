import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCalendarDay,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/DateCalendar.css";

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
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

/**
 * Calendario interactivo para seleccionar fechas
 */
export default function DateCalendar({
  selectedDate,
  onDateChange,
  eventsPerDay = {},
  minDate = null,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Generar días del mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDateKey(date);
      days.push({
        day,
        date,
        dateStr,
        hasEvents: eventsPerDay[dateStr] > 0,
        eventCount: eventsPerDay[dateStr] || 0,
        isToday: isSameDay(date, today),
        isPast: date < today,
        isSelected: selectedDate && isSameDay(date, selectedDate),
      });
    }

    return days;
  }, [currentMonth, currentYear, eventsPerDay, selectedDate, today]);

  // Navegar al mes anterior
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Seleccionar fecha
  const handleDateClick = (dayInfo) => {
    if (!dayInfo.date || dayInfo.isPast) return;
    onDateChange(dayInfo.isSelected ? null : dayInfo.date);
  };

  // Ir a hoy
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onDateChange(today);
  };

  return (
    <div className="date-calendar">
      {/* Header del calendario */}
      <div className="date-calendar__header">
        <button
          className="date-calendar__nav"
          onClick={goToPrevMonth}
          aria-label="Mes anterior">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <h3 className="date-calendar__title">
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <button
          className="date-calendar__nav"
          onClick={goToNextMonth}
          aria-label="Mes siguiente">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Botón de Hoy */}
      <button className="date-calendar__today" onClick={goToToday}>
        <FontAwesomeIcon icon={faCalendarDay} />
        Hoy
      </button>

      {/* Días de la semana */}
      <div className="date-calendar__weekdays">
        {DAYS_SHORT.map((day) => (
          <span key={day} className="date-calendar__weekday">
            {day}
          </span>
        ))}
      </div>

      {/* Grid de días */}
      <div className="date-calendar__grid">
        {calendarDays.map((dayInfo, index) => (
          <button
            key={index}
            className={`date-calendar__day ${
              !dayInfo.day ? "date-calendar__day--empty" : ""
            } ${dayInfo.isToday ? "date-calendar__day--today" : ""} ${
              dayInfo.isPast ? "date-calendar__day--past" : ""
            } ${dayInfo.isSelected ? "date-calendar__day--selected" : ""} ${
              dayInfo.hasEvents ? "date-calendar__day--has-events" : ""
            }`}
            onClick={() => handleDateClick(dayInfo)}
            disabled={!dayInfo.day || dayInfo.isPast}>
            {dayInfo.day && (
              <>
                <span className="date-calendar__day-number">{dayInfo.day}</span>
                {dayInfo.hasEvents && (
                  <span className="date-calendar__event-dot">
                    {dayInfo.eventCount > 9 ? "9+" : dayInfo.eventCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="date-calendar__legend">
        <span className="date-calendar__legend-item">
          <span className="date-calendar__legend-dot date-calendar__legend-dot--events"></span>
          Con eventos
        </span>
        <span className="date-calendar__legend-item">
          <span className="date-calendar__legend-dot date-calendar__legend-dot--today"></span>
          Hoy
        </span>
      </div>
    </div>
  );
}

// Utilidades
function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export { formatDateKey, isSameDay };
