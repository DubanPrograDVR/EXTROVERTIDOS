import "./styles/home-accesos.css";

const desplazarASeccion = (id) => {
  const destino = document.getElementById(id);
  if (!destino) return;

  if (!destino.hasAttribute("tabindex")) {
    destino.setAttribute("tabindex", "-1");
  }

  const movimientoReducido = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  destino.scrollIntoView({
    behavior: movimientoReducido ? "auto" : "smooth",
    block: "start",
  });
  destino.focus({ preventScroll: true });
};

export default function HomeAccesos({
  onPanoramas,
  onSuperbuscador,
  seccionActiva = "panoramas",
}) {
  return (
    <section className="home-accesos" aria-label="Secciones principales">
      <div className="home-accesos__grid">
        <button
          type="button"
          className={`home-accesos__card home-accesos__card--panoramas ${
            seccionActiva === "panoramas" ? "is-active" : ""
          }`}
          aria-controls="panoramas"
          aria-pressed={seccionActiva === "panoramas"}
          onClick={() => {
            onPanoramas?.();
            window.requestAnimationFrame(() => desplazarASeccion("panoramas"));
          }}>
          <img
            className="home-accesos__logo"
            src="/img/P_Extro_v2.png"
            alt=""
            aria-hidden="true"
          />
          <span className="home-accesos__title">Panoramas</span>
        </button>

        <button
          type="button"
          className={`home-accesos__card home-accesos__card--superbuscador ${
            seccionActiva === "superbuscador" ? "is-active" : ""
          }`}
          aria-controls="superguia"
          aria-pressed={seccionActiva === "superbuscador"}
          onClick={() => {
            onSuperbuscador?.();
            window.requestAnimationFrame(() => desplazarASeccion("superguia"));
          }}>
          <img
            className="home-accesos__logo"
            src="/img/SG_Extro_v2.png"
            alt=""
            aria-hidden="true"
          />
          <span className="home-accesos__title">Superbuscador</span>
        </button>
      </div>
    </section>
  );
}
