import { formatDateKey } from "../Superguia/DateCalendar";

const normalizar = (valor) => String(valor ?? "").toLocaleLowerCase("es-CL");

const coincideTexto = (valor, consulta) =>
  normalizar(valor).includes(normalizar(consulta));

const hashTexto = (valor) => {
  let hash = 2166136261;
  for (const caracter of String(valor)) {
    hash ^= caracter.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mezclarConSemilla = (elementos, semilla) => {
  const resultado = [...elementos];
  let estado = (Number(semilla) || 0) >>> 0;

  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    estado = (Math.imul(estado ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
    const destino = estado % (indice + 1);
    [resultado[indice], resultado[destino]] = [
      resultado[destino],
      resultado[indice],
    ];
  }

  return resultado;
};

export const crearSemillaOrden = () =>
  (Date.now() ^ Math.floor((globalThis.performance?.now?.() || 0) * 1000)) >>> 0;

export const obtenerFechaTermino = (evento) => {
  if (
    evento?.es_recurrente &&
    Array.isArray(evento.fechas_recurrencia) &&
    evento.fechas_recurrencia.length > 0
  ) {
    return [...evento.fechas_recurrencia].filter(Boolean).sort().pop();
  }

  return evento?.fecha_fin || evento?.fecha_evento;
};

export const esEventoVigente = (evento, hoy = new Date()) => {
  const fechaTermino = obtenerFechaTermino(evento);
  if (!fechaTermino) return true;

  const fin = new Date(`${fechaTermino}T23:59:59`);
  return !Number.isNaN(fin.getTime()) && fin >= hoy;
};

export const obtenerFechaOrden = (evento, fechaHoy = formatDateKey(new Date())) => {
  if (
    evento?.es_recurrente &&
    Array.isArray(evento.fechas_recurrencia) &&
    evento.fechas_recurrencia.length > 0
  ) {
    const fechas = [...evento.fechas_recurrencia].filter(Boolean).sort();
    return fechas.find((fecha) => fecha >= fechaHoy) || fechas[fechas.length - 1];
  }

  if (evento?.fecha_evento && evento.fecha_evento >= fechaHoy) {
    return evento.fecha_evento;
  }

  if (evento?.fecha_fin && evento.fecha_fin >= fechaHoy) {
    return fechaHoy;
  }

  return evento?.fecha_evento || "9999-12-31";
};

const coincideFechaEvento = (evento, fecha) => {
  if (!fecha || !evento?.fecha_evento) return false;

  const fechaSeleccionada = formatDateKey(fecha);
  if (formatDateKey(new Date(`${evento.fecha_evento}T00:00:00`)) === fechaSeleccionada) {
    return true;
  }

  if (evento.es_recurrente && Array.isArray(evento.fechas_recurrencia)) {
    const coincideRecurrencia = evento.fechas_recurrencia.some(
      (fechaRecurrente) =>
        formatDateKey(new Date(`${fechaRecurrente}T00:00:00`)) === fechaSeleccionada,
    );
    if (coincideRecurrencia) return true;
  }

  if (evento.es_multidia && evento.fecha_fin) {
    const inicio = new Date(`${evento.fecha_evento}T00:00:00`);
    const fin = new Date(`${evento.fecha_fin}T00:00:00`);
    const seleccionada = new Date(`${fechaSeleccionada}T00:00:00`);
    return seleccionada >= inicio && seleccionada <= fin;
  }

  return false;
};

const coincidePrecio = (evento, precio) => {
  if (!precio) return true;

  const valor = evento.precio || 0;
  switch (precio) {
    case "gratis":
      return (
        evento.tipo_entrada !== "info_descripcion" &&
        (valor === 0 ||
          evento.tipo_entrada === "gratis" ||
          evento.tipo_entrada === "gratuito" ||
          evento.tipo_entrada === "sin_entrada")
      );
    case "economico":
      return valor > 0 && valor <= 10000;
    case "moderado":
      return valor > 10000 && valor <= 30000;
    case "premium":
      return valor > 30000;
    default:
      return true;
  }
};

export const filtrarEventos = (
  eventos,
  filtros,
  ubicaciones,
  { excluir = [] } = {},
) => {
  const omitidos = new Set(excluir);
  const filtrosActivos = filtros || {};
  const normalizarUbicacion = (valor) =>
    normalizar(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const ciudadNormalizada = normalizarUbicacion(filtrosActivos.ciudad);
  const ubicacionCiudad = ciudadNormalizada
    ? Object.entries(ubicaciones || {}).find(
        ([clave, ubicacion]) =>
          normalizarUbicacion(clave) === ciudadNormalizada ||
          normalizarUbicacion(ubicacion?.nombre) === ciudadNormalizada,
      )?.[1]
    : null;
  const nombreCiudad = ubicacionCiudad?.nombre;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (eventos || []).filter((evento) => {
    if (!esEventoVigente(evento, hoy)) return false;

    if (
      !omitidos.has("busqueda") &&
      filtrosActivos.busqueda &&
      ![
        evento.titulo,
        evento.descripcion,
        evento.comuna,
        evento.provincia,
        evento.categories?.nombre,
        evento.etiqueta_directa,
        evento.hashtags,
        evento.organizador,
      ].some((valor) => coincideTexto(valor, filtrosActivos.busqueda))
    ) {
      return false;
    }

    if (
      !omitidos.has("categoria") &&
      filtrosActivos.categoria &&
      String(evento.category_id) !== String(filtrosActivos.categoria)
    ) {
      // Los panoramas destacados ignoran el filtro de categoría y siempre se muestran
      if (evento.tipo_publicacion !== "destacada") {
        return false;
      }
    }

    if (
      !omitidos.has("ciudad") &&
      nombreCiudad &&
      normalizarUbicacion(evento.provincia) !== normalizarUbicacion(nombreCiudad)
    ) {
      return false;
    }

    if (
      !omitidos.has("comuna") &&
      filtrosActivos.comuna &&
      normalizarUbicacion(evento.comuna) !== normalizarUbicacion(filtrosActivos.comuna)
    ) {
      return false;
    }

    if (
      !omitidos.has("fecha") &&
      !coincideFechaEvento(evento, filtrosActivos.fecha)
    ) {
      if (filtrosActivos.fecha) return false;
    }

    if (
      !omitidos.has("precio") &&
      !coincidePrecio(evento, filtrosActivos.precio)
    ) {
      return false;
    }

    return true;
  });
};

export const ordenarEventos = (
  eventos,
  destacadasHabilitadas = true,
  semillaOrden = 0,
) => {
  const destacadas = destacadasHabilitadas
    ? eventos.filter((evento) => evento.tipo_publicacion === "destacada")
    : [];
  const normales = eventos.filter(
    (evento) => !destacadasHabilitadas || evento.tipo_publicacion !== "destacada",
  );

  return [
    ...mezclarConSemilla(destacadas, semillaOrden ^ 0x51f15e),
    ...mezclarConSemilla(normales, semillaOrden ^ 0xa7c3d9),
  ];
};

export const construirCalendarioEventos = (eventos) => {
  const eventosPorDia = {};
  const fechasRecurrentes = new Set();

  eventos.forEach((evento) => {
    if (evento.fecha_evento) {
      const fechaInicio = new Date(`${evento.fecha_evento}T00:00:00`);
      const fechaInicioKey = formatDateKey(fechaInicio);
      eventosPorDia[fechaInicioKey] = (eventosPorDia[fechaInicioKey] || 0) + 1;

      if (evento.es_multidia && evento.fecha_fin) {
        const fechaFin = new Date(`${evento.fecha_fin}T00:00:00`);
        const fechaActual = new Date(fechaInicio);
        fechaActual.setDate(fechaActual.getDate() + 1);

        while (fechaActual <= fechaFin) {
          const fechaKey = formatDateKey(fechaActual);
          eventosPorDia[fechaKey] = (eventosPorDia[fechaKey] || 0) + 1;
          fechaActual.setDate(fechaActual.getDate() + 1);
        }
      }
    }

    if (evento.es_recurrente && Array.isArray(evento.fechas_recurrencia)) {
      evento.fechas_recurrencia.forEach((fecha) => {
        const fechaKey = formatDateKey(new Date(`${fecha}T00:00:00`));
        eventosPorDia[fechaKey] = (eventosPorDia[fechaKey] || 0) + 1;
        fechasRecurrentes.add(fechaKey);
      });
    }
  });

  return { eventosPorDia, fechasRecurrentes };
};

export const crearSubcategorias = (categorias) => {
  const subcategorias = [];
  let siguienteId = 1;

  (categorias || []).forEach((categoria) => {
    (categoria.subcategorias || []).forEach((subcategoria) => {
      const nombre =
        typeof subcategoria === "string" ? subcategoria : subcategoria?.nombre;
      if (!nombre) return;

      subcategorias.push({
        id: siguienteId,
        nombre,
        category_id: categoria.id,
      });
      siguienteId += 1;
    });
  });

  return subcategorias;
};

export const filtrarNegocios = (
  negocios,
  filtros,
  categorias,
  subcategorias,
  ubicaciones,
  { excluir = [], semillaOrden = 0 } = {},
) => {
  const omitidos = new Set(excluir);
  const filtrosActivos = filtros || {};
  const normalizarUbicacion = (valor) =>
    normalizar(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const ciudadNormalizada = normalizarUbicacion(filtrosActivos.ciudad);
  const ubicacionCiudad = ciudadNormalizada
    ? Object.entries(ubicaciones || {}).find(
        ([clave, ubicacion]) =>
          normalizarUbicacion(clave) === ciudadNormalizada ||
          normalizarUbicacion(ubicacion?.nombre) === ciudadNormalizada,
      )?.[1]
    : null;
  const nombreCiudad = ubicacionCiudad?.nombre;
  const categoria = (categorias || []).find(
    (item) => String(item.id) === String(filtrosActivos.categoria),
  );
  const subcategoria = (subcategorias || []).find(
    (item) => String(item.id) === String(filtrosActivos.subcategoria),
  );

  const filtrados = (negocios || [])
    .filter((negocio) => {
      const idCategoriaNegocio = negocio.category_id ?? negocio.categoria_id;
      const idSubcategoriaNegocio =
        negocio.subcategory_id ?? negocio.subcategoria_id;
      const coincideCategoria =
        !filtrosActivos.categoria ||
        !categoria ||
        (idCategoriaNegocio !== undefined &&
        idCategoriaNegocio !== null &&
        idCategoriaNegocio !== ""
          ? String(idCategoriaNegocio) === String(filtrosActivos.categoria)
          : normalizar(negocio.categoria) === normalizar(categoria.nombre));
      const coincideSubcategoria =
        !filtrosActivos.subcategoria ||
        !subcategoria ||
        (idSubcategoriaNegocio !== undefined &&
        idSubcategoriaNegocio !== null &&
        idSubcategoriaNegocio !== ""
          ? String(idSubcategoriaNegocio) === String(filtrosActivos.subcategoria)
          : normalizar(negocio.subcategoria) === normalizar(subcategoria.nombre));

      if (
        !omitidos.has("busqueda") &&
        filtrosActivos.busqueda &&
        ![
          negocio.nombre,
          negocio.comuna,
          negocio.provincia,
          negocio.categoria,
          negocio.subcategoria,
          negocio.slogan,
          negocio.descripcion,
          categoria?.nombre,
          subcategoria?.nombre,
        ].some((valor) => coincideTexto(valor, filtrosActivos.busqueda))
      ) {
        return false;
      }

      if (
        !omitidos.has("categoria") &&
        !coincideCategoria
      ) {
        return false;
      }

      if (
        !omitidos.has("subcategoria") &&
        !coincideSubcategoria
      ) {
        return false;
      }

      if (
        !omitidos.has("ciudad") &&
        nombreCiudad &&
        normalizarUbicacion(negocio.provincia) !== normalizarUbicacion(nombreCiudad)
      ) {
        return false;
      }

      if (
        !omitidos.has("comuna") &&
        filtrosActivos.comuna &&
        normalizarUbicacion(negocio.comuna) !== normalizarUbicacion(filtrosActivos.comuna)
      ) {
        return false;
      }

      return true;
    });

  const destacados = filtrados.filter(
    (negocio) => negocio.tipo_publicacion === "destacada",
  );
  const normales = filtrados.filter(
    (negocio) => negocio.tipo_publicacion !== "destacada",
  );

  return [
    ...mezclarConSemilla(destacados, semillaOrden ^ 0x2f4a1),
    ...mezclarConSemilla(normales, semillaOrden ^ 0x8b31c),
  ];
};
