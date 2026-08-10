# Revisión y plan — Rediseño del flujo de publicación + Home consolidado

Documento de revisión previa al merge. Consolida la revisión UX/UI y la revisión de arquitectura frontend, las decisiones de producto tomadas, y el plan de implementación por fases.

**Fecha:** 2026-08-10
**Estado:** revisión completada, pendiente de implementación

---

## 1. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| D1 | Navbar | Se conservan logo, botón "Crear publicación", avatar/menú de usuario, notificaciones y acceso a `/admin` para admin/moderator. Se eliminan los links de secciones. |
| D2 | Flujo de creación | **Pantalla única** en `/crear-publicacion` con 3 tarjetas: Panorama gratuito / Panorama destacado / Negocio. Se descarta el doble gate secuencial. |
| D3 | Panorama gratuito | Sin plan y **sin consumir cupo** de suscripción. Campos limitados. |
| D4 | Panorama destacado | Formulario completo actual. Pago vía Webpay ya integrado (`publicacion_destacada`, $10.000). |
| D5 | Negocio destacado | **De pago vía Webpay.** Requiere migración + rama nueva en las 3 edge functions. |
| D6 | Toggle admin | **Global + por ítem**: switch general de destacados (panoramas y negocios) más la capacidad de destacar/degradar ítems puntuales desde el panel. |
| D7 | Rutas `/panoramas` y `/superguia` | **Redirect a `/`**. No se eliminan: hay links duros en Footer, Secciones, Admin y compartidos por usuarios. |
| D8 | Filtros del Home | **Dos filtros independientes** por sección, con query params namespaced (`?p_ciudad=`, `?sg_ciudad=`). |
| D9 | Carrusel | El hero de `/panoramas` (`panoramas-page__hero`) pasa al tope del Home; el buscador/selector de ciudad del Home baja a la sección de panoramas. Intercambio, no eliminación. |

---

## 2. Estado de partida: lo que ya existe

El sistema de destacados **ya está implementado end-to-end para panoramas**. No hay que construirlo, hay que reubicarlo y extenderlo.

| Pieza | Ubicación |
|---|---|
| `PUBLICATION_TYPES = { NORMAL, DESTACADA }` | `src/components/Home/Panorama/constants/index.js:118-123` |
| Columna `events.tipo_publicacion` + CHECK + índice | `supabase/migrations/202607110001_add_tipo_publicacion.sql:8-21` |
| Precio `publicacion_destacada: 10000` en `app_settings.plan_prices` | misma migración, `:33-51` |
| Toggle global `destacadas_enabled` (default `true`) | `src/lib/database/settings.js:74, 203-218` |
| Modal de selección con 2 tarjetas | `src/components/Home/Panorama/components/PublicationTypeModal.jsx` |
| Pago Webpay | `src/lib/payment.js:110-154` + `supabase/functions/create-payment/index.js:219-330` |
| Conciliación (aprobado → `pendiente`; rechazado → borra borrador) | `supabase/functions/confirm-payment/index.js:97-155, 643-648` |
| Render destacado | `PublicationCard.jsx:130-133`, `PanoramasPage.jsx:510-517, 1131-1150` |

**Negocios no tienen nada de esto.** `businesses` carece de columna de destacado; lo más parecido es `verificado` (`BusinessCard.jsx:468-469`), que es semántica distinta y **no debe reutilizarse**.

---

## 3. Hallazgos bloqueantes

### B1 — Mobile pierde el acceso a la sesión
`navbar.css:745-747` oculta `.navbar-user-section` a ≤768px. En móvil, perfil, admin, login y logout viven **únicamente** dentro del panel hamburguesa (`Navbar.jsx:217-281`). Eliminar los links sin preservar ese panel deja el celular sin forma de iniciar o cerrar sesión.

**Mitigación:** el hamburguesa se conserva en móvil con la sesión y el acceso admin; solo se le quitan los links de secciones.

### B2 — El plan gratuito viola el schema de validación vigente
`EVENT_VALIDATION_SCHEMA` (`useFormValidation.js:19-130`) exige `organizador`, `direccion`, `tipo_entrada` y `etiqueta_directa`, ninguno presente en el set gratuito (título, descripción, imagen, fecha, ciudad, comuna, redes FB/TikTok, categoría). `validateForm` corre incondicionalmente en `useEventSubmit.js:240-246`.

Agravante: `useEventSubmit.js:147-150, 172-174` hace `formData.organizador.trim()` y `formData.direccion.trim()` **sin optional chaining** → `TypeError` en runtime, no error de validación.

**Mitigación:** Fase 1 y Fase 2 del plan.

