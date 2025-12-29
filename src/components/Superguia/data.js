import {
  faFutbol,
  faHammer,
  faCalendarDays,
  faUtensils,
  faStethoscope,
  faHotel,
  faCar,
  faGears,
  faPaw,
  faScrewdriverWrench,
  faBullhorn,
  faEllipsis,
  faHouse,
  faGraduationCap,
  faStore,
  faPlane,
  faMoneyBillWave,
  faTruck,
  faChalkboardUser,
  faSpa,
  faBook,
  faLandmark,
  faMusic,
  faTheaterMasks,
  faTree,
  faBriefcase,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";

// Mapeo de nombres de icono (string de BD) a objetos FontAwesome
const ICON_MAP = {
  faFutbol,
  faHammer,
  faCalendarDays,
  faUtensils,
  faStethoscope,
  faHotel,
  faCar,
  faGears,
  faPaw,
  faScrewdriverWrench,
  faBullhorn,
  faEllipsis,
  faHouse,
  faGraduationCap,
  faStore,
  faPlane,
  faMoneyBillWave,
  faTruck,
  faChalkboardUser,
  faSpa,
  faBook,
  faLandmark,
  faMusic,
  faTheaterMasks,
  faTree,
  faBriefcase,
};

/**
 * Convierte el nombre del icono de la BD a objeto FontAwesome
 */
export const getIconFromString = (iconName) => {
  if (!iconName) return faQuestion;
  return ICON_MAP[iconName] || faQuestion;
};

/**
 * Mapea categorías de Supabase agregando el objeto icon de FontAwesome
 */
export const mapCategoriesToUI = (categories) => {
  return categories.map((cat) => ({
    ...cat,
    icon: getIconFromString(cat.icono),
  }));
};

// Estructura Ciudad → Comunas del Maule
export const LOCATIONS = {
  curico: {
    nombre: "Curicó",
    comunas: [
      "Curicó",
      "Teno",
      "Romeral",
      "Molina",
      "Sagrada Familia",
      "Hualañé",
      "Licantén",
      "Vichuquén",
      "Rauco",
    ],
  },
  talca: {
    nombre: "Talca",
    comunas: [
      "Talca",
      "Constitución",
      "Curepto",
      "Empedrado",
      "Maule",
      "Pelarco",
      "Pencahue",
      "Río Claro",
      "San Clemente",
      "San Rafael",
    ],
  },
  linares: {
    nombre: "Linares",
    comunas: [
      "Linares",
      "Colbún",
      "Longaví",
      "Parral",
      "Retiro",
      "San Javier",
      "Villa Alegre",
      "Yerbas Buenas",
    ],
  },
  cauquenes: {
    nombre: "Cauquenes",
    comunas: ["Cauquenes", "Chanco", "Pelluhue"],
  },
};
