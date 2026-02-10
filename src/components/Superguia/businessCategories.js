/**
 * Categorías y subcategorías para negocios
 * Cargadas desde archivo local para no depender de la base de datos
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
} from "@fortawesome/free-solid-svg-icons";

/**
 * Categorías de negocios con sus subcategorías
 */
export const BUSINESS_CATEGORIES = [
  {
    id: 1,
    nombre: "Automóvil",
    icono: faCar,
    color: "#607D8B",
    orden: 1,
    subcategorias: [
      "Mecánica",
      "Mantenciones",
      "Electromecánica",
      "Desabolladura",
      "Venta de Repuestos",
      "Asistencia en Ruta",
      "Vulcanización",
      "Renta Cars",
      "Venta de Accesorios",
      "Automotoras",
      "Concesionarios",
      "Lavado de Autos",
      "Inst. de Accesorios",
      "Otros",
    ],
  },
  {
    id: 2,
    nombre: "Servicios al Hogar",
    icono: faHouse,
    color: "#00BCD4",
    orden: 2,
    subcategorias: [
      "Niñeras",
      "Cuidadores",
      "Mascotas",
      "Limpieza",
      "Fumigación",
      "Mudanzas",
      "Construcción",
      "Reparaciones",
      "Electricidad",
      "Jardín",
      "Pintura",
      "Aire Acondicionado",
      "Fletes",
      "Gasfitería",
      "Inst. Especiales",
      "Otros",
    ],
  },
  {
    id: 3,
    nombre: "Transporte",
    icono: faTruck,
    color: "#795548",
    orden: 3,
    subcategorias: [
      "Uber",
      "Taxi",
      "T. Carga Pesada",
      "T. Carga Especial",
      "Mudanzas",
      "Viajes Particulares",
      "Fletes",
      "Grúas",
      "Escolares",
      "Otros",
    ],
  },
  {
    id: 4,
    nombre: "Construcción",
    icono: faHammer,
    color: "#795548",
    orden: 4,
    subcategorias: [
      "Serv. de Construcción",
      "Venta de Materiales",
      "Maestranza",
      "Limpieza",
      "Arriendos de Equipos",
      "Servicios Generales",
      "Serv. Personales",
      "Asesorías y Más",
      "Otros",
    ],
  },
  {
    id: 5,
    nombre: "Maquinaria",
    icono: faGears,
    color: "#9E9E9E",
    orden: 5,
    subcategorias: [
      "Arriendos",
      "Mantención",
      "Venta de Insumos",
      "Venta Repuestos",
      "Servicios",
      "Otros",
    ],
  },
  {
    id: 6,
    nombre: "Academias",
    icono: faGraduationCap,
    color: "#673AB7",
    orden: 6,
    subcategorias: [
      "Baile",
      "Danza",
      "Artes Marciales",
      "Música",
      "Deportivas",
      "Otros",
    ],
  },
  {
    id: 7,
    nombre: "Capacitaciones",
    icono: faChalkboardUser,
    color: "#FF5722",
    orden: 7,
    subcategorias: [
      "Cursos",
      "Clases Particulares",
      "Talleres Grupales",
      "Municipales",
      "Otros",
    ],
  },
  {
    id: 8,
    nombre: "Eventos",
    icono: faCalendarDays,
    color: "#9C27B0",
    orden: 8,
    subcategorias: [
      "Sonido",
      "Centro de Eventos",
      "Animaciones",
      "Arriendos Generales",
      "Servicios Especiales",
      "Filmaciones",
      "Publicidad",
      "Fotografía",
      "Música",
      "Transporte",
      "Otros",
    ],
  },
  {
    id: 9,
    nombre: "Mascotas",
    icono: faPaw,
    color: "#8BC34A",
    orden: 9,
    subcategorias: [
      "Veterinaria",
      "Venta de Alimentos",
      "Servicios Especiales",
      "Paseadores",
      "Guarderías",
      "Transporte",
      "Otros",
    ],
  },
  {
    id: 10,
    nombre: "Comercial",
    icono: faStore,
    color: "#2196F3",
    orden: 10,
    subcategorias: [
      "Alimentos",
      "Medicamentos",
      "Prod. Hogar",
      "Más Productos",
      "Ropa",
      "Bencineras",
      "Otros",
    ],
  },
  {
    id: 11,
    nombre: "Belleza",
    icono: faSpa,
    color: "#E91E63",
    orden: 11,
    subcategorias: [
      "Peluquerías",
      "Salón de Belleza",
      "Manicure",
      "Serv. Especiales",
      "Estilistas",
      "Maquillaje",
      "Otros",
    ],
  },
  {
    id: 12,
    nombre: "Comida",
    icono: faUtensils,
    color: "#FF5722",
    orden: 12,
    subcategorias: [
      "Restaurantes",
      "Pastelerías",
      "Heladerías",
      "Comida Rápida",
      "Serv. Eventos",
      "Serv. Particulares",
      "Comida Especial",
      "Sushi",
      "Colaciones",
      "Food Trucks",
      "Cafeterías",
      "Delivery",
      "Otros",
    ],
  },
  {
    id: 13,
    nombre: "Servicios Técnicos",
    icono: faScrewdriverWrench,
    color: "#FF9800",
    orden: 13,
    subcategorias: ["Celulares", "Electrodomésticos", "Otros"],
  },
  {
    id: 14,
    nombre: "Turismo",
    icono: faUmbrellaBeach,
    color: "#00BCD4",
    orden: 14,
    subcategorias: [
      "Campings",
      "Cabañas",
      "Tours",
      "Complejos Turísticos",
      "Trekking",
      "Viajes Especiales",
      "Otros",
    ],
  },
  {
    id: 15,
    nombre: "Educación",
    icono: faBook,
    color: "#3F51B5",
    orden: 15,
    subcategorias: [
      "Colegios",
      "Jardines",
      "Profesor Particular",
      "Liceos",
      "Institutos",
      "Entidades",
      "Universidades",
      "Nivelaciones",
      "Otros",
    ],
  },
  {
    id: 16,
    nombre: "Medicina",
    icono: faStethoscope,
    color: "#E91E63",
    orden: 16,
    subcategorias: [
      "Consultas Médicas",
      "24/7",
      "Clínicas",
      "Laboratorios",
      "Centros Especialistas",
      "A Domicilio",
      "Farmacias",
      "Med. Especialistas",
      "Otros",
    ],
  },
  {
    id: 17,
    nombre: "Publicidad",
    icono: faBullhorn,
    color: "#F44336",
    orden: 17,
    subcategorias: [
      "Servicios",
      "Asesorías",
      "Arriendos",
      "Servicios de Difusión",
      "Otros",
    ],
  },
  {
    id: 18,
    nombre: "Servicios Financieros",
    icono: faMoneyBillWave,
    color: "#009688",
    orden: 18,
    subcategorias: [
      "Contabilidad",
      "Asesorías",
      "Bancos",
      "Cooperativas",
      "Seguros",
      "Financieras",
      "Mutuarias",
      "Otros",
    ],
  },
  {
    id: 19,
    nombre: "Servicios Municipales",
    icono: faLandmark,
    color: "#607D8B",
    orden: 19,
    subcategorias: ["Generales", "Otros"],
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

/**
 * Obtiene las subcategorías de una categoría por su ID
 */
export const getSubcategoriesByCategoryId = (categoryId) => {
  const category = BUSINESS_CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.subcategorias || [];
};

/**
 * Obtiene las subcategorías de una categoría por su nombre
 */
export const getSubcategoriesByCategoryName = (categoryName) => {
  const category = BUSINESS_CATEGORIES.find(
    (cat) => cat.nombre.toLowerCase() === categoryName.toLowerCase(),
  );
  return category?.subcategorias || [];
};

export default BUSINESS_CATEGORIES;