### B3 — La validación está triplicada
Las mismas reglas están implementadas tres veces:
1. `useFormValidation.js:19-130` — schema declarativo (el que corre en submit).
2. `PublicarForm.jsx:61-135` — `getMissingFields()`, `switch` manual por paso.
3. `PublicarForm.jsx:138-192` — `isStepValid()`, tercera copia para el stepper.

Introducir campos por plan sin unificar esto multiplica cada regla nueva por tres. **Es el paso de mayor ROI y debe ir antes que cualquier lógica de plan.**

### B4 — `/crear-publicacion` bloquearía a admins y moderadores
`UserOnlyRoute.jsx:8` define `ADMIN_ALLOWED_PATHS = ["/publicar-panorama", "/publicar-negocio"]`, comparado por **igualdad exacta** de `location.pathname` (`:32`). La ruta nueva no está en la lista → admin/moderator redirigidos a `/admin` (`:35-37`). Admins sí publican hoy (`AdminPanel.jsx:587, 593`). Con sub-rutas, la igualdad exacta falla.

**Mitigación:** añadir la ruta a la lista y cambiar la comparación a `startsWith` o a un matcher.

### B5 — El admin no puede cambiar `tipo_publicacion` (D6 lo requiere)
El campo no está en `ALLOWED_EVENT_UPDATE_FIELDS` ni en `ADMIN_ONLY_EVENT_FIELDS` (`events.js:508-547`); `updateEvent` filtra por whitelist (`:562-573`) y descarta el cambio en silencio. `AdminPublicationsList.jsx:362-363` solo muestra el badge. La promesa de `PublicationTypeModal.jsx:227` ("podrás cambiarlo desde el panel Admin") es hoy incumplible.

Riesgo asociado: `ALLOWED_BUSINESS_UPDATE_FIELDS` (`businesses.js:529-560`) **no distingue admin de usuario**. Añadir ahí el campo de destacado permitiría que cualquier usuario se auto-destaque editando su negocio. Hay que replicar primero el patrón `ADMIN_ONLY_*` de `events.js:547` en `businesses.js`.

### B6 — Colisión de `?highlight=` en el Home consolidado
`PanoramasPage.jsx:840-849` (prefix `publication-card`) y `SuperguiaContainer.jsx:684-693` (prefix `business-card`) leen el **mismo** query param vía `useHighlightCard`. Montados juntos, el que no resuelva el id **resetea todos sus filtros y su paginación** como efecto colateral, y ambos compiten por `scrollIntoView`. Los moderadores generan estos links desde `AdminPublicationsList.jsx:413, 564` apuntando a `/panoramas?highlight=…`, que con D7 redirige a `/`.

### B7 — Apagar el toggle oculta contenido ya pagado
En `PanoramasPage.jsx:510-517`, con `destacadasEnabled = false` las destacadas no entran en `destacadas` **ni en `normales`** (ese filtro exige `tipo_publicacion === 'normal'`): desaparecen de la grilla. Además `PublicationCard.jsx:133` sigue pintando el borde dorado porque lee la columna directo. Extender el toggle a negocios replicaría el bug.

**Decisión requerida:** apagar el toggle debe **degradar a normal** en la vista, no ocultar.

---

## 4. Hallazgos altos

- **Queries y realtime duplicados en el Home consolidado.** `PanoramasPage.jsx:214-218` y `SuperguiaContainer.jsx:280-284` cargan **ambos** datasets: `getPublishedEvents` y `getPublishedBusinesses` correrían dos veces cada una, con **4 canales realtime sobre 2 tablas** (`PanoramasPage.jsx:233-264`, `SuperguiaContainer.jsx:289-320`) y doble refetch por cada evento. Además `SuperguiaContainer.jsx:252` baraja su copia con `Math.random()`, así que las dos listas de negocios divergen en orden y no son compartibles tal cual.
- **El borrador local no persiste el plan.** `usePublicarFormV2.js:397-422` guarda `formData` con debounce; si el plan vive en `useState` externo, al recargar se restauran los datos **sin plan**. El plan debe vivir **dentro de `formData`**.
- **Drafts legacy sin plan.** `useDraftManager.js:136-151` serializa `{...formData}`; los drafts existentes no tienen el campo. Default obligatorio: el plan más restrictivo (gratuito), y re-mostrar el selector al reanudar.
- **Cadena de pago event-only.** `payment.js:110-154` exige `eventId`; `create-payment/index.js:251-292` valida contra `events`; `confirm-payment` mueve/borra filas de `events`. D5 obliga a tocar las tres.
- **`/activar-plan` solo es alcanzable desde la navbar** (`Navbar.jsx:32-38`) y desde modales de bloqueo. Verificar que siga siendo descubrible.
- **`/faq` ya está huérfano**: ruta registrada en `App.jsx:102`, cero enlaces en la app.
- **Proyecto sin tipos ni tests.** No hay `tsconfig.json`, ni `.ts/.tsx`, ni test runner. El refactor toca el contrato de `formData`, el schema de validación y el payload de submit sin red de seguridad. Toda la protección viene del diseño (schema único).

