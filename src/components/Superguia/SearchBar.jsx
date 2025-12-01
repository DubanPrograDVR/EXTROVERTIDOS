import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import "./styles/SearchBar.css";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <FontAwesomeIcon icon={faMagnifyingGlass} className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder="Buscar por nombre o ciudad..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="search-bar__clear"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  );
}
