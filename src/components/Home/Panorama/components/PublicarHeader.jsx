/**
 * Componente de encabezado para la página de publicación
 */
const PublicarHeader = () => {
  return (
    <header className="publicar-header">
      <img
        src="/img/Logo_extrovertidos.png"
        alt="Extrovertidos"
        className="publicar-header__logo"
      />
      <h1 className="publicar-header__title">Publica tu Panorama</h1>
      <p className="publicar-header__subtitle">
        Comparte con la comunidad de Extrovertidos y llega a miles de personas
      </p>
    </header>
  );
};

export default PublicarHeader;