---

## 5. Hallazgos medios y bajos

- `database/schema.sql` está severamente desactualizado: sin `businesses`, `app_settings`, `subscriptions` en su forma actual, `tipo_publicacion`, `publication_expires_at` ni `is_paused`. No sirve como fuente de verdad para planear migraciones.
- `getPlansVisibility()` (`settings.js:111-132`) dispara 4 queries sin caché y se invoca desde 5 sitios; en el Home consolidado se multiplica. Existe `cache.js` sin usar aquí.
- Downgrade destacado → gratuito deja datos premium huérfanos: `prepareEventData` (`useEventSubmit.js:136-193`) seguiría enviándolos. Sanear en ese único punto.
- `isDirty` (`Publicar.jsx:136-162`) itera `Object.keys(INITIAL_FORM_STATE)`: si el plan entra al estado inicial, elegirlo marcará el formulario como sucio sin que el usuario escriba nada. Excluir la clave.
- `resetForm` (`usePublicarFormV2.js:634-640`) borraría el plan elegido.
- `Secciones.jsx` queda sin datos tras eliminar el texto de superguía (su `sectionsData` tiene una sola entrada; la de panoramas ya está comentada en `:14-25`). Desmontarlo de `Home.jsx:125`.
- `leaflet` + `react-leaflet` (`LocationPicker.jsx:17-19`) **no están en `manualChunks`** (`vite.config.js:16-25`). Hoy quedan aislados porque el formulario es lazy. Mantener el flujo de publicación estrictamente `lazy()` o entran ~150 KB al arranque.
- **Bug preexistente:** `PerfilBorradores.jsx:72` navega a `/agregar-negocio`, ruta **no registrada** en `App.jsx`. Los borradores de negocio ya están rotos.
- El handoff de borradores usa `sessionStorage["draftToLoad"]` (`PerfilBorradores.jsx:68` → `useDraftManager.js:71-91`) y la clave **se borra en la primera lectura** (`:80`). Un redirect intermedio en `/crear-publicacion` puede consumirla antes de llegar al formulario.
- El parámetro de edición real es **`?editar=`**, no `?edit=` (`useEventEditor.js:72`). El selector no debe aparecer en modo edición (hoy `Publicar.jsx:69-73` ya lo evita).
- El texto del toggle admin (`AdminDashboard.jsx:348-355`) menciona explícitamente "Panoramas Destacados"; debe reescribirse al cubrir negocios.

---

## 6. Migraciones necesarias

Todas compatibles con datos existentes. Van en `supabase/migrations/` con timestamp; **no** se edita `database/schema.sql`.

| # | Migración | Compatibilidad |
|---|---|---|
| M1 | `businesses.tipo_publicacion TEXT NOT NULL DEFAULT 'normal'` + CHECK `IN ('normal','destacada')` + índice. Mismo nombre y valores que `events` para compartir lógica de render. | Segura: el DEFAULT rellena filas existentes (mismo patrón que `202607110001…:8-29`). `getPublishedBusinesses()` hace `select("*")` (`businesses.js:41-47`), así que la columna llega sola a tarjetas y modal. |
| M2 | Merge de `negocio_destacado` en `app_settings.plan_prices`. | Segura con el patrón idempotente `COALESCE` de `202607110001…:46-51` (no pisa claves existentes). |
| M3 | `app_settings ← destacados_negocios_enabled = false` con `ON CONFLICT DO NOTHING`. | Segura y conservadora: nada la lee aún. |
| M4 | Tercer valor en el CHECK de `events.tipo_publicacion` si "gratuito" (D3) se modela como estado propio. | Requiere DROP + ADD del constraint (patrón ya usado en `202607110001…:12-17`) y backfill a `'normal'`. |

**Pendiente de definir en M4:** si "gratuito" es un valor nuevo (`'gratuita'`) o se reutiliza `'normal'` relajando la validación de plan. Hoy `normal` significa "consume cupo de suscripción" (`useEventSubmit.js:256-299` llama `validateAndConsumePublication`), lo que contradice D3.

---

## 7. Plan de implementación por fases

Cada fase es deployable y reversible por separado.

### Fase 0 — Prerrequisitos (sin cambios visibles)
1. Arreglar `PerfilBorradores.jsx:72` (`/agregar-negocio` → ruta real).
2. Añadir `tipo_publicacion` a `ADMIN_ONLY_EVENT_FIELDS` (`events.js:547`) y crear el patrón admin-only equivalente en `businesses.js`. **(Habilita D6.)**
3. Meter `getPlansVisibility()` bajo `cache.js` con TTL corto.

