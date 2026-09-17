import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./styles/terminos.css";

export default function Privacidad() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="terminos-section">
      <div className="terminos-container">
        {/* Header */}
        <header className="terminos-header">
          <div className="terminos-header__icon">
            <img
              src="/img/Logo_con_r_v3.png"
              alt="Extrovertidos"
              className="terminos-header__logo"
            />
          </div>
          <h1 className="terminos-header__title">Política de Privacidad</h1>
          <p className="terminos-header__subtitle">EXTROVERTIDOS.CL</p>
        </header>

        {/* Intro */}
        <div className="terminos-content">
          <div className="terminos-intro">
            <p>
              <strong>DAMAVAL SpA</strong>, RUT 77.850.708-0 (en adelante,
              &quot;la Empresa&quot; o &quot;Extrovertidos.cl&quot;),
              domiciliada en Esfuerzo Unido 19, comuna de Molina, Región del
              Maule, Chile, en cumplimiento estricto con la Ley N° 21.719 sobre
              Protección de Datos Personales, informa a los usuarios y
              visitantes de www.extrovertidos.cl los términos bajo los cuales se
              recopila, trata, resguarda y procesa su información personal.
            </p>
          </div>

          {/* 1 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">1</span>
              Responsable del Tratamiento y Canal de Contacto
            </h2>
            <ul className="terminos-list">
              <li>
                <strong>Razón Social:</strong> DAMAVAL SpA
              </li>
              <li>
                <strong>RUT:</strong> 77.850.708-0
              </li>
              <li>
                <strong>Sitio Web:</strong> www.extrovertidos.cl
              </li>
              <li>
                <strong>
                  Correo Oficial para Ejercicio de Derechos (ARCO):
                </strong>{" "}
                <a
                  href="mailto:atencion@extrovertidos.cl"
                  className="terminos-link">
                  atencion@extrovertidos.cl
                </a>
              </li>
            </ul>
          </article>

          {/* 2 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">2</span>
              Principio de No Almacenamiento de Contraseñas ni Datos Financieros
            </h2>
            <p>
              En estricta aplicación del principio de minimización de datos:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Sin Contraseñas Propias:</strong> El inicio de sesión y
                registro se realiza exclusivamente a través del sistema federado
                Google Sign-In (Google LLC). La Empresa no tiene acceso, no
                solicita ni almacena las contraseñas personales de las cuentas
                de Google de los usuarios.
              </li>
              <li>
                <strong>Sin Datos Bancarios:</strong> Las transacciones
                correspondientes a la modalidad de publicación destacada pagada
                se efectúan íntegramente a través de pasarelas de pago externas
                autorizadas. La Empresa no recolecta ni guarda números de
                tarjetas de crédito o débito, códigos de seguridad ni
                credenciales bancarias.
              </li>
            </ul>
          </article>

          {/* 3 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">3</span>
              Datos Personales Recopilados y Fines del Tratamiento
            </h2>
            <p>
              Los datos personales recabados se limitan a lo indispensable para
              prestar el servicio informativo y de difusión:
            </p>

            <h3 className="terminos-clause__subtitle">
              a) Datos de Identificación y Perfil (vía Google Sign-In)
            </h3>
            <ul className="terminos-list">
              <li>
                <strong>Dirección de Correo Electrónico:</strong> Utilizada
                exclusivamente para la autenticación de identidad, control de
                sesiones y para motivos de comunicación directa y operativa con
                el usuario (notificaciones del estado de moderación de sus
                publicaciones, avisos técnicos, alertas de seguridad, soporte y
                facturación).
              </li>
              <li>
                <strong>Nombre completo:</strong> Utilizado para la
                individualización del usuario dentro de su panel de gestión y en
                las comunicaciones del servicio.
              </li>
              <li>
                <strong>Fotografía de perfil pública (Avatar):</strong>{" "}
                Utilizada con propósitos de personalización estética y
                usabilidad en la interfaz privada del panel de usuario.
              </li>
            </ul>

            <h3 className="terminos-clause__subtitle">
              b) Contenido de Publicaciones y Panoramas
            </h3>
            <p>
              Datos de contacto comercial (números de WhatsApp, teléfonos,
              correos comerciales o redes sociales), textos descriptivos,
              imágenes y geolocalizaciones que el usuario decide incluir
              voluntariamente al cargar su evento en la modalidad gratuita o
              destacada pagada. Al ser un portal de acceso público, el usuario
              reconoce y autoriza la exposición general de dichos datos en
              Internet.
            </p>

            <h3 className="terminos-clause__subtitle">
              c) Registros Técnicos de Navegación
            </h3>
            <p>
              Registros de servidor (logs e IPs) gestionados en el entorno de
              hosting (cPanel), conservados exclusivamente por motivos de
              trazabilidad, estabilidad y ciberseguridad.
            </p>
          </article>

          {/* 4 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">4</span>
              Base de Licitud del Tratamiento
            </h2>
            <p>
              El tratamiento de los datos personales descritos se fundamenta en
              la ejecución de medidas precontractuales o contractuales
              solicitadas por el titular (Art. 13 de la Ley N° 21.719),
              orientadas a la provisión de la cuenta de usuario, administración
              de publicaciones en sus modalidades gratuita o destacada pagada,
              moderación editorial y difusión de actividades.
            </p>
          </article>

          {/* 5 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">5</span>
              Proveedores Tecnológicos (Encargados del Tratamiento) y
              Transferencias Internacionales
            </h2>
            <p>
              Para asegurar una alta disponibilidad y seguridad informática,
              Extrovertidos.cl utiliza infraestructura tecnológica de
              proveedores que actúan en calidad de Encargados del Tratamiento:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Supabase Inc.:</strong> Gestión de bases de datos cloud
                y autenticación, con cifrado en tránsito (TLS/HTTPS) y en reposo
                (AES-256), bajo estándares de seguridad internacionalmente
                homologables a la normativa chilena.
              </li>
              <li>
                <strong>Google LLC:</strong> Servicio de inicio de sesión seguro
                (Google Sign-In) y analítica estadística disociada (Google
                Analytics).
              </li>
              <li>
                <strong>Infraestructura de Hosting (cPanel):</strong> Despliegue
                de la aplicación web y almacenamiento temporal de logs
                técnicos.
              </li>
            </ul>
          </article>

          {/* 6 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">6</span>
              Responsabilidad del Usuario sobre Datos de Terceros
            </h2>
            <p>
              El usuario anunciante declara y garantiza expresamente que cuenta
              con el consentimiento previo de los titulares en caso de
              incorporar nombres, números de contacto, teléfonos o fotografías
              de terceros en sus publicaciones de panoramas. Damaval SpA no
              responde ante requerimientos o denuncias derivadas del uso
              indebido o no autorizado de datos de terceros ingresados por los
              anunciantes.
            </p>
          </article>

          {/* 7 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">7</span>
              No Venta ni Envío de Publicidad Masiva
            </h2>
            <p>
              Damaval SpA no comercializa, no arrienda ni cede las bases de
              datos ni correos de sus usuarios a terceros. El correo electrónico
              registrado no se utilizará para el envío de campañas de correo
              basura (spam) ni publicidad comercial no solicitada de terceros
              ajenos a la operación de Extrovertidos.cl.
            </p>
          </article>

          {/* 8 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">8</span>
              Derechos de los Titulares (Derechos ARCO y Nuevos Derechos)
            </h2>
            <p>
              Conforme a la Ley N° 21.719, todo titular puede ejercer ante
              Extrovertidos.cl los siguientes derechos:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Acceso:</strong> Conocer qué datos mantiene la
                plataforma sobre su persona.
              </li>
              <li>
                <strong>Rectificación:</strong> Solicitar la modificación o
                actualización de datos inexactos o incompletos.
              </li>
              <li>
                <strong>Supresión (Cancelación / Olvido):</strong> Exigir el
                borrado definitivo de su cuenta y registros personales.
              </li>
              <li>
                <strong>Oposición:</strong> Oponerse al tratamiento de sus datos
                para fines específicos no esenciales para el servicio.
              </li>
              <li>
                <strong>Portabilidad:</strong> Solicitar la entrega de sus datos
                en un formato digital estructurado y de uso común.
              </li>
              <li>
                <strong>Bloqueo Temporal:</strong> Solicitar la suspensión
                temporal de cualquier operación sobre sus datos mientras se
                atiende un reclamo de rectificación o supresión.
              </li>
            </ul>
            <p style={{ marginTop: "16px" }}>
              Para ejercer cualquiera de estos derechos, el titular debe dirigir
              su solicitud a{" "}
              <a
                href="mailto:atencion@extrovertidos.cl"
                className="terminos-link">
                atencion@extrovertidos.cl
              </a>
              . Las solicitudes de baja definitiva de cuenta y borrado de bases
              de datos se ejecutarán en un plazo máximo de 10 días hábiles.
            </p>
          </article>

          {/* 9 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">9</span>
              Uso de Cookies
            </h2>
            <p>
              La plataforma utiliza cookies técnicas obligatorias para sostener
              la sesión activa del usuario y cookies analíticas (Google
              Analytics) para métricas de navegación de carácter disociado. El
              usuario puede deshabilitar o bloquear el uso de cookies en
              cualquier instante configurando las preferencias de su navegador
              web.
            </p>
          </article>
        </div>

        {/* Back link */}
        <div className="terminos-back">
          <Link to="/" className="terminos-back__link">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
