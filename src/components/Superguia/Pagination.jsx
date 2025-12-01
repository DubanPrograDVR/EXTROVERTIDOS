import "./styles/Pagination.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Generar array de páginas a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        end = 4;
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Agregar puntos suspensivos si es necesario
      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Siempre mostrar última página
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className="pagination" aria-label="Paginación">
      {/* Botón anterior */}
      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      {/* Números de página */}
      <div className="pagination__numbers">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination__ellipsis">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`pagination__btn ${
                currentPage === page ? "active" : ""
              }`}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}>
              {page}
            </button>
          )
        )}
      </div>

      {/* Botón siguiente */}
      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </nav>
  );
}
