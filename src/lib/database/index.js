/**
 * @fileoverview Punto de entrada principal para todas las funciones de base de datos
 * @module database
 *
 * Este archivo re-exporta todas las funciones de los módulos individuales
 * para mantener compatibilidad con las importaciones existentes.
 *
 * ESTRUCTURA DE MÓDULOS:
 * ├── cache.js        → Sistema de caché en memoria
 * ├── categories.js   → Gestión de categorías
 * ├── events.js       → Gestión de eventos/publicaciones
 * ├── images.js       → Manejo de imágenes en Storage
 * ├── tags.js         → Gestión de tags/etiquetas
 * ├── profiles.js     → Perfiles de usuario
 * ├── businesses.js   → Gestión de negocios
 * ├── roles.js        → Roles y permisos
 * ├── admin.js        → Funciones del panel de administración
 * ├── notifications.js → Sistema de notificaciones
 * └── bans.js         → Sistema de baneo de usuarios
 */

// ============ CACHÉ ============
export { invalidateCache, clearCache } from "./cache";

// ============ CATEGORÍAS ============
export {
  getCategories,
  getCategoryById,
  getSubcategories,
  getSubcategoriesByCategoryId,
  getCategoriesWithSubcategories,
} from "./categories";

// ============ EVENTOS ============
export {
  createEvent,
  getPublishedEvents,
  getEventsByCity,
  getEventsByUser,
  getEventById,
  getFilteredEvents,
  updateEvent,
  deleteEvent,
} from "./events";

// ============ IMÁGENES ============
export {
  uploadEventImage,
  uploadMultipleImages,
  deleteEventImage,
  uploadBusinessImage,
} from "./images";

// ============ TAGS ============
export { getTags, addTagsToEvent } from "./tags";

// ============ PERFILES ============
export { getProfile, upsertProfile } from "./profiles";

// ============ NEGOCIOS ============
export {
  createBusiness,
  getPublishedBusinesses,
  getBusinessesByUser,
  getPendingBusinesses,
  getAllBusinesses,
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
  updateBusiness,
} from "./businesses";

// ============ ROLES Y PERMISOS ============
export {
  ROLES,
  ESTADOS_PUBLICACION,
  getUserRole,
  isAdmin,
  isModerator,
  updateUserRole,
  getAllUsers,
  deleteUser,
} from "./roles";

// ============ ADMINISTRACIÓN ============
export {
  getPendingEvents,
  getAllEvents,
  approveEvent,
  rejectEvent,
  getAdminStats,
  getEventsPerDay,
  getUsersPerDay,
  getAllUsersWithBanStatus,
} from "./admin";

// ============ NOTIFICACIONES ============
export {
  NOTIFICATION_TYPES,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  createWelcomeNotification,
} from "./notifications";

// ============ SISTEMA DE BANEO ============
export { checkBanStatus, banUser, unbanUser, getUserBanHistory } from "./bans";

// ============ FAVORITOS ============
export {
  getUserFavorites,
  isFavorite,
  getFavoriteIds,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  countUserFavorites,
} from "./favorites";

// ============ BORRADORES ============
export {
  saveDraft,
  getDrafts,
  getDraftById,
  deleteDraft,
  countDrafts,
  deleteAllDraftsByType,
} from "./drafts";

// ============ LIKES ============
export {
  getLikesCount,
  hasUserLiked,
  getLikesState,
  toggleLike,
  addLike,
  removeLike,
} from "./likes";
