-- ============================================
-- CULTURA MAULE - MODELO DE BASE DE DATOS
-- Simple, Escalable y Fácil de Mantener
-- ============================================
-- Nota: este archivo representa el esquema base/documentacion.
-- En una base Supabase ya existente, aplica cambios con archivos en supabase/migrations/
-- en lugar de ejecutar CREATE TYPE / CREATE TABLE manualmente por partes.

-- ============================================
-- 1. TIPOS ENUMERADOS (ENUMs)
-- ============================================
-- Los ENUMs garantizan que solo se guarden valores válidos.
-- Más eficientes que strings y previenen errores de tipeo.

-- Tipo de usuario: persona natural o empresa
CREATE TYPE user_type AS ENUM ('persona', 'empresa');

-- Provincias del Maule (solo 4 opciones válidas)
CREATE TYPE provincia AS ENUM ('curico', 'talca', 'linares', 'cauquenes');

-- Estado del evento en su ciclo de vida
-- borrador → en_revision → publicado/rechazado
CREATE TYPE event_status AS ENUM ('borrador', 'en_revision', 'publicado', 'rechazado');

-- Tipo de entrada para el evento
CREATE TYPE ticket_type AS ENUM (
  'gratis',
  'gratuito',
  'sin_entrada',
  'info_descripcion',
  'pagado',
  'externo',
  'venta_externa'
);


-- ============================================
-- 2. TABLA: profiles (Perfiles de Usuario)
-- ============================================
-- Extiende auth.users de Supabase con datos adicionales.
-- Se crea automáticamente cuando un usuario se registra.

