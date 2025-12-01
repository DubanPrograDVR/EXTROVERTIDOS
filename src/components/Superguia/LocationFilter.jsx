import { useState, useRef, useEffect } from "react";
import "./styles/LocationFilter.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

export default function LocationFilter({
  locations,
  selectedCity,
  selectedComuna,
  availableComunas,
  onCityChange,
  onComunaChange,
}) {
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isComunaOpen, setIsComunaOpen] = useState(false);
  const cityRef = useRef(null);
  const comunaRef = useRef(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setIsCityOpen(false);
      }
      if (comunaRef.current && !comunaRef.current.contains(event.target)) {
        setIsComunaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (cityKey) => {
    onCityChange(cityKey);
    setIsCityOpen(false);
  };

  const handleComunaSelect = (comuna) => {
    onComunaChange(comuna);
    setIsComunaOpen(false);
  };

  const getCityName = () => {
    if (!selectedCity) return "Ciudad +";
    return locations[selectedCity]?.nombre || "Ciudad +";
  };

  return (
    <div className="location-filter">
      {/* Selector de Ciudad */}
      <div className="location-filter__dropdown" ref={cityRef}>
        <button
          className={`location-filter__btn ${selectedCity ? "active" : ""}`}
          onClick={() => setIsCityOpen(!isCityOpen)}>
          {getCityName()}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`location-filter__arrow ${isCityOpen ? "open" : ""}`}
          />
        </button>

        {isCityOpen && (
          <div className="location-filter__menu">
            {Object.entries(locations).map(([key, city]) => (
              <button
                key={key}
                className={`location-filter__option ${
                  selectedCity === key ? "selected" : ""
                }`}
                onClick={() => handleCitySelect(key)}>
                <img
                  src="/img/P_Extro.png"
                  alt=""
                  className="location-filter__icon"
                />
                {city.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selector de Comuna - Solo visible si hay ciudad seleccionada */}
      <div
        className={`location-filter__dropdown ${
          !selectedCity ? "disabled" : ""
        }`}
        ref={comunaRef}>
        <button
          className={`location-filter__btn ${selectedComuna ? "active" : ""}`}
          onClick={() => selectedCity && setIsComunaOpen(!isComunaOpen)}
          disabled={!selectedCity}>
          {selectedComuna || "Comuna +"}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`location-filter__arrow ${isComunaOpen ? "open" : ""}`}
          />
        </button>

        {isComunaOpen && availableComunas.length > 0 && (
          <div className="location-filter__menu">
            {availableComunas.map((comuna) => (
              <button
                key={comuna}
                className={`location-filter__option ${
                  selectedComuna === comuna ? "selected" : ""
                }`}
                onClick={() => handleComunaSelect(comuna)}>
                {comuna}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
