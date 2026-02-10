import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCheck,
  faTimes,
  faUsers,
  faExclamationTriangle,
  faChevronRight,
  faCreditCard,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Colores para los gráficos
const COLORS = {
  primary: "#ff6600",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

/**
 * Dashboard con estadísticas generales y gráficos
 */
export default function AdminDashboard({
  stats,
  chartData,
  onViewPending,
  planesEnabled,
  planesToggleLoading,
  onTogglePlanes,
  isAdmin,
}) {
  if (!stats) return null;

  // Datos para el gráfico de torta (publicaciones por estado)
  const pieData = [
    {
      name: "Pendientes",
      value: stats.eventos.pendientes,
      color: COLORS.warning,
    },
    {
      name: "Publicados",
      value: stats.eventos.publicados,
      color: COLORS.success,
    },
    {
      name: "Rechazados",
      value: stats.eventos.rechazados,
      color: COLORS.danger,
    },
  ];

  return (
    <div className="admin-dashboard">
      <h2>Resumen General</h2>

      {/* Tarjetas de estadísticas */}
      <div className="admin-stats">
        <StatCard
          icon={faClock}
          number={stats.eventos.pendientes}
          label="Eventos Pendientes"
          variant="warning"
        />
        <StatCard
          icon={faCheck}
          number={stats.eventos.publicados}
          label="Eventos Publicados"
          variant="success"
        />
        <StatCard
          icon={faTimes}
          number={stats.eventos.rechazados}
          label="Eventos Rechazados"
          variant="danger"
        />
        <StatCard
          icon={faUsers}
          number={stats.usuarios.total}
          label="Usuarios Registrados"
          variant="info"
        />
      </div>

      {/* Gráficos */}
      <div className="admin-charts">
        {/* Gráfico de Torta - Estados de publicaciones */}
        <div className="admin-chart-card">
          <h3>Estado de Publicaciones</h3>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#fff", fontSize: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "#ccc" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras - Publicaciones por día */}
        <div className="admin-chart-card">
          <h3>Publicaciones (últimos 7 días)</h3>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData?.eventsPerDay || []}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#ff6600" }}
                />
                <Bar
                  dataKey="publicaciones"
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  name="Publicaciones"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras - Usuarios registrados por día */}
        <div className="admin-chart-card">
          <h3>Nuevos Usuarios (últimos 7 días)</h3>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData?.usersPerDay || []}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#3b82f6" }}
                />
                <Bar
                  dataKey="usuarios"
                  fill={COLORS.info}
                  radius={[4, 4, 0, 0]}
                  name="Usuarios"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      {stats.eventos.pendientes > 0 && (
        <div className="admin-quick-actions">
          <h3>Acciones Rápidas</h3>
          <button className="admin-quick-action" onClick={onViewPending}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>
              Tienes {stats.eventos.pendientes} publicaciones esperando
              aprobación
            </span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      {/* Configuraciones del sitio (solo admin) */}
      {isAdmin && (
        <div className="admin-site-settings">
          <h3>Configuraciones del Sitio</h3>
          <div className="admin-setting-row">
            <div className="admin-setting-row__info">
              <FontAwesomeIcon
                icon={faCreditCard}
                className="admin-setting-row__icon"
              />
              <div>
                <span className="admin-setting-row__label">Activar Plan</span>
                <span className="admin-setting-row__description">
                  Muestra u oculta la sección de planes para los usuarios
                </span>
              </div>
            </div>
            <button
              className={`admin-toggle ${planesEnabled ? "admin-toggle--active" : ""}`}
              onClick={onTogglePlanes}
              disabled={planesToggleLoading}
              title={
                planesEnabled
                  ? "Desactivar planes para usuarios"
                  : "Activar planes para usuarios"
              }>
              {planesToggleLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <span className="admin-toggle__knob" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de tarjeta de estadística individual
 */
function StatCard({ icon, number, label, variant }) {
  return (
    <div className={`admin-stat-card admin-stat-card--${variant}`}>
      <div className="admin-stat-card__icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="admin-stat-card__info">
        <span className="admin-stat-card__number">{number}</span>
        <span className="admin-stat-card__label">{label}</span>
      </div>
    </div>
  );
}