CREATE TABLE profiles (
  -- UUID que coincide con auth.users.id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos básicos del perfil
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  avatar_url TEXT,
  
  -- Tipo de cuenta
  tipo_usuario user_type DEFAULT 'persona',
  
  -- Campos solo para empresas (NULL si es persona)
  razon_social VARCHAR(200),
  rut_empresa VARCHAR(12),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX idx_profiles_email ON profiles(email);

COMMENT ON TABLE profiles IS 'Perfiles de usuario extendidos. Se sincroniza con auth.users';
COMMENT ON COLUMN profiles.tipo_usuario IS 'persona = usuario común, empresa = cuenta comercial';
COMMENT ON COLUMN profiles.razon_social IS 'Solo para empresas - nombre legal';
COMMENT ON COLUMN profiles.rut_empresa IS 'Solo para empresas - RUT con dígito verificador';


-- ============================================
-- 3. TABLA: categories (Categorías)
-- ============================================
-- Categorías principales para clasificar eventos.
-- Tabla simple de lookup - rara vez cambia.

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  icono VARCHAR(50),  -- nombre del ícono (ej: 'music', 'theater')
  color VARCHAR(7),   -- color hex (ej: '#FF6600')
  orden INT DEFAULT 0, -- para ordenar en el frontend
  activo BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE categories IS 'Categorías principales de eventos (Música, Teatro, etc.)';


-- ============================================
-- 4. TABLA: tags (Etiquetas)
-- ============================================
-- Etiquetas complementarias reutilizables.
-- Permiten filtros adicionales (#PetFriendly, #Familiar, etc.)

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'Etiquetas complementarias reutilizables para eventos';


-- ============================================
-- 5. TABLA: events (Eventos/Panoramas)
-- ============================================
-- Tabla central de la aplicación.
-- Diseño plano (sin sub-tablas innecesarias) para simplicidad.

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quién creó el evento
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- === INFORMACIÓN BÁSICA ===
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  organizador VARCHAR(100),  -- texto libre, puede diferir del usuario
  
  -- === CATEGORIZACIÓN ===
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  
  -- === TEMPORALIDAD ===
  fecha_evento DATE NOT NULL,        -- también es fecha de expiración
  hora_inicio TIME,
  hora_fin TIME,
  
  -- === UBICACIÓN ===
  provincia provincia NOT NULL,
  comuna VARCHAR(50) NOT NULL,
  direccion VARCHAR(200),
  coordenadas GEOGRAPHY(Point, 4326), -- lat/lng para mapas
  
  -- === IMÁGENES ===
  -- Array simple de URLs. Máximo 3 imágenes.
  imagenes TEXT[] DEFAULT '{}',
  
  -- === TIPO DE ENTRADA ===
  tipo_entrada ticket_type DEFAULT 'sin_entrada',
  precio INT,                -- solo si tipo_entrada = 'pagado' (en CLP)
  url_venta TEXT,            -- solo si tipo_entrada = 'venta_externa'
  
  -- === CONTACTO Y REDES ===
  -- JSONB flexible: {"instagram": "@cuenta", "whatsapp": "+56..."}
  redes_sociales JSONB DEFAULT '{}',
  
  -- === ESTADO Y MODERACIÓN ===
  estado event_status DEFAULT 'borrador',
  motivo_rechazo TEXT,       -- razón si fue rechazado
  
  -- === AUDITORÍA ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ   -- cuándo se aprobó
);

-- Índices para consultas frecuentes
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_estado ON events(estado);
CREATE INDEX idx_events_fecha ON events(fecha_evento);
CREATE INDEX idx_events_provincia ON events(provincia);
CREATE INDEX idx_events_categoria ON events(category_id);

-- Índice espacial para búsquedas por ubicación
CREATE INDEX idx_events_geo ON events USING GIST(coordenadas);

COMMENT ON TABLE events IS 'Tabla central - Eventos/Panoramas publicados';
COMMENT ON COLUMN events.fecha_evento IS 'Fecha del evento. Eventos pasados no se muestran';
COMMENT ON COLUMN events.imagenes IS 'Array de URLs. Máximo 3 imágenes';
COMMENT ON COLUMN events.redes_sociales IS 'JSON flexible: {"instagram": "@x", "facebook": "url"}';
COMMENT ON COLUMN events.coordenadas IS 'Punto geográfico SRID 4326 para mapas';


-- ============================================
-- 6. TABLA: event_tags (Relación N:M)
-- ============================================
-- Conecta eventos con etiquetas. Máximo 10 por evento.

CREATE TABLE event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

COMMENT ON TABLE event_tags IS 'Relación muchos a muchos entre eventos y etiquetas';


-- ============================================
-- 7. FUNCIONES AUXILIARES
-- ============================================

-- Actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_events_updated
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que crea perfil al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Seguridad a nivel de fila - cada usuario solo ve/edita lo suyo.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===

-- Cualquiera puede ver perfiles públicos
CREATE POLICY "Perfiles visibles públicamente"
  ON profiles FOR SELECT
  USING (true);

-- Solo el dueño puede editar su perfil
CREATE POLICY "Usuario edita su perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- === EVENTS ===

-- Ver eventos publicados (público) o propios (cualquier estado)
CREATE POLICY "Ver eventos públicos o propios"
  ON events FOR SELECT
  USING (
    estado = 'publicado' 
    OR user_id = auth.uid()
  );

-- Solo usuarios autenticados pueden crear eventos
CREATE POLICY "Crear eventos autenticado"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede editar (y solo si no está publicado)
CREATE POLICY "Editar eventos propios"
  ON events FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND estado IN ('borrador', 'rechazado')
  );

-- Solo el dueño puede eliminar borradores
CREATE POLICY "Eliminar borradores propios"
  ON events FOR DELETE
  USING (
    user_id = auth.uid() 
    AND estado = 'borrador'
  );

-- === EVENT_TAGS ===

-- Ver tags de eventos visibles
CREATE POLICY "Ver tags de eventos"
  ON event_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND (estado = 'publicado' OR user_id = auth.uid())
    )
  );

-- Gestionar tags de eventos propios
CREATE POLICY "Gestionar tags propios"
  ON event_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND user_id = auth.uid()
    )
  );


-- ============================================
-- 9. TABLA: subscriptions (Suscripciones)
-- ============================================
-- Registra planes contratados por los usuarios.
-- Controla acceso a publicaciones y funciones premium.

-- Tipo de plan contratado
CREATE TYPE plan_type AS ENUM (
  'panorama_unica',     -- Publicación Única ($25.000)
  'panorama_pack4',     -- Pack 4 Publicaciones ($39.990)
  'panorama_ilimitado', -- Sin Límite ($70.000)
  'superguia'           -- Superguía Negocios ($15.000)
);

