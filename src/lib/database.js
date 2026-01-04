/**
 * @fileoverview Archivo de compatibilidad - Re-exporta desde la nueva estructura modular
 * @deprecated Importar directamente desde 'lib/database' o módulos específicos
 *
 * MIGRACIÓN:
 * - Antes:  import { getCategories } from '../lib/database'
 * - Ahora:  import { getCategories } from '../lib/database' (sigue funcionando)
 * - Mejor:  import { getCategories } from '../lib/database/categories' (más específico)
 *
 * La nueva estructura modular está en: src/lib/database/
 * ├── index.js        → Re-exporta todo (punto de entrada)
 * ├── cache.js        → Sistema de caché
 * ├── categories.js   → Categorías
 * ├── events.js       → Eventos
 * ├── images.js       → Imágenes
 * ├── tags.js         → Tags
 * ├── profiles.js     → Perfiles
 * ├── businesses.js   → Negocios
 * ├── roles.js        → Roles y permisos
 * ├── admin.js        → Panel de administración
 * ├── notifications.js → Notificaciones
 * └── bans.js         → Sistema de baneo
 */

// Re-exportar todo desde la nueva estructura modular
export * from "./database/index";
