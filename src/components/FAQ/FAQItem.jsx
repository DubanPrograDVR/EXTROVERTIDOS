import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente de item individual de FAQ con efecto acordeón
 */
const FAQItem = ({ pregunta, respuesta, isOpen, onToggle, index }) => {
  return (
    <div className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
      <button
        className="faq-item__question"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}>
        <span className="faq-item__question-text">{pregunta}</span>
        <span
          className={`faq-item__icon ${isOpen ? "faq-item__icon--open" : ""}`}>
          <FontAwesomeIcon icon={faChevronDown} />
        </span>
      </button>

      <div
        id={`faq-answer-${index}`}
        className={`faq-item__answer ${isOpen ? "faq-item__answer--open" : ""}`}
        role="region"
        aria-hidden={!isOpen}>
        <div className="faq-item__answer-content">
          <p>{respuesta}</p>
        </div>
      </div>
    </div>
  );
};

export default FAQItem;
