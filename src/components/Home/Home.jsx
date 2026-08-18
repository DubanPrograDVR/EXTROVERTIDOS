import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthModal from "../Auth/AuthModal";
import BusinessModal from "../Superguia/BusinessModal";
import PublicationModal from "../Superguia/PublicationModal";
import { getEventById } from "../../lib/database";
import { useAuth } from "../../context/AuthContext";
import { usePlansVisibility } from "../../hooks/usePlansVisibility";
import useHomeContent from "../../hooks/useHomeContent";
import { LOCATIONS } from "../Superguia/data";
import Footer from "./Footer";
import HomeAccesos from "./HomeAccesos";
import HomeHero from "./HomeHero";
import HomePanoramas from "./HomePanoramas";
import HomeSuperguia from "./HomeSuperguia";
import "./styles/home-consolidado.css";

export default function Home() {
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { destacadasEnabled, negociosDestacadasEnabled } =
    usePlansVisibility();
  const {
    eventos,
    negocios,
    categoriasPanoramas,
    categoriasNegocios,
    cargando,
    error,
    recargar,
    semillaOrden,
  } = useHomeContent();
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modalPanoramaAbierto, setModalPanoramaAbierto] = useState(false);
  const [modalNegocioAbierto, setModalNegocioAbierto] = useState(false);
  const [panoramaSeleccionado, setPanoramaSeleccionado] = useState(null);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState("panoramas");

  const eventosParaVista = destacadasEnabled
    ? eventos
    : eventos.map((evento) =>
        evento.tipo_publicacion === "destacada"
          ? { ...evento, tipo_publicacion: "normal" }
          : evento,
      );
  const negociosParaVista = negociosDestacadasEnabled
    ? negocios
    : negocios.map((negocio) =>
        negocio.tipo_publicacion === "destacada"
          ? { ...negocio, tipo_publicacion: "normal" }
          : negocio,
      );

  const actualizarParametros = useCallback(
    (cambios) => {
      setParametros(
        (actuales) => {
          const siguientes = new URLSearchParams(actuales);
          Object.entries(cambios).forEach(([parametro, valor]) => {
            if (valor === null || valor === undefined || valor === "") {
              siguientes.delete(parametro);
            } else {
              siguientes.set(parametro, String(valor));
            }
          });
          return siguientes;
        },
        { replace: true },
      );
    },
    [setParametros],
  );

  // Compatibilidad con enlaces del Home anterior que usaban ?ciudad=.
  useEffect(() => {
    const ciudadLegacy = parametros.get("ciudad");
    const highlightLegacy = parametros.get("highlight");
    if (!ciudadLegacy && !highlightLegacy) return;

    let ciudadKey = null;
    if (ciudadLegacy) {
      const normalizada = ciudadLegacy
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es-CL")
        .trim();
      ciudadKey = Object.entries(LOCATIONS).find(
        ([clave, ciudad]) =>
          normalizada === clave ||
          normalizada ===
            ciudad.nombre
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLocaleLowerCase("es-CL") ||
          ciudad.comunas.some(
            (comuna) =>
              normalizada ===
              comuna
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLocaleLowerCase("es-CL"),
          ),
      )?.[0];
    }

    actualizarParametros({
      ciudad: null,
      highlight: null,
      p_ciudad: ciudadLegacy ? ciudadKey || null : null,
      p_busqueda: ciudadLegacy && !ciudadKey ? ciudadLegacy : null,
      p_highlight: highlightLegacy,
    });
  }, [actualizarParametros, parametros]);

  const publicar = useCallback(
    (ruta) => {
      if (!isAuthenticated) {
        setModalAuthAbierto(true);
        return;
      }

      navigate(ruta);
    },
    [isAuthenticated, navigate],
  );

  const abrirPanorama = useCallback(async (panorama) => {
    setPanoramaSeleccionado(panorama);
    setModalPanoramaAbierto(true);

    if (!panorama?.id) return;

    try {
      const panoramaCompleto = await getEventById(panorama.id);
      setPanoramaSeleccionado(panoramaCompleto || panorama);
    } catch (cargaError) {
      console.error("Error cargando detalle del panorama:", cargaError);
    }
  }, []);

  const cerrarPanorama = useCallback(() => {
    setModalPanoramaAbierto(false);
    setPanoramaSeleccionado(null);
  }, []);

  const abrirNegocio = useCallback((negocio) => {
    setNegocioSeleccionado(negocio);
    setModalNegocioAbierto(true);
  }, []);

  const cerrarNegocio = useCallback(() => {
    setModalNegocioAbierto(false);
    setNegocioSeleccionado(null);
  }, []);

  const seleccionarPanoramas = useCallback(() => {
    setSeccionActiva("panoramas");
    actualizarParametros({
      p_ciudad: null,
      p_comuna: null,
      p_categoria: null,
      p_busqueda: null,
      p_fecha: null,
      p_precio: null,
      p_highlight: null,
    });
  }, [actualizarParametros]);

  const seleccionarSuperbuscador = useCallback(() => {
    setSeccionActiva("superbuscador");
    actualizarParametros({
      sg_ciudad: null,
      sg_comuna: null,
      sg_categoria: null,
      sg_subcategoria: null,
      sg_busqueda: null,
      sg_highlight: null,
    });
  }, [actualizarParametros]);

  return (
    <main className="home-consolidado">
      {seccionActiva !== "superbuscador" && (
        <HomeHero
          eventos={eventosParaVista}
          ciudad={parametros.get("p_ciudad")}
          comuna={parametros.get("p_comuna")}
          cargando={cargando}
          error={error}
          onEventoClick={abrirPanorama}
          semillaOrden={semillaOrden}
        />
      )}

      <HomeAccesos
        seccionActiva={seccionActiva}
        onPanoramas={seleccionarPanoramas}
        onSuperbuscador={seleccionarSuperbuscador}
      />

      {seccionActiva !== "superbuscador" && (
        <HomePanoramas
          eventos={eventosParaVista}
          categorias={categoriasPanoramas}
          parametros={parametros}
          actualizarParametros={actualizarParametros}
          cargando={cargando}
          error={error}
          recargar={recargar}
          onEventoClick={abrirPanorama}
          onNegocioClick={abrirNegocio}
          carouselItems={negociosParaVista}
          onPublicar={() => publicar("/crear-publicacion")}
          semillaOrden={semillaOrden}
        />
      )}

      {seccionActiva !== "panoramas" && (
        <HomeSuperguia
          negocios={negociosParaVista}
          categorias={categoriasNegocios}
          parametros={parametros}
          actualizarParametros={actualizarParametros}
          cargando={cargando}
          error={error}
          recargar={recargar}
          onNegocioClick={abrirNegocio}
          onEventoClick={abrirPanorama}
          carouselItems={eventosParaVista}
          onPublicar={() => publicar("/crear-publicacion")}
          semillaOrden={semillaOrden}
        />
      )}

      <PublicationModal
        publication={panoramaSeleccionado}
        isOpen={modalPanoramaAbierto}
        onClose={cerrarPanorama}
        modalVariant="panoramas"
      />
      <BusinessModal
        business={negocioSeleccionado}
        isOpen={modalNegocioAbierto}
        onClose={cerrarNegocio}
      />
      <AuthModal
        isOpen={modalAuthAbierto}
        onClose={() => setModalAuthAbierto(false)}
      />

      <Footer />
    </main>
  );
}