### Fase 1 — Unificar la validación (sin cambio funcional)
4. Derivar `getMissingFields` e `isStepValid` de `EVENT_VALIDATION_SCHEMA`, eliminando las dos copias manuales de `PublicarForm.jsx`. **Resuelve B3. Sin esto, todo lo demás triplica bugs.**
5. Blindar `prepareEventData` (`useEventSubmit.js:136-193`) con `?.` en `organizador`, `comuna`, `direccion`, `titulo`, `descripcion`. **Resuelve el TypeError de B2.**

### Fase 2 — Plan por publicación (panoramas)
6. Añadir `PUBLICATION_PLANS` a `constants/index.js` con la lista de campos por plan; `useFormValidation` recibe el plan y **filtra el schema** antes de iterar (`:214`). El motor de reglas condicionales ya existe (`:163-165`), no hay que inventarlo.
7. El plan vive **dentro de `formData`** (persistencia gratis en las 3 capas de draft), con default gratuito, excluido del cálculo de `isDirty`.
8. Drafts legacy sin plan: default restrictivo + re-mostrar selector.
9. Desactivar `PlanBlockModal` para la rama gratuita (`Publicar.jsx:188-201`, `detectBlockScenario`). **Implementa D3.**
10. Whitelist de redes sociales para el plan gratuito: `SocialInputs.jsx:18-68` hoy renderiza 7 redes + sitio web sin gating.

### Fase 3 — Rutas y Navbar
11. Crear `/crear-publicacion` (lazy) con la pantalla única de 3 tarjetas (D2).
12. Añadirla a `ADMIN_ALLOWED_PATHS` y cambiar la comparación a `startsWith`. **Resuelve B4.**
13. **Mantener** `/publicar-panorama` y `/publicar-negocio` registradas, aceptando el plan por query o `location.state`. Preserva `?editar=`, drafts, retornos de pago y los CTAs internos (6+ referencias).
14. Simplificar `NAV_LINKS` (`Navbar.jsx:27-39`) y el dropdown (`:359-373`), conservando en móvil la sesión y el acceso admin. **Resuelve B1. Implementa D1.**

### Fase 4 — Negocios destacados
15. Migraciones M1–M3.
16. UI "Destacar mi negocio" en `PublicarNegocio` + reflejo en `BusinessCard` y `BusinessModal`.
17. Rama `negocio_destacado` en `create-payment` (análoga a `handleDestacadaPayment`, `:219-330`) y `activate/discard` sobre `businesses` en `confirm-payment` (`:100-155`). **Implementa D5.**
18. Segundo toggle en `AdminDashboard` + campo en `getPlansVisibility()` y en `usePlansVisibility.INITIAL_STATE` (`:17-25`, evita flash con `undefined`).
19. Controles por ítem en el panel admin (destacar/degradar). **Completa D6.**
20. Corregir B7: apagar el toggle **degrada a normal**, no oculta.

### Fase 5 — Home consolidado (la más arriesgada; detrás de flag)
21. Extraer la carga de datos a un contenedor común: una sola llamada a `getPublishedEvents`/`getPublishedBusinesses` y un solo par de canales realtime.
22. Resolver B6 con namespacing de `?highlight=` o un único resolvedor.
23. Filtros namespaced `?p_ciudad=` / `?sg_ciudad=` (D8); retirar el `window.scrollTo` de mount de `SuperguiaContainer.jsx:135-139`.
24. Intercambio del carrusel (D9): hero de `PanoramasPage` al tope del Home; buscador del Home a la sección de panoramas. Esto **preserva** el productor de `?ciudad=` y `CityContext` en lugar de dejarlo huérfano.
25. Retirar los textos especificados y desmontar `Secciones.jsx`.
26. Estado vacío único (hoy son dos pitches a pantalla completa apilados).
27. Convertir `/panoramas` y `/superguia` en redirects (D7).

---

## 8. Riesgos aceptados y pendientes

- **Sin tests ni tipos.** La verificación de cada fase es manual. Se recomienda validar en navegador al cierre de cada fase, especialmente Fase 1 (refactor de validación sin cambio funcional esperado).
- **M4 sin definir**: modelado de "gratuito" como valor propio vs `'normal'` relajado.
- **Reembolso/compensación** si se apaga el toggle con contenido pagado vigente: no definido.
- **`database/schema.sql` desactualizado**: conviene actualizarlo en una tarea aparte; hoy induce a error a quien planifique la BD.
- **Bundle**: mantener el flujo de publicación estrictamente lazy para no arrastrar `leaflet` al arranque.
