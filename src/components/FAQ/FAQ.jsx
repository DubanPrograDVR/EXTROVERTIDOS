import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSearch } from "@fortawesome/free-solid-svg-icons";
import FAQItem from "./FAQItem";
import { FAQ_DATA, FAQ_CATEGORIAS } from "./faqData";
import "./styles/faq.css";

/**
 * Componente principal de Preguntas Frecuentes
 * Incluye filtrado por categoría y búsqueda
 */
const FAQ = () => {
  const [openItem, setOpenItem] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  // Filtrar preguntas según categoría y búsqueda
  const preguntasFiltradas = useMemo(() => {
    let resultado = FAQ_DATA;

    // Filtrar por categoría
    if (categoriaActiva !== "todas") {
      resultado = resultado.filter((faq) => faq.categoria === categoriaActiva);
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (faq) =>
          faq.pregunta.toLowerCase().includes(termino) ||
          faq.respuesta.toLowerCase().includes(termino)
      );
    }

    return resultado;
  }, [categoriaActiva, busqueda]);

  // Toggle de item abierto
  const handleToggle = (id) => {
    setOpenItem(openItem === id ? null : id);
  };

  // Cambiar categoría
  const handleCategoriaChange = (categoriaId) => {
    setCategoriaActiva(categoriaId);
    setOpenItem(null); // Cerrar item abierto al cambiar categoría
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        {/* Header */}
        <div className="faq-header">
          <div className="faq-header__icon">
            <FontAwesomeIcon icon={faQuestionCircle} />
          </div>
          <h2 className="faq-header__title">Preguntas Frecuentes</h2>
          <p className="faq-header__subtitle">
            Encuentra respuestas a las dudas más comunes sobre Extrovertidos
          </p>
        </div>

        {/* Buscador */}
        <div className="faq-search">
          <FontAwesomeIcon icon={faSearch} className="faq-search__icon" />
          <input
            type="text"
            placeholder="Buscar en preguntas frecuentes..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="faq-search__input"
          />
        </div>

        {/* Filtros por categoría */}
        <div className="faq-categories">
          {FAQ_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              className={`faq-category ${
                categoriaActiva === cat.id ? "faq-category--active" : ""
              }`}
              onClick={() => handleCategoriaChange(cat.id)}>
              <span className="faq-category__icon">{cat.icon}</span>
              <span className="faq-category__label">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Lista de preguntas */}
        <div className="faq-list">
          {preguntasFiltradas.length > 0 ? (
            preguntasFiltradas.map((faq, index) => (
              <FAQItem
                key={faq.id}
                pregunta={faq.pregunta}
                respuesta={faq.respuesta}
                isOpen={openItem === faq.id}
                onToggle={() => handleToggle(faq.id)}
                index={index}
              />
            ))
          ) : (
            <div className="faq-empty">
              <p>No se encontraron preguntas que coincidan con tu búsqueda.</p>
              <button
                className="faq-empty__btn"
                onClick={() => {
                  setBusqueda("");
                  setCategoriaActiva("todas");
                }}>
                Ver todas las preguntas
              </button>
            </div>
          )}
        </div>

        {/* Contacto adicional */}
        <div className="faq-contact">
          <p>¿No encontraste lo que buscabas?</p>
          <a
            href="https://instagram.com/extrovertidos"
            target="_blank"
            rel="noopener noreferrer"
            className="faq-contact__link">
            Contáctanos por Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
