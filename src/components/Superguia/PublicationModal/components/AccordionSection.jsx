import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export default function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  bodyClassName,
  children,
}) {
  const sectionId = `accordion-content-${title.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <div
      className={`accordion-section ${isOpen ? "accordion-section--open" : ""}`}>
      <button
        className={`accordion-section__header ${isOpen ? "open" : ""}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={sectionId}>
        <span className="accordion-section__title">
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className="accordion-section__title-icon"
            />
          )}
          {title}
        </span>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="accordion-section__icon"
        />
      </button>
      <div
        className={`accordion-section__content ${isOpen ? "open" : ""}`}
        id={sectionId}
        role="region"
        aria-hidden={!isOpen}>
        <div
          className={`accordion-section__body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
