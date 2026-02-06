import { useState, useCallback, useRef } from "react";

/**
 * @typedef {Object} ValidationRule
 * @property {boolean} required - Si el campo es obligatorio
 * @property {Function} [validate] - Función de validación personalizada
 * @property {string} [message] - Mensaje de error personalizado
 * @property {Function} [condition] - Condición para aplicar la regla (recibe formData)
 */

/**
 * @typedef {Object.<string, ValidationRule>} ValidationSchema
 */

/**
 * Esquema de validación para eventos
 * Separado para facilitar testing y modificación
 */
export const EVENT_VALIDATION_SCHEMA = {
  titulo: {
    required: true,
    message: "El título es obligatorio",
    validate: (value) => value?.trim()?.length >= 3,
    validateMessage: "El título debe tener al menos 3 caracteres",
  },
  descripcion: {
    required: true,
    message: "La descripción es obligatoria",
    validate: (value) => value?.trim()?.length >= 10,
    validateMessage: "La descripción debe tener al menos 10 caracteres",
  },
  category_id: {
    required: true,
    message: "Selecciona una categoría",
  },
  fecha_evento: {
    required: true,
    message: "La fecha de inicio es obligatoria",
  },
  fecha_fin: {
    required: false,
    condition: (formData) => formData.es_multidia,
    message: "La fecha de fin es obligatoria para eventos multi-día",
    validate: (value, formData) => {
      if (!formData.es_multidia) return true;
      if (!value) return false;
      return new Date(value) >= new Date(formData.fecha_evento);
    },
    validateMessage: "La fecha de fin debe ser posterior a la fecha de inicio",
  },
  cantidad_repeticiones: {
    required: false,
    condition: (formData) => formData.es_recurrente,
    message: "Indica cuántas veces se repite el evento",
    validate: (value, formData) => {
      if (!formData.es_recurrente) return true;
      const num = parseInt(value);
      return num >= 2 && num <= 12;
    },
    validateMessage: "La cantidad de repeticiones debe ser entre 2 y 12",
  },
  fecha_evento_recurrente: {
    required: false,
    condition: (formData) => formData.es_recurrente,
    validate: (value, formData) => {
      if (!formData.es_recurrente) return true;
      return !!formData.fecha_evento;
    },
    message: "Selecciona la primera fecha para calcular las repeticiones",
  },
  provincia: {
    required: true,
    message: "Selecciona una provincia",
  },
  comuna: {
    required: true,
    message: "La comuna es obligatoria",
    validate: (value) => value?.trim()?.length > 0,
  },
  direccion: {
    required: true,
    message: "La dirección es obligatoria",
    validate: (value) => value?.trim()?.length > 0,
  },
  precio: {
    required: false,
    condition: (formData) => formData.tipo_entrada === "pagado",
    message: "Indica el precio del evento",
    validate: (value, formData) => {
      if (formData.tipo_entrada !== "pagado") return true;
      const precio = parseInt(value);
      return !isNaN(precio) && precio > 0;
    },
    validateMessage: "El precio debe ser un número mayor a 0",
  },
  url_venta: {
    required: false,
    condition: (formData) => formData.tipo_entrada === "venta_externa",
    message: "Proporciona el enlace de venta de entradas",
    validate: (value, formData) => {
      if (formData.tipo_entrada !== "venta_externa") return true;
      try {
        new URL(value);
        return true;
      } catch {
        return value?.trim()?.length > 0;
      }
    },
    validateMessage: "Proporciona una URL válida",
  },
};

/**
 * Hook para validación de formularios con soporte para validación en tiempo real
 *
 * CARACTERÍSTICAS:
 * - Validación por campo individual
 * - Validación completa del formulario
 * - Soporte para reglas condicionales
 * - Debounce para validación en tiempo real
 * - Estado de "touched" por campo
 *
 * @param {ValidationSchema} schema - Esquema de validación
 * @returns {Object} Estado y funciones de validación
 */
