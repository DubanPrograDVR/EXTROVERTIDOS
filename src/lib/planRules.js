/**
 * @fileoverview Reglas y restricciones de planes de publicación
 * @module planRules
 *
 * Define las restricciones de cada plan de suscripción:
 * - Modos de calendario permitidos (un día, rango, fechas específicas)
 * - Límites de publicaciones
 * - Ventana de creación (30 días desde la compra)
 * - Rango máximo de fecha de evento (365 días)
 */

// ═══════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════

/** Tipos de plan (coinciden con el enum plan_type de la BD) */
export const PLAN_TYPES = {
  UNICA: "panorama_unica",
  PACK4: "panorama_pack4",
  ILIMITADO: "panorama_ilimitado",
  SUPERGUIA: "superguia",
};

/** Días máximos desde la compra para crear publicaciones */
export const MAX_DIAS_CREACION = 30;

/** Días máximos a futuro para la fecha del evento */
export const MAX_FECHA_EVENTO = 365;

/** Modos de selección en el calendario */
export const CALENDAR_MODES = {
  SINGLE: "single", // Un solo día
  RANGE: "range", // Días consecutivos (rango)
  SPECIFIC: "specific", // Fechas específicas (no consecutivas)
};

/** Límite de publicaciones por plan (0 = ilimitado) */
export const PLAN_LIMITS = {
  [PLAN_TYPES.UNICA]: 1,
  [PLAN_TYPES.PACK4]: 4,
  [PLAN_TYPES.ILIMITADO]: 0, // 0 = sin límite
  [PLAN_TYPES.SUPERGUIA]: 1, // 1 negocio por suscripción
};

/** Duración máxima de un negocio publicado en Superguía (días) */
export const MAX_DURACION_NEGOCIO = 365;

// ═══════════════════════════════════════════════
// FUNCIONES DE REGLAS
// ═══════════════════════════════════════════════

/**
 * Obtiene los modos de calendario permitidos según el tipo de plan.
 *
 * - panorama_unica / panorama_pack4: solo "single" (un día)
 * - panorama_ilimitado: todos los modos
 * - Sin plan (modo prueba): todos los modos
 *
 * @param {string|null} planType - Tipo de plan activo, o null si no hay plan
 * @param {boolean} planesEnabled - Si los planes están habilitados globalmente
 * @returns {{ enabledModes: string[], disabledModes: string[] }}
 */
export function getCalendarModes(planType, planesEnabled = true) {
  const allModes = [
    CALENDAR_MODES.SINGLE,
    CALENDAR_MODES.RANGE,
    CALENDAR_MODES.SPECIFIC,
  ];

  // Si los planes no están habilitados (modo prueba), permitir todo
  if (!planesEnabled) {
    return { enabledModes: allModes, disabledModes: [] };
  }

  // Si no hay plan activo y planes están habilitados, solo single
  if (!planType) {
    return {
      enabledModes: [CALENDAR_MODES.SINGLE],
      disabledModes: [CALENDAR_MODES.RANGE, CALENDAR_MODES.SPECIFIC],
    };
  }

  switch (planType) {
    case PLAN_TYPES.UNICA:
    case PLAN_TYPES.PACK4:
      return {
        enabledModes: [CALENDAR_MODES.SINGLE],
        disabledModes: [CALENDAR_MODES.RANGE, CALENDAR_MODES.SPECIFIC],
      };

    case PLAN_TYPES.ILIMITADO:
      return {
        enabledModes: allModes,
        disabledModes: [],
      };

    default:
      return {
        enabledModes: [CALENDAR_MODES.SINGLE],
        disabledModes: [CALENDAR_MODES.RANGE, CALENDAR_MODES.SPECIFIC],
      };
  }
}

/**
 * Detecta el modo de selección usado según los días seleccionados.
 *
 * @param {string[]} selectedDays - Array de fechas ISO (YYYY-MM-DD)
 * @returns {string} Modo detectado: 'single', 'range' o 'specific'
 */
export function detectCalendarMode(selectedDays) {
  if (!selectedDays || selectedDays.length === 0) return CALENDAR_MODES.SINGLE;
  if (selectedDays.length === 1) return CALENDAR_MODES.SINGLE;

  // Verificar si son consecutivos
  const sorted = [...selectedDays].sort();
  let isConsecutive = true;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) {
      isConsecutive = false;
      break;
    }
  }

  return isConsecutive ? CALENDAR_MODES.RANGE : CALENDAR_MODES.SPECIFIC;
}

