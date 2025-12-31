import { createContext, useContext, useState, useEffect } from "react";

// Lista de ciudades/comunas del Maule
export const CITIES = [
  { id: "talca", nombre: "Talca", provincia: "Talca" },
  { id: "curico", nombre: "Curicó", provincia: "Curicó" },
  { id: "linares", nombre: "Linares", provincia: "Linares" },
  { id: "cauquenes", nombre: "Cauquenes", provincia: "Cauquenes" },
  { id: "constitucion", nombre: "Constitución", provincia: "Talca" },
  { id: "molina", nombre: "Molina", provincia: "Curicó" },
  { id: "parral", nombre: "Parral", provincia: "Linares" },
  { id: "san-clemente", nombre: "San Clemente", provincia: "Talca" },
  { id: "maule", nombre: "Maule", provincia: "Talca" },
  { id: "pelarco", nombre: "Pelarco", provincia: "Talca" },
];

const CityContext = createContext(null);

export const useCity = () => {
  const context = useContext(CityContext);
  if (context === null) {
    throw new Error("useCity debe ser usado dentro de un CityProvider");
  }
  return context;
};

export const CityProvider = ({ children }) => {
  // Intentar recuperar la ciudad desde localStorage
  const getInitialCity = () => {
    try {
      const saved = localStorage.getItem("selectedCity");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que la ciudad guardada existe en CITIES
        const exists = CITIES.find((c) => c.id === parsed?.id);
        if (exists) return exists;
      }
    } catch (e) {
      console.warn("Error al recuperar ciudad de localStorage:", e);
    }
    return CITIES[0]; // Talca por defecto
  };

  const getInitialIndex = () => {
    const city = getInitialCity();
    const idx = CITIES.findIndex((c) => c.id === city.id);
    return idx >= 0 ? idx : 0;
  };

  const [selectedCity, setSelectedCity] = useState(() => getInitialCity());
  const [currentIndex, setCurrentIndex] = useState(() => getInitialIndex());

  // Persistir en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("selectedCity", JSON.stringify(selectedCity));
    } catch (e) {
      console.warn("Error al guardar ciudad en localStorage:", e);
    }
  }, [selectedCity]);

  // Navegar a la ciudad anterior
  const prevCity = () => {
    const newIndex = currentIndex === 0 ? CITIES.length - 1 : currentIndex - 1;
    console.log("prevCity:", CITIES[newIndex]?.nombre);
    setCurrentIndex(newIndex);
    setSelectedCity(CITIES[newIndex]);
  };

  // Navegar a la ciudad siguiente
  const nextCity = () => {
    const newIndex = currentIndex === CITIES.length - 1 ? 0 : currentIndex + 1;
    console.log("nextCity:", CITIES[newIndex]?.nombre);
    setCurrentIndex(newIndex);
    setSelectedCity(CITIES[newIndex]);
  };

  // Seleccionar una ciudad específica por ID o nombre
  const selectCity = (cityIdOrName) => {
    const index = CITIES.findIndex(
      (c) =>
        c.id === cityIdOrName ||
        c.nombre.toLowerCase() === cityIdOrName.toLowerCase()
    );
    if (index !== -1) {
      setCurrentIndex(index);
      setSelectedCity(CITIES[index]);
    }
  };

  // Obtener el nombre de la ciudad actual
  const cityName = selectedCity?.nombre || "Talca";

  const value = {
    // Estado
    selectedCity,
    cityName,
    currentIndex,
    cities: CITIES,

    // Acciones
    prevCity,
    nextCity,
    selectCity,
    setSelectedCity,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export default CityContext;