-- Estado de la suscripción
CREATE TYPE subscription_status AS ENUM (
  'pendiente',   -- Pago iniciado, aún no confirmado
  'activa',      -- Pago confirmado, plan vigente
  'expirada',    -- Pasó la fecha de vencimiento
  'cancelada',   -- Cancelada por el usuario o admin
  'rechazada'    -- Pago rechazado por el procesador
);

-- Método de pago utilizado
CREATE TYPE payment_method AS ENUM (
  'webpay',        -- Transbank Webpay
  'transferencia', -- Transferencia bancaria
  'mock'           -- Pago simulado (desarrollo)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Datos del plan
  plan plan_type NOT NULL,
  estado subscription_status DEFAULT 'pendiente',
  monto INT NOT NULL,  -- Monto en CLP

  -- Vigencia
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  -- Control de publicaciones
  publicaciones_total INT DEFAULT 0,
  publicaciones_usadas INT DEFAULT 0,

  -- Datos de pago
  metodo_pago payment_method,
  transaccion_id VARCHAR(100),
  detalles_pago JSONB DEFAULT '{}',
  
  -- Notas internas (admin)
  notas TEXT,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints anti pagos fantasmas
  CONSTRAINT chk_monto_positivo CHECK (monto > 0),
  CONSTRAINT chk_publicaciones_no_excede CHECK (publicaciones_usadas <= publicaciones_total),
  CONSTRAINT chk_publicaciones_no_negativas CHECK (publicaciones_total >= 0 AND publicaciones_usadas >= 0),
  CONSTRAINT chk_activa_tiene_datos_pago CHECK (
    estado != 'activa' OR (fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL AND metodo_pago IS NOT NULL)
  ),
  CONSTRAINT chk_fechas_coherentes CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin > fecha_inicio),
  -- NOTA: chk_monto_coincide_plan fue ELIMINADO por migración 20260220_manage_plan_prices.sql
  -- Los precios ahora son dinámicos y se leen de app_settings.plan_prices
  CONSTRAINT chk_publicaciones_coherentes CHECK (
    (plan = 'panorama_unica' AND publicaciones_total = 1)
    OR (plan = 'panorama_pack4' AND publicaciones_total = 4)
    OR (plan = 'panorama_ilimitado' AND publicaciones_total = 0)
    OR (plan = 'superguia' AND publicaciones_total = 1)
  ),
  CONSTRAINT uq_transaccion UNIQUE (transaccion_id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_estado ON subscriptions(estado);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_fecha_fin ON subscriptions(fecha_fin);
CREATE INDEX idx_subscriptions_user_activa ON subscriptions(user_id, estado) 
  WHERE estado = 'activa';

CREATE TRIGGER tr_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE subscriptions IS 'Suscripciones/planes contratados por los usuarios';
COMMENT ON COLUMN subscriptions.monto IS 'Monto en CLP sin decimales';
COMMENT ON COLUMN subscriptions.publicaciones_total IS 'Total de publicaciones incluidas en el plan';
COMMENT ON COLUMN subscriptions.publicaciones_usadas IS 'Publicaciones ya utilizadas';

-- RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus suscripciones"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean suscripciones pendientes"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND estado = 'pendiente');

CREATE POLICY "Staff ve todas las suscripciones"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admin actualiza suscripciones"
  ON subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

CREATE POLICY "Admin elimina suscripciones"
  ON subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );


-- ============================================
-- 10. DATOS INICIALES (Seeds)
-- ============================================

-- Categorías base
INSERT INTO categories (nombre, icono, color, orden) VALUES
  ('Música', 'music', '#FF6600', 1),
  ('Teatro', 'theater', '#9C27B0', 2),
  ('Deportes', 'sports', '#4CAF50', 3),
  ('Gastronomía', 'restaurant', '#FF5722', 4),
  ('Arte', 'palette', '#E91E63', 5),
  ('Familia', 'family', '#2196F3', 6),
  ('Educación', 'school', '#607D8B', 7),
  ('Fiestas', 'celebration', '#FFEB3B', 8);

-- Etiquetas comunes
INSERT INTO tags (nombre) VALUES
  ('Familiar'),
  ('Juvenil'),
  ('Adultos'),
  ('PetFriendly'),
  ('Accesible'),
  ('AlAireLibre'),
  ('Nocturno'),
  ('Gratuito'),
  ('Imperdible'),
  ('NuevoEnLaZona');
