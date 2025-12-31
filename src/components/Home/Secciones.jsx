import { useEffect, useRef } from "react";
import "./styles/secciones.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkedAlt, faCompass } from "@fortawesome/free-solid-svg-icons";

// Imágenes servidas desde public/
const panoramasImg = "/img/Home1.png";
const superguiaImg = "/img/Home2.png";
const pExtroIcon = "/img/SG_Extro.png";

// ===== DATOS DE LAS SECCIONES =====
const sectionsData = [
  //   {
  //     id: 1,
  //     icon: faMapMarkedAlt,
  //     title: "PANORAMAS",
  //     subtitle: "¡ELIGE TU CIUDAD Y ENTÉRATE DE LO QUE MÁS TE GUSTA!",
  //     description:
  //       "Descubre eventos, actividades y panoramas increíbles en tu ciudad. Desde conciertos hasta exposiciones, todo lo que necesitas para disfrutar al máximo está aquí.",
  //     highlight: true,
  //     alignment: "left",
  //     image: panoramasImg,
  //     imageAlt: "Personas saltando felices",
  //   },
  {
    id: 2,
    icon: null,
    customIcon: pExtroIcon,
    title: "SUPERGUÍA EXTROVERTIDOS",
    subtitle: "¿UN UBER, UN VETERINARIO O UN MECÁNICO?",
    description:
      "LA SUPERGUÍA DE NEGOCIOS Y SERVICIOS DE TU CIUDAD. Encuentra rápidamente lo que necesitas: desde servicios de emergencia hasta los mejores restaurantes y tiendas locales.",
    highlight: false,
    alignment: "left",
    image: superguiaImg,
    imageAlt: "Mujer señalando con lentes de sol",
  },
];

// ===== COMPONENTE PRINCIPAL =====
export default function Secciones({ customSections }) {
  const data = customSections || sectionsData;
  const sectionRefs = useRef([]);

  // ===== INTERSECTION OBSERVER PARA ANIMACIONES =====
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("secciones__item--visible");
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className="secciones"
        role="region"
        aria-label="Secciones principales">
        {data.map((section, index) => (
          <section
            key={section.id}
            ref={(el) => (sectionRefs.current[index] = el)}
            className={`secciones__item secciones__item--${section.alignment} ${
              section.highlight ? "secciones__item--highlight" : ""
            }`}
            aria-labelledby={`section-title-${section.id}`}>
            {/* Decoración de fondo */}
            <div className="secciones__bg-decoration"></div>

            {/* Imagen decorativa */}
            {section.image && (
              <div className="secciones__image-wrapper">
                <img
                  src={section.image}
                  alt={section.imageAlt}
                  className="secciones__image"
                />
              </div>
            )}

            {/* Contenedor de contenido */}
            <div className="secciones__content">
              {/* Icono */}
              <div
                className={`secciones__icon-wrapper ${
                  section.customIcon ? "secciones__icon-wrapper--custom" : ""
                }`}>
                {section.customIcon ? (
                  <img
                    src={section.customIcon}
                    alt="Icono Extrovertidos"
                    className="secciones__custom-icon"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={section.icon}
                    className="secciones__icon"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Textos */}
              <div className="secciones__text">
                <h2
                  id={`section-title-${section.id}`}
                  className="secciones__title">
                  {section.title}
                </h2>

                <h3 className="secciones__subtitle">{section.subtitle}</h3>

                {section.description && (
                  <p className="secciones__description">
                    {section.description}
                  </p>
                )}
              </div>
            </div>

            {/* Línea decorativa */}
            <div className="secciones__divider"></div>
          </section>
        ))}
      </div>
    </>
  );
}