/**
 * Valida la selección de calendario según el plan del usuario.
 *
 * @param {string|null} planType - Tipo de plan activo
 * @param {string[]} selectedDays - Días seleccionados
 * @param {boolean} planesEnabled - Si los planes están habilitados
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateCalendarSelection(
  planType,
  selectedDays,
  planesEnabled = true,
) {
  // Sin restricciones si planes no están habilitados
  if (!planesEnabled) {
    return { valid: true, error: null };
  }

  const { enabledModes } = getCalendarModes(planType, planesEnabled);
  const modeUsed = detectCalendarMode(selectedDays);

  if (!enabledModes.includes(modeUsed)) {
    return {
      valid: false,
      error: "El modo de selección de fechas no está permitido para tu plan",
    };
  }

  if (modeUsed === CALENDAR_MODES.SINGLE && selectedDays.length !== 1) {
    return {
      valid: false,
      error: "Debes seleccionar exactamente 1 día",
    };
  }

  if (modeUsed === CALENDAR_MODES.RANGE) {
    const sorted = [...selectedDays].sort();
    let isConsecutive = true;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + "T00:00:00");
      const curr = new Date(sorted[i] + "T00:00:00");
      if ((curr - prev) / (1000 * 60 * 60 * 24) !== 1) {
        isConsecutive = false;
        break;
      }
    }
    if (!isConsecutive) {
      return {
        valid: false,
        error: "Los días seleccionados deben ser consecutivos",
      };
    }
  }

  if (modeUsed === CALENDAR_MODES.SPECIFIC && selectedDays.length < 1) {
    return {
      valid: false,
      error: "Debes seleccionar al menos 1 día",
    };
  }

  return { valid: true, error: null };
}

/**
 * Valida si el usuario puede crear una nueva publicación según su plan.
 *
 * Verifica:
 * 1. Que tenga un plan activo (si planes están habilitados)
 * 2. Que no haya excedido el límite de publicaciones
 * 3. Que esté dentro de la ventana de 30 días desde la compra
 * 4. Que la fecha del evento sea válida (no pasada, no > 365 días)
 *
 * @param {Object} params
 * @param {Object|null} params.subscription - Suscripción activa del usuario
 * @param {boolean} params.planesEnabled - Si los planes están habilitados
 * @param {string} [params.fechaEvento] - Fecha del evento (ISO)
 * @param {boolean} [params.isAdmin] - Si el usuario es admin
 * @param {boolean} [params.isModerator] - Si el usuario es moderador
 * @returns {{ canPublish: boolean, error: string|null, warning: string|null }}
 */
export function canUserPublish({
  subscription,
  planesEnabled,
  fechaEvento,
  isAdmin = false,
  isModerator = false,
}) {
  // Admins y moderadores siempre pueden publicar
  if (isAdmin || isModerator) {
    return { canPublish: true, error: null, warning: null };
  }

  // Si los planes no están habilitados (modo prueba), permitir
  if (!planesEnabled) {
    return { canPublish: true, error: null, warning: null };
  }

  // Si planes están habilitados pero no tiene suscripción activa
  if (!subscription) {
    return {
      canPublish: false,
      error:
        "Necesitas un plan activo para publicar. Ve a 'Activar Plan' para contratar uno.",
      warning: null,
    };
  }

  const { plan, publicaciones_usadas, publicaciones_total, fecha_inicio } =
    subscription;

  // Verificar límite de publicaciones (0 = ilimitado)
  const limit = PLAN_LIMITS[plan];
  if (limit > 0 && publicaciones_usadas >= limit) {
    return {
      canPublish: false,
      error: `Has alcanzado el límite de ${limit} publicación${limit > 1 ? "es" : ""} de tu plan. Adquiere un nuevo plan para seguir publicando.`,
      warning: null,
    };
  }

  // Verificar ventana de creación (30 días desde la compra)
  if (fecha_inicio) {
    const compra = new Date(fecha_inicio);
    const hoy = new Date();
    const diasDesdeCompra = Math.floor((hoy - compra) / (1000 * 60 * 60 * 24));

    if (diasDesdeCompra > MAX_DIAS_CREACION) {
      return {
        canPublish: false,
        error: `Tu plazo de ${MAX_DIAS_CREACION} días para crear publicaciones ha vencido. Adquiere un nuevo plan.`,
        warning: null,
      };
    }

    // Warning si quedan pocos días
    const diasRestantes = MAX_DIAS_CREACION - diasDesdeCompra;
    if (diasRestantes <= 5) {
      const warning = `Te quedan ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""} para crear publicaciones con este plan.`;

      // Continuar validación pero guardar el warning
      return validateFechaEvento(fechaEvento, warning);
    }
  }

  return validateFechaEvento(fechaEvento, null);
}

