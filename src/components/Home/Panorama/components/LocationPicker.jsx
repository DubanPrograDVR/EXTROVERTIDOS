import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faMapMarkerAlt,
  faSearch,
  faLocationCrosshairs,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/location-picker.css";

// Fix para el icono de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Icono personalizado naranja
const customIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff6600'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Centro por defecto: Talca, Chile
const DEFAULT_CENTER = [-35.4264, -71.6554];
const DEFAULT_ZOOM = 13;

// Componente para manejar clicks en el mapa
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Componente para centrar el mapa
const MapCenterControl = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

/**
 * Modal para seleccionar ubicación en el mapa
 */
const LocationPicker = ({ isOpen, onClose, currentLocation, onSave }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const searchInputRef = useRef(null);

  // Parsear ubicación actual si existe
  useEffect(() => {
    if (isOpen && currentLocation) {
      // Intentar extraer coordenadas del URL de Google Maps
      const coords = extractCoordsFromUrl(currentLocation);
      if (coords) {
        setSelectedLocation(coords);
        setMapCenter([coords.lat, coords.lng]);
      }
    } else if (isOpen) {
      setSelectedLocation(null);
    }
  }, [isOpen, currentLocation]);

  // Extraer coordenadas de URL de Google Maps
  const extractCoordsFromUrl = (url) => {
    if (!url) return null;
    // Formato: https://www.google.com/maps?q=-35.123,-71.456
    const match = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  // Generar URL de Google Maps
  const generateGoogleMapsUrl = (latlng) => {
    return `https://www.google.com/maps?q=${latlng.lat},${latlng.lng}`;
  };

  // Manejar selección de ubicación
  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng);
  };

  // Buscar ubicación por texto
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Usar Nominatim (OpenStreetMap) para geocodificación gratuita
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Chile"
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setSelectedLocation(newLocation);
        setMapCenter([newLocation.lat, newLocation.lng]);
      }
    } catch (error) {
      console.error("Error buscando ubicación:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Obtener ubicación actual del usuario
  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSelectedLocation(newLocation);
          setMapCenter([newLocation.lat, newLocation.lng]);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener tu ubicación. Verifica los permisos.");
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  // Guardar ubicación
  const handleSave = () => {
    if (selectedLocation) {
      const url = generateGoogleMapsUrl(selectedLocation);
      onSave(url);
    }
    onClose();
  };

  // Cancelar
  const handleCancel = () => {
    setSelectedLocation(null);
    setSearchQuery("");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-picker-overlay" onClick={handleOverlayClick}>
      <div className="location-picker">
        {/* Header */}
        <div className="location-picker__header">
          <h2 className="location-picker__title">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Seleccionar Ubicación
          </h2>
          <button
            type="button"
            className="location-picker__close"
            onClick={handleCancel}
            aria-label="Cerrar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="location-picker__search">
          <div className="location-picker__search-input-wrapper">
            <FontAwesomeIcon
              icon={faSearch}
              className="location-picker__search-icon"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar dirección, lugar..."
              className="location-picker__search-input"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="location-picker__search-btn">
              {isSearching ? "..." : "Buscar"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="location-picker__current-btn"
            title="Usar mi ubicación actual">
            <FontAwesomeIcon icon={faLocationCrosshairs} />
          </button>
        </div>

        {/* Map */}
        <div className="location-picker__map-container">
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            className="location-picker__map"
            scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapCenterControl center={mapCenter} />
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={customIcon}
              />
            )}
          </MapContainer>

          {/* Instrucciones */}
          <div className="location-picker__hint">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Haz clic en el mapa para marcar la ubicación
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="location-picker__selected">
            <div className="location-picker__coords">
              <span className="location-picker__coords-label">
                Coordenadas:
              </span>
              <span className="location-picker__coords-value">
                {selectedLocation.lat.toFixed(6)},{" "}
                {selectedLocation.lng.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="location-picker__footer">
          <button
            type="button"
            className="location-picker__btn location-picker__btn--cancel"
            onClick={handleCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="location-picker__btn location-picker__btn--save"
            onClick={handleSave}
            disabled={!selectedLocation}>
            <FontAwesomeIcon icon={faCheck} />
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