const useFormValidation = (schema = EVENT_VALIDATION_SCHEMA) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const debounceTimers = useRef({});

  /**
   * Valida un campo individual
   * @param {string} fieldName - Nombre del campo
   * @param {*} value - Valor del campo
   * @param {Object} formData - Datos completos del formulario (para validaciones condicionales)
   * @returns {string|null} Mensaje de error o null si es válido
   */
  const validateField = useCallback(
    (fieldName, value, formData = {}) => {
      const rule = schema[fieldName];
      if (!rule) return null;

      // Verificar si la regla aplica (condición)
      if (rule.condition && !rule.condition(formData)) {
        return null;
      }

      // Validar requerido
      if (rule.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (typeof value === "string" && !value.trim());

        if (isEmpty) {
          return rule.message;
        }
      }

      // Validación personalizada
      if (rule.validate && value) {
        const isValid = rule.validate(value, formData);
        if (!isValid) {
          return rule.validateMessage || rule.message;
        }
      }

      return null;
    },
    [schema],
  );

  /**
   * Valida todo el formulario
   * @param {Object} formData - Datos del formulario
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.checkImages - Si debe validar imágenes
   * @param {number} options.existingImagesCount - Cantidad de imágenes existentes
   * @param {number} options.newImagesCount - Cantidad de nuevas imágenes
   * @param {boolean} options.isEditing - Si estamos editando
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  const validateForm = useCallback(
    (formData, options = {}) => {
      const newErrors = {};
      const {
        checkImages = true,
        existingImagesCount = 0,
        newImagesCount = 0,
        isEditing = false,
      } = options;

      // Validar cada campo del schema
      Object.keys(schema).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName], formData);
        if (error) {
          newErrors[fieldName] = error;
        }
      });

      // Validación de imágenes (caso especial, no está en el schema)
      if (checkImages && !isEditing) {
        const totalImages = existingImagesCount + newImagesCount;
        if (totalImages === 0) {
          newErrors.imagenes = "Sube al menos una imagen";
        }
      }

      setErrors(newErrors);
      const isValid = Object.keys(newErrors).length === 0;

      return { isValid, errors: newErrors };
    },
    [schema, validateField],
  );

  /**
   * Valida un campo con debounce (para validación en tiempo real)
   * @param {string} fieldName - Nombre del campo
   * @param {*} value - Valor del campo
   * @param {Object} formData - Datos del formulario
   * @param {number} delay - Delay en ms (default: 300)
   */
  const validateFieldDebounced = useCallback(
    (fieldName, value, formData, delay = 300) => {
      // Cancelar timer anterior
      if (debounceTimers.current[fieldName]) {
        clearTimeout(debounceTimers.current[fieldName]);
      }

      debounceTimers.current[fieldName] = setTimeout(() => {
        const error = validateField(fieldName, value, formData);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [fieldName]: error };
          }
          const { [fieldName]: _, ...rest } = prev;
          return rest;
        });
      }, delay);
    },
    [validateField],
  );

  /**
   * Marca un campo como "tocado" (para mostrar errores solo después de interactuar)
   */
  const touchField = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Limpia el error de un campo específico
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Limpia todos los errores
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
    // Limpiar timers de debounce
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  }, []);

  /**
   * Establece errores manualmente (útil para errores del servidor)
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
  }, []);

  /**
   * Obtiene los errores visibles (solo de campos tocados)
   */
  const getVisibleErrors = useCallback(() => {
    return Object.keys(errors).reduce((acc, key) => {
      if (touched[key]) {
        acc[key] = errors[key];
      }
      return acc;
    }, {});
  }, [errors, touched]);

  return {
    // Estado
    errors,
    touched,

    // Validación
    validateField,
    validateForm,
    validateFieldDebounced,

    // Gestión de errores
    clearFieldError,
    clearAllErrors,
    setFieldError,
    getVisibleErrors,

    // Estado de campos
    touchField,
  };
};

export default useFormValidation;
