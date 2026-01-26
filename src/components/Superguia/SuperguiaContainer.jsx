import "./styles/SuperguiaContainer.css";
import Footer from "../Home/Footer";

/**
 * SuperguiaContainer - Página para negocios de usuarios
 * TODO: Implementar listado de negocios
 */
export default function SuperguiaContainer() {
  return (
    <>
      <section className="superguia">
        {/* Hero Banner */}
        <div className="superguia__hero">
          <img
            src="/img/banner.png"
            alt="Superguía Extrovertidos"
            className="superguia__hero-img"
          />
          <div className="superguia__hero-overlay"></div>
          <div className="superguia__hero-content">
            <img
              src="/img/Logo_extrovertidos.png"
              alt="Extrovertidos"
              className="superguia__hero-logo"
            />
            <h1 className="superguia__hero-title">SUPERGUÍA EXTROVERTIDOS</h1>
            <p className="superguia__hero-subtitle">
              Próximamente: Descubre los mejores negocios y servicios de la
              región
            </p>
          </div>
        </div>

        {/* Contenido - Coming Soon */}
        <div className="superguia__container">
          <div className="superguia__empty">
            <div className="superguia__empty-icon">🏪</div>
            <h3>Próximamente</h3>
            <p>
              Aquí podrás publicar y descubrir negocios, tiendas, restaurantes y
              servicios de la región del Maule.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
