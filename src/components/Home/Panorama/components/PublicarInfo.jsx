import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente que muestra los pasos de cómo funciona la publicación
 */
const PublicarInfo = () => {
  const steps = [
    "Completa el formulario con los detalles de tu evento",
    "Sube imágenes atractivas que representen tu evento",
    "Nuestro equipo revisará tu publicación",
    "¡Tu evento estará visible para toda la comunidad!",
  ];

  return (
    <section className="publicar-info">
      <div className="publicar-info__container">
        <h2 className="publicar-info__title">
          <FontAwesomeIcon icon={faInfoCircle} />
          ¿Cómo funciona?
        </h2>
        <div className="publicar-info__steps">
          {steps.map((step, index) => (
            <div key={index} className="publicar-info__step">
              <span className="publicar-info__step-number">{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicarInfo;
