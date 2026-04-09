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
              src="/img/Logo_extrovertidos.png"
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
              &quot;la Empresa&quot;), bajo los principios de transparencia y
              minimización de datos establecidos en la Ley N° 19.628 sobre
              Protección de la Vida Privada, informa a sus usuarios que el
              funcionamiento de la plataforma www.extrovertidos.cl se basa en la
              integración de servicios externos de alta seguridad para proteger
              la información del usuario.
            </p>
          </div>

          {/* 1 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">1</span>
              Principio de No Almacenamiento de Datos Sensibles
            </h2>
            <p>
              La Empresa informa que NO recolecta, NO solicita y NO almacena en
              sus servidores bases de datos relacionadas con:
            </p>
            <h3 className="terminos-clause__subtitle">Contraseñas</h3>
            <p>
              El acceso se gestiona exclusivamente vía Google Sign-In. La
              Empresa solo recibe un token de autenticación, nombre y correo
              para identificar la cuenta.
            </p>
            <h3 className="terminos-clause__subtitle">Datos Financieros</h3>
            <p>
              Toda transacción económica se realiza en los servidores cifrados
              de la pasarela de pagos externa. La Empresa no tiene acceso a
              números de tarjeta, cuentas bancarias ni claves de seguridad.
            </p>
          </article>

          {/* 2 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">2</span>
              Datos Gestionados y Finalidad
            </h2>
            <p>
              Los únicos datos que se procesan son aquellos estrictamente
              necesarios para la prestación del servicio:
            </p>
            <h3 className="terminos-clause__subtitle">Identificación</h3>
            <p>
              Correo electrónico y nombre (vía Google) para gestionar sus
              publicaciones y acceso al panel.
            </p>
            <h3 className="terminos-clause__subtitle">Contenido Público</h3>
            <p>
              Información, imágenes y enlaces de contacto (WhatsApp, Redes
              Sociales) que el usuario decide publicar voluntariamente. Al ser
              un sitio de difusión, el usuario acepta que esta información será
              visible para cualquier visitante.
            </p>
            <h3 className="terminos-clause__subtitle">Estadísticas</h3>
            <p>
              Datos anónimos de navegación recolectados por Google Analytics
              para mejorar el rendimiento del sitio.
            </p>
          </article>

          {/* 3 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">3</span>
              Exención de Responsabilidad por Fallas de Terceros
            </h2>
            <p>
              Dado que la plataforma utiliza infraestructura de proveedores
              externos para funciones críticas (Google para autenticación y
              proveedores externos para pagos), el usuario acepta que:
            </p>
            <h3 className="terminos-clause__subtitle">Seguridad Externa</h3>
            <p>
              La seguridad de los datos de acceso y bancarios depende
              exclusivamente de dichos proveedores.
            </p>
            <h3 className="terminos-clause__subtitle">
              Límite de Responsabilidad
            </h3>
            <p>
              Damaval SpA no se hace responsable por filtraciones de datos,
              caídas de servicio, hackeos o vulnerabilidades técnicas que
              ocurran en los sistemas de Google, las pasarelas de pago o los
              servicios de mapas enlazados. Cualquier reclamo por dichas fallas
              deberá dirigirse al proveedor del servicio correspondiente.
            </p>
          </article>

          {/* 4 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">4</span>
              Comunicación de Datos
            </h2>
            <p>
              La Empresa no vende, arrienda ni cede datos de sus usuarios. Los
              datos de contacto del usuario solo se exponen públicamente cuando
              este los incluye por voluntad propia en un anuncio para que
              potenciales interesados le contacten.
            </p>
          </article>

          {/* 5 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">5</span>
              Derechos del Usuario (Derechos ARCO)
            </h2>
            <p>En cualquier momento, el usuario puede solicitar:</p>
            <h3 className="terminos-clause__subtitle">
              Acceso y Rectificación
            </h3>
            <p>Consultar o corregir los datos vinculados a su perfil.</p>
            <h3 className="terminos-clause__subtitle">
              Cancelación (Derecho al Olvido)
            </h3>
            <p>
              Solicitar la eliminación total de su cuenta y sus publicaciones.
              Una vez eliminada la cuenta de nuestros registros, la Empresa no
              conserva respaldos de dicha información.
            </p>
            <p>
              Para ejercer estos derechos, escriba a:{" "}
              <a
                href="mailto:atencion@extrovertidos.cl"
                className="terminos-link">
                atencion@extrovertidos.cl
              </a>
              .
            </p>
          </article>

          {/* 6 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">6</span>
              Uso de Cookies
            </h2>
            <p>
              El sitio utiliza cookies técnicas necesarias para mantener la
              sesión del usuario activa y cookies de terceros (Google Analytics)
              para análisis estadístico. El usuario puede bloquearlas desde la
              configuración de su navegador.
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
