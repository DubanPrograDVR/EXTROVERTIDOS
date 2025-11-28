import "./styles/panoramas.css";
import pExtroIcon from "../../../public/img/P_Extro.png";
// Asegúrate de guardar la imagen de las personas saltando como Panoramas_people.png
import peopleImg from "../../../public/img/Home1.png";

export default function Panoramas() {
  return (
    <div className="panoramas-wrapper">
      {/* Texto destacado superior */}
      <div className="panoramas__header">
        <h2 className="panoramas__header-text">
          ¡LO MEJOR ESTÁ EN{" "}
          <span className="panoramas__highlight">EXTROVERTIDOS!</span>
        </h2>
      </div>

      <section className="panoramas">
        {/* Lado izquierdo - Imagen de personas */}
        <div className="panoramas__image-side">
          <img
            src={peopleImg}
            alt="Personas saltando felices"
            className="panoramas__people-img"
          />
        </div>

        {/* Lado derecho - Contenido */}
        <div className="panoramas__content-side">
          <div className="panoramas__content">
            {/* Logo P Extro */}
            <div className="panoramas__logo-wrapper">
              <img
                src={pExtroIcon}
                alt="Logo Panoramas"
                className="panoramas__logo"
              />
            </div>

            {/* Título */}
            <h2 className="panoramas__title">PANORAMAS</h2>

            {/* Subtítulo */}
            <p className="panoramas__subtitle">
              ¡ELIGE TU CIUDAD Y ENTÉRATE DE LO QUE MÁS TE GUSTA!
            </p>

            {/* Botón de acción */}
            <button className="panoramas__btn">Explorar Panoramas</button>
          </div>
        </div>
      </section>

      {/* Línea divisoria naranja */}
      <div className="panoramas__divider"></div>
    </div>
  );
}
