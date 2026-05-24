/**
 * Google Analytics 4 - Wrapper seguro
 *
 * - Solo activo en producción si VITE_GA_MEASUREMENT_ID está definido.
 * - En dev: console.log en lugar de envío real.
 * - Excluye automáticamente admins y moderators.
 * - Debounce incorporado para búsquedas.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_DEV = import.meta.env.DEV;
const ADMIN_ROLES = new Set(["admin", "moderator"]);

let _enabled = Boolean(MEASUREMENT_ID);
let _disabledForUser = false;
let _userId = null;

// Debounce store para trackSearch
const _searchTimers = {};

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  LOGIN: "login",
  SIGN_UP: "sign_up",
  LOGOUT: "logout",
  SEARCH: "search",
  FILTER_APPLIED: "filter_applied",
  FILTERS_CLEARED: "filters_cleared",
  PUBLICATION_VIEW: "publication_view",
  BUSINESS_VIEW: "business_view",
  PUBLICATION_CREATED: "publication_created",
  BUSINESS_CREATED: "business_created",
  PLAN_STARTED: "plan_activation_started",
  PURCHASE: "purchase",
  PAYMENT_FAILED: "payment_failed",
  CAROUSEL_CLICK: "carousel_click",
  PAGINATION_USE: "pagination_use",
  EXTERNAL_LINK_CLICK: "external_link_click",
};

function gtag() {
  if (window.gtag) {
    window.gtag.apply(null, arguments);
  }
}

function safeGtag(name, params) {
  if (!_enabled || _disabledForUser) return;

  if (IS_DEV) {
    console.log("[GA4 DEV]", name, params);
    return;
  }

  try {
    gtag("event", name, params);
  } catch (e) {
    // Silencioso en producción
  }
}

// ─── INIT ────────────────────────────────────────────────────

export function initAnalytics() {
  if (!MEASUREMENT_ID) {
    _enabled = false;
    return;
  }

  _enabled = true;

  if (!IS_DEV) {
    window.dataLayer = window.dataLayer || [];
    function gtagFn() {
      window.dataLayer.push(arguments);
    }
    gtagFn("js", new Date());
    gtagFn("config", MEASUREMENT_ID, {
      send_page_view: false,
    });
  }
}

// ─── USER CONTEXT ────────────────────────────────────────────

export function setUserContext(user, role = null) {
  if (!user) {
    _userId = null;
    _disabledForUser = false;
    if (!IS_DEV) {
      gtag("set", "user_properties", { admin: false, role: "anonymous" });
    }
    return;
  }

  const isAdmin = ADMIN_ROLES.has(role);
  _disabledForUser = isAdmin;
  _userId = isAdmin ? null : user.id;

  if (!IS_DEV && !isAdmin) {
    gtag("config", MEASUREMENT_ID, { user_id: user.id });
    gtag("set", "user_properties", {
      admin: false,
      role: role || "user",
    });
  } else if (!IS_DEV && isAdmin) {
    gtag("set", "user_properties", { admin: true, role });
  }

  if (IS_DEV && isAdmin) {
    console.log("[GA4 DEV] Tracking desactivado para admin/moderator");
  }
}

// ─── PAGE VIEW ───────────────────────────────────────────────

export function trackPageView(path, title) {
  if (!_enabled || _disabledForUser) return;

  if (IS_DEV) {
    console.log("[GA4 DEV] page_view", { page_path: path, page_title: title });
    return;
  }

  try {
    gtag("event", "page_view", {
      page_path: path,
      page_title: title,
      send_to: MEASUREMENT_ID,
    });
  } catch (e) {
    // Silencioso
  }
}

// ─── GENERIC EVENT ───────────────────────────────────────────

export function trackEvent(name, params = {}) {
  safeGtag(name, params);
}

// ─── SEARCH (debounced 800ms) ────────────────────────────────

export function trackSearch(term, scope = "general") {
  if (!_enabled || _disabledForUser || !term?.trim()) return;
  const trimmed = term.trim();
  const key = `search_${scope}`;

  clearTimeout(_searchTimers[key]);
  _searchTimers[key] = setTimeout(() => {
    safeGtag("search", {
      search_term: trimmed,
      search_scope: scope,
    });
  }, 800);
}

export function trackSearchImmediate(term, scope = "general") {
  if (!_enabled || _disabledForUser || !term?.trim()) return;
  const key = `search_${scope}`;
  clearTimeout(_searchTimers[key]);
  safeGtag("search", {
    search_term: term.trim(),
    search_scope: scope,
  });
}

// ─── FILTERS ─────────────────────────────────────────────────

export function trackFilter(filterType, value, label) {
  safeGtag(ANALYTICS_EVENTS.FILTER_APPLIED, {
    filter_type: filterType,
    filter_value: value,
    filter_label: label || null,
  });
}

export function trackFiltersCleared() {
  safeGtag(ANALYTICS_EVENTS.FILTERS_CLEARED, {});
}

// ─── PUBLICATIONS ────────────────────────────────────────────

export function trackPublicationView(publication) {
  safeGtag(ANALYTICS_EVENTS.PUBLICATION_VIEW, {
    publication_id: publication?.id || null,
    publication_title: publication?.titulo || null,
    publication_category: publication?.categories?.nombre || null,
    publication_city: publication?.provincia || null,
    publication_comuna: publication?.comuna || null,
  });
}

export function trackPublicationCreated(data) {
  safeGtag(ANALYTICS_EVENTS.PUBLICATION_CREATED, {
    publication_category: data?.category || null,
    publication_city: data?.city || null,
    publication_comuna: data?.comuna || null,
    is_edit: data?.isEdit || false,
  });
}

// ─── BUSINESSES ──────────────────────────────────────────────

export function trackBusinessView(business) {
  safeGtag(ANALYTICS_EVENTS.BUSINESS_VIEW, {
    business_id: business?.id || null,
    business_name: business?.nombre || null,
    business_category: business?.categoria || null,
    business_subcategory: business?.subcategoria || null,
    business_city: business?.provincia || null,
    business_comuna: business?.comuna || null,
  });
}

export function trackBusinessCreated(data) {
  safeGtag(ANALYTICS_EVENTS.BUSINESS_CREATED, {
    business_category: data?.category || null,
    business_subcategory: data?.subcategory || null,
    business_city: data?.city || null,
    business_comuna: data?.comuna || null,
  });
}

// ─── CAROUSEL ────────────────────────────────────────────────

export function trackCarouselClick(publication) {
  safeGtag(ANALYTICS_EVENTS.CAROUSEL_CLICK, {
    publication_id: publication?.id || null,
    publication_title: publication?.titulo || publication?.nombre || null,
  });
}

// ─── PAGINATION ──────────────────────────────────────────────

export function trackPaginationUse(page, totalPages) {
  safeGtag(ANALYTICS_EVENTS.PAGINATION_USE, {
    page_number: page,
    total_pages: totalPages,
  });
}

// ─── AUTH ────────────────────────────────────────────────────

export function trackLogin(method = "password") {
  safeGtag(ANALYTICS_EVENTS.LOGIN, { method });
}

export function trackSignUp(method = "password") {
  safeGtag(ANALYTICS_EVENTS.SIGN_UP, { method });
}

export function trackLogout() {
  safeGtag(ANALYTICS_EVENTS.LOGOUT, {});
}

// ─── PLANS & PAYMENTS ────────────────────────────────────────

export function trackPlanStarted(planType) {
  safeGtag(ANALYTICS_EVENTS.PLAN_STARTED, {
    plan_type: planType,
  });
}

export function trackPurchase({ value, currency = "CLP", transactionId, items = [] } = {}) {
  safeGtag(ANALYTICS_EVENTS.PURCHASE, {
    value,
    currency,
    transaction_id: transactionId,
    items,
  });
}

export function trackPaymentFailed(reason) {
  safeGtag(ANALYTICS_EVENTS.PAYMENT_FAILED, {
    failure_reason: reason || "unknown",
  });
}

// ─── EXTERNAL LINK ───────────────────────────────────────────

export function trackExternalLinkClick(url, label) {
  safeGtag(ANALYTICS_EVENTS.EXTERNAL_LINK_CLICK, {
    link_url: url,
    link_label: label || null,
  });
}

// ─── INIT AUTO ───────────────────────────────────────────────

if (typeof window !== "undefined") {
  initAnalytics();
}