/**
 * Valida la fecha del evento
 * @param {string} fechaEvento - Fecha ISO
 * @param {string|null} warning - Warning previo a mantener
 * @returns {{ canPublish: boolean, error: string|null, warning: string|null }}
 */
function validateFechaEvento(fechaEvento, warning) {
  if (!fechaEvento) {
    // No validar si no hay fecha aún (la validará el form)
    return { canPublish: true, error: null, warning };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const evento = new Date(fechaEvento + "T00:00:00");
  const diffDias = Math.ceil((evento - hoy) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return {
      canPublish: false,
      error: "La fecha del evento no puede ser en el pasado",
      warning,
    };
  }

  if (diffDias > MAX_FECHA_EVENTO) {
    return {
      canPublish: false,
      error: `La fecha del evento no puede exceder ${MAX_FECHA_EVENTO} días a futuro`,
      warning,
    };
  }

  return { canPublish: true, error: null, warning };
}

/**
 * Interpreta la respuesta de la función RPC validate_and_consume_publication.
 * Usar esta función para manejar el resultado del backend de forma centralizada.
 *
 * @param {Object} rpcResult - Resultado JSON de validate_and_consume_publication
 * @returns {{ allowed: boolean, error: string|null, subscriptionId: string|null, publicationExpiresAt: string|null, planType: string|null, publicationsUsed: number|null, publicationsTotal: number|null, restrictionsEnabled: boolean|null }}
 */
export function interpretPublishResult(rpcResult) {
  if (!rpcResult) {
    return {
      allowed: false,
      error: "No se recibió respuesta del servidor. Intenta nuevamente.",
      subscriptionId: null,
      publicationExpiresAt: null,
      planType: null,
      publicationsUsed: null,
      publicationsTotal: null,
      restrictionsEnabled: null,
    };
  }

  return {
    allowed: rpcResult.allowed === true,
    error: rpcResult.allowed
      ? null
      : rpcResult.reason || "No puedes publicar en este momento.",
    subscriptionId: rpcResult.subscription_id || null,
    publicationExpiresAt: rpcResult.publication_expires_at || null,
    planType: rpcResult.plan_type || null,
    publicationsUsed: rpcResult.publications_used ?? null,
    publicationsTotal: rpcResult.publications_total ?? null,
    restrictionsEnabled: rpcResult.restrictions_enabled ?? null,
  };
}

/**
 * Obtiene información resumida del plan para mostrar en UI
 * @param {Object|null} subscription - Suscripción activa
 * @param {boolean} planesEnabled - Si están habilitados
 * @returns {Object} Info del plan
 */
export function getPlanInfo(subscription, planesEnabled) {
  if (!planesEnabled) {
    return {
      label: "Modo Prueba",
      allModesEnabled: true,
      publicacionesRestantes: null,
      diasRestantes: null,
    };
  }

  if (!subscription) {
    return {
      label: "Sin plan activo",
      allModesEnabled: false,
      publicacionesRestantes: 0,
      diasRestantes: 0,
    };
  }

  const { plan, publicaciones_usadas, publicaciones_total, fecha_inicio } =
    subscription;
  const limit = PLAN_LIMITS[plan];
  const isUnlimited = limit === 0;

  const labels = {
    [PLAN_TYPES.UNICA]: "Publicación Única",
    [PLAN_TYPES.PACK4]: "Pack 4 Publicaciones",
    [PLAN_TYPES.ILIMITADO]: "Plan Ilimitado",
    [PLAN_TYPES.SUPERGUIA]: "Superguía",
  };

  let diasRestantes = null;
  if (fecha_inicio) {
    const compra = new Date(fecha_inicio);
    const hoy = new Date();
    diasRestantes =
      MAX_DIAS_CREACION - Math.floor((hoy - compra) / (1000 * 60 * 60 * 24));
    if (diasRestantes < 0) diasRestantes = 0;
  }

  return {
    label: labels[plan] || plan,
    allModesEnabled: plan === PLAN_TYPES.ILIMITADO,
    publicacionesRestantes: isUnlimited ? null : limit - publicaciones_usadas,
    diasRestantes,
    isUnlimited,
    plan,
  };
}

/**
 * Valida si el usuario puede publicar un negocio según su plan Superguía.
 *
 * Verifica:
 * 1. Que tenga un plan Superguía activo (si planes están habilitados)
 * 2. Que no haya usado su cupo (1 negocio por suscripción)
 * 3. Que esté dentro de la ventana de 30 días desde la compra
 *
 * @param {Object} params
 * @param {Object|null} params.subscription - Suscripción superguía activa
 * @param {boolean} params.planesEnabled - Si los planes están habilitados
 * @param {boolean} [params.isAdmin] - Si el usuario es admin
 * @param {boolean} [params.isModerator] - Si el usuario es moderador
 * @returns {{ canPublish: boolean, error: string|null, warning: string|null, cuposUsados: number|null, cuposTotal: number|null, diasRestantes: number|null }}
 */
export function canUserPublishBusiness({
  subscription,
  planesEnabled,
  isAdmin = false,
  isModerator = false,
}) {
  if (isAdmin || isModerator) {
    return {
      canPublish: true,
      error: null,
      warning: null,
      cuposUsados: null,
      cuposTotal: null,
      diasRestantes: null,
    };
  }

  if (!planesEnabled) {
    return {
      canPublish: true,
      error: null,
      warning: null,
      cuposUsados: null,
      cuposTotal: null,
      diasRestantes: null,
    };
  }

  if (!subscription) {
    return {
      canPublish: false,
      reason: "no_plan",
      error:
        "Necesitas un plan Superguía activo para publicar tu negocio. Ve a 'Activar Plan' para contratar uno.",
      warning: null,
      cuposUsados: 0,
      cuposTotal: 0,
      diasRestantes: 0,
      fechaFin: null,
    };
  }

  const { publicaciones_usadas, publicaciones_total, fecha_inicio, fecha_fin } =
    subscription;
  const total = Number(publicaciones_total ?? 0);
  const used = Number(publicaciones_usadas ?? 0);

  // Verificar si está vencida
  if (fecha_fin) {
    const endDate = new Date(fecha_fin);
    if (endDate <= new Date()) {
      return {
        canPublish: false,
        reason: "plan_expired",
        error:
          "Tu suscripción Superguía ha vencido. Adquiere una nueva para seguir publicando.",
        warning: null,
        cuposUsados: used,
        cuposTotal: total,
        diasRestantes: 0,
        fechaFin: fecha_fin,
      };
    }
  }

  // Verificar cupo (solo si total > 0, las suscripciones antiguas con total=0 no tienen límite)
  if (total > 0 && used >= total) {
    return {
      canPublish: false,
      reason: "quota_exceeded",
      error:
        "Has utilizado tu cupo de publicación de negocio. Adquiere una nueva suscripción Superguía para publicar otro negocio.",
      warning: null,
      cuposUsados: used,
      cuposTotal: total,
      diasRestantes: null,
      fechaFin: fecha_fin,
    };
  }

  // Verificar ventana de 30 días
  let diasRestantes = null;
  if (fecha_inicio) {
    const compra = new Date(fecha_inicio);
    const hoy = new Date();
    const diasDesdeCompra = Math.floor((hoy - compra) / (1000 * 60 * 60 * 24));

    if (diasDesdeCompra > MAX_DIAS_CREACION) {
      return {
        canPublish: false,
        reason: "window_expired",
        error: `Tu plazo de ${MAX_DIAS_CREACION} días para crear tu publicación de negocio ha vencido. Adquiere una nueva suscripción.`,
        warning: null,
        cuposUsados: used,
        cuposTotal: total,
        diasRestantes: 0,
        fechaFin: fecha_fin,
      };
    }

    diasRestantes = MAX_DIAS_CREACION - diasDesdeCompra;

    if (diasRestantes <= 5) {
      return {
        canPublish: true,
        error: null,
        warning: `Te quedan ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""} para publicar tu negocio con esta suscripción.`,
        cuposUsados: used,
        cuposTotal: total,
        diasRestantes,
      };
    }
  }

  return {
    canPublish: true,
    error: null,
    warning: null,
    cuposUsados: used,
    cuposTotal: total,
    diasRestantes,
  };
}
