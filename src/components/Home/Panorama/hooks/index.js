/**
 * @fileoverview Punto de entrada para los hooks del módulo Panorama
 *
 * ARQUITECTURA:
 * Los hooks están organizados por responsabilidad única (SRP):
 *
 * HOOK PRINCIPAL:
 * - usePublicarForm: Hook principal modular y escalable
 *
 * HOOKS ESPECIALIZADOS:
 * - useFormValidation: Validación declarativa de formularios
 * - useImageManager: Gestión de imágenes con cleanup automático
 * - useDraftManager: Manejo de borradores con auto-guardado
 * - useEventEditor: Carga de eventos para edición
 * - useEventSubmit: Envío de formularios con protección
 *
 * USO:
 * ```js
 * import { usePublicarForm } from './hooks';
 * // O importar hooks específicos:
 * import { useFormValidation, useImageManager } from './hooks';
 * ```
 */

// Hook principal
export { default as usePublicarForm } from "./usePublicarFormV2";

// Hooks especializados
export {
  default as useFormValidation,
  EVENT_VALIDATION_SCHEMA,
} from "./useFormValidation";
export { default as useImageManager } from "./useImageManager";
export { default as useDraftManager } from "./useDraftManager";
export { default as useEventEditor } from "./useEventEditor";
export { default as useEventSubmit } from "./useEventSubmit";
