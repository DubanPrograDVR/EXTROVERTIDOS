/**
 * Mapa de nombres de íconos FontAwesome (string) a objetos de ícono reales.
 * Los nombres se almacenan como strings en la BD (ej: "faCar"),
 * pero FontAwesomeIcon necesita el objeto importado.
 */
import {
  faCar,
  faHouse,
  faTruck,
  faHammer,
  faGears,
  faGraduationCap,
  faChalkboardUser,
  faCalendarDays,
  faPaw,
  faStore,
  faSpa,
  faUtensils,
  faScrewdriverWrench,
  faUmbrellaBeach,
  faBook,
  faStethoscope,
  faBullhorn,
  faMoneyBillWave,
  faLandmark,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

const ICON_MAP = {
  faCar,
  faHouse,
  faTruck,
  faHammer,
  faGears,
  faGraduationCap,
  faChalkboardUser,
  faCalendarDays,
  faPaw,
  faStore,
  faSpa,
  faUtensils,
  faScrewdriverWrench,
  faUmbrellaBeach,
  faBook,
  faStethoscope,
  faBullhorn,
  faMoneyBillWave,
  faLandmark,
};

/**
 * Resuelve un nombre de ícono (string) al objeto FontAwesome correspondiente.
 * @param {string|object} iconName - Nombre del ícono ("faCar") o ya un objeto FA
 * @returns {object|null} Objeto ícono FA o fallback
 */
export const resolveIcon = (iconName) => {
  if (!iconName) return null;
  // Si ya es un objeto FA (tiene prefix/iconName), devolverlo directo
  if (typeof iconName === "object" && iconName.iconName) return iconName;
  // Buscar en el mapa
  return ICON_MAP[iconName] || faLayerGroup;
};

export default ICON_MAP;
