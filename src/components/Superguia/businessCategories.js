/**
 * Categorías específicas para la Superguía de Negocios
 * Estas categorías son diferentes a las de Panoramas (eventos)
 */

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
  faMoneyBillWave,
  faTruck,
  faChalkboardUser,
  faSpa,
  faBook,
  faLandmark,
  faTree,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Categorías de negocios para la Superguía
 * Basadas en el diseño de Canva proporcionado
 */
export const BUSINESS_CATEGORIES = [
  {
    id: 1,
    nombre: "Deportes",
    icono: faFutbol,
    color: "#4CAF50",
    orden: 1,
  },
  {
    id: 2,
    nombre: "Construcción",
    icono: faHammer,
    color: "#795548",
    orden: 2,
  },
  {
    id: 3,
    nombre: "Eventos",
    icono: faCalendarDays,
    color: "#9C27B0",
    orden: 3,
  },
  {
    id: 4,
    nombre: "Comida",
    icono: faUtensils,
    color: "#FF5722",
    orden: 4,
  },
  {
    id: 5,
    nombre: "Salud",
    icono: faStethoscope,
    color: "#E91E63",
    orden: 5,
  },
  {
    id: 6,
    nombre: "Hospedaje",
    icono: faHotel,
    color: "#3F51B5",
    orden: 6,
  },
  {
    id: 7,
    nombre: "Automóvil",
    icono: faCar,
    color: "#607D8B",
    orden: 7,
  },
  {
    id: 8,
    nombre: "Maquinaria",
    icono: faGears,
    color: "#9E9E9E",
    orden: 8,
  },
  {
    id: 9,
    nombre: "Mascotas",
    icono: faPaw,
    color: "#8BC34A",
    orden: 9,
  },
  {
    id: 10,
    nombre: "Servicio Técnico",
    icono: faScrewdriverWrench,
    color: "#FF9800",
    orden: 10,
  },
  {
    id: 11,
    nombre: "Publicidad",
    icono: faBullhorn,
    color: "#F44336",
    orden: 11,
  },
  {
    id: 12,
    nombre: "Otros",
    icono: faEllipsis,
    color: "#9E9E9E",
    orden: 12,
  },
  {
    id: 13,
    nombre: "Servicios al Hogar",
    icono: faHouse,
    color: "#00BCD4",
    orden: 13,
  },
  {
    id: 14,
    nombre: "Academias",
    icono: faGraduationCap,
    color: "#673AB7",
    orden: 14,
  },
  {
    id: 15,
    nombre: "Comercial",
    icono: faStore,
    color: "#2196F3",
    orden: 15,
  },
  {
    id: 16,
    nombre: "Naturaleza",
    icono: faTree,
    color: "#4CAF50",
    orden: 16,
  },
  {
    id: 17,
    nombre: "Servicios Financieros",
    icono: faMoneyBillWave,
    color: "#009688",
    orden: 17,
  },
  {
    id: 18,
    nombre: "Transporte",
    icono: faTruck,
    color: "#795548",
    orden: 18,
  },
  {
    id: 19,
    nombre: "Capacitaciones",
    icono: faChalkboardUser,
    color: "#FF5722",
    orden: 19,
  },
  {
    id: 20,
    nombre: "Belleza",
    icono: faSpa,
    color: "#E91E63",
    orden: 20,
  },
  {
    id: 21,
    nombre: "Educación",
    icono: faBook,
    color: "#3F51B5",
    orden: 21,
  },
  {
    id: 22,
    nombre: "Servicios Municipales",
    icono: faLandmark,
    color: "#607D8B",
    orden: 22,
  },
];

/**
 * Obtiene una categoría por ID
 */
export const getBusinessCategoryById = (id) => {
  return BUSINESS_CATEGORIES.find((cat) => cat.id === id);
};

/**
 * Obtiene una categoría por nombre
 */
export const getBusinessCategoryByName = (nombre) => {
  return BUSINESS_CATEGORIES.find(
    (cat) => cat.nombre.toLowerCase() === nombre.toLowerCase(),
  );
};

export default BUSINESS_CATEGORIES;
