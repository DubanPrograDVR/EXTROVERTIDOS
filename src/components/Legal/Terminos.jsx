import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./styles/terminos.css";

export default function Terminos() {
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
          <h1 className="terminos-header__title">
            Términos y Condiciones de Uso
          </h1>
          <p className="terminos-header__subtitle">EXTROVERTIDOS.CL</p>
        </header>

        {/* Intro */}
        <div className="terminos-content">
          <div className="terminos-intro">
            <p>
              <strong>DAMAVAL SpA</strong>, RUT 77.850.708-0, domiciliada en
              Esfuerzo Unido 19, comuna de Molina, Región del Maule, Chile, es
              la titular exclusiva de los derechos de propiedad intelectual,
              software y marca de la plataforma denominada
              &quot;EXTROVERTIDOS.CL&quot;. El uso de imágenes, tipografías y
              elementos de diseño de terceros por parte de la empresa se realiza
              bajo licencias comerciales vigentes conforme a la Ley N° 17.336
              sobre Propiedad Intelectual.
            </p>
          </div>

          {/* 1 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">1</span>
              Aspectos Generales y Aceptación
            </h2>
            <p>
              Bienvenido a www.extrovertidos.cl. Al acceder y utilizar este
              sitio web, usted acepta de manera íntegra y sin reservas estos
              Términos y Condiciones. De conformidad con la Ley N° 19.799 sobre
              Documentos Electrónicos, el uso de la plataforma y la marcación de
              casillas de aceptación electrónica constituyen un contrato
              vinculante, otorgando plena validez legal al consentimiento
              manifestado por medios digitales entre el usuario y Damaval SpA.
            </p>
          </article>

          {/* 2 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">2</span>
              Naturaleza del Servicio y Enlaces Externos
            </h2>
            <p>
              La Plataforma opera exclusivamente como un canal de difusión
              publicitaria e informativa, sujeta a los marcos regulatorios de la
              Ley N° 19.496 sobre Protección de los Derechos de los
              Consumidores.
            </p>
            <h3 className="terminos-clause__subtitle">
              Enlaces y Contenido Externo
            </h3>
            <p>
              El usuario puede incluir en su publicación enlaces a sitios web,
              redes sociales, botones de pago, chats de WhatsApp, números
              telefónicos y geolocalización (Google Maps). Damaval SpA no
              controla, supervisa ni responde por el contenido, la seguridad, la
              privacidad ni las transacciones comerciales que se realicen en
              dichos medios externos.
            </p>
            <h3 className="terminos-clause__subtitle">
              Responsabilidad por Contenidos
            </h3>
            <p>
              El usuario que publica es el único responsable de la veracidad,
              integridad y legalidad de la información e imágenes incluidas.
              Damaval SpA no asume responsabilidad por la exactitud de las
              publicaciones de terceros.
            </p>
            <h3 className="terminos-clause__subtitle">Indemnidad</h3>
            <p>
              El usuario asumirá la totalidad de los costos de defensa legal y
              honorarios de abogados en caso de que Damaval SpA se vea
              involucrada en un litigio por causa de su publicación o
              incumplimiento.
            </p>
          </article>

          {/* 3 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">3</span>
              Registro y Acceso Exclusivo (Google Sign-In)
            </h2>
            <h3 className="terminos-clause__subtitle">Método de Ingreso</h3>
            <p>
              El registro y acceso se realiza exclusivamente a través de Google
              Sign-In. El usuario autoriza el acceso a su nombre, correo y foto
              de perfil conforme a la Ley N° 19.628.
            </p>
            <h3 className="terminos-clause__subtitle">Eliminación de Cuenta</h3>
            <p>
              Para dar de baja una cuenta, el usuario deberá solicitarlo
              formalmente al correo{" "}
              <a
                href="mailto:atencion@extrovertidos.cl"
                className="terminos-link">
                atencion@extrovertidos.cl
              </a>
              . Damaval SpA procesará la eliminación en un plazo máximo de 10
              días hábiles.
            </p>
          </article>

          {/* 4 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">4</span>
              Estructura de Secciones y Vigencia
            </h2>
            <h3 className="terminos-clause__subtitle">Sección Panoramas</h3>
            <p>
              Eventos con fecha específica. La publicación será eliminada
              automáticamente a las 00:00 horas del día siguiente al día de la
              fecha de realización del evento registrada en el formulario.
            </p>
            <p>
              La sección Panoramas cuenta con un botón reacción llamado
              &quot;Imperdible&quot;, solo con fines de informar interés. Esta
              reacción no compromete participación ni compromiso frente al
              evento publicado.
            </p>
            <h3 className="terminos-clause__subtitle">
              Sección Superguia Extrovertidos
            </h3>
            <p>
              Directorio comercial con vigencia de un año (365 días) desde su
              puesta en línea. Al cumplirse el plazo, el anuncio caduca
              automáticamente.
            </p>
            <p>
              La sección Superguia Extrovertidos cuenta con un botón llamado
              &quot;Recomendado&quot; solo con fines de informar interés. Esta
              reacción no compromete participación, ni compromiso frente a la
              publicación señalada.
            </p>
          </article>

          {/* 5 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">5</span>
              Gestión y Control de Publicaciones (Panel de Usuario)
            </h2>
            <p>
              Desde su perfil, el usuario podrá realizar las siguientes acciones
              sobre una publicación activa:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Editar:</strong> Realizar los cambios necesarios. No se
                permite modificar la fecha del evento en la sección Panoramas.
                Toda edición requiere una nueva revisión y aprobación de
                Extrovertidos.cl antes de volver a estar visible.
              </li>
              <li>
                <strong>Pausar/Reanudar:</strong> El usuario podrá ocultar
                temporalmente su publicación de la vista pública y volver a
                ponerla en línea cuando lo estime conveniente dentro del periodo
                de vigencia original.
              </li>
              <li>
                <strong>Eliminar:</strong> El usuario podrá eliminar su
                publicación definitivamente. Esta acción no otorga derecho a
                reembolso ni reposición de cupo ocupado, conforme al Art. 3 bis
                letra b) de la Ley N° 19.496.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">
              5.1. Función &quot;Imperdible&quot;
            </h3>
            <p>
              La plataforma permite que usuarios registrados reaccionen a las
              publicaciones mediante el botón &quot;Imperdible&quot;. Esta
              función tiene carácter meramente informativo y social. Damaval SpA
              no se hace responsable por la cantidad, veracidad o interpretación
              de estas reacciones, ni garantiza que representen la calidad real
              del servicio o evento anunciado.
            </p>
          </article>

          {/* 6 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">6</span>
              Política de Contenido y Prohibiciones Específicas
            </h2>
            <h3 className="terminos-clause__subtitle">
              6.1. Responsabilidad de Materiales
            </h3>
            <p>
              El usuario garantiza tener todos los derechos y licencias
              necesarios para utilizar las imágenes y textos incluidos. Damaval
              SpA no se hace responsable por infracciones a la Ley N° 17.336
              cometidas por los usuarios.
            </p>
            <h3 className="terminos-clause__subtitle">
              6.2. Categorías de Contenido Prohibido
            </h3>
            <p>
              Se prohíbe terminantemente la publicación de contenidos que
              promuevan, incluyan o inciten a:
            </p>
            <ul className="terminos-list terminos-list--prohibited">
              <li>
                <strong>Lenguaje Prohibido y Ofensivo:</strong> Uso de
                groserías, términos soeces, insultos, lenguaje vulgar o
                cualquier expresión que resulte ofensiva, degradante o violenta
                en los títulos o descripciones de la publicación.
              </li>
              <li>
                <strong>Actividades Ilícitas:</strong> Drogas, sustancias
                ilícitas, venta de armas o cualquier elemento que infrinja la
                Ley 20.000 o similares.
              </li>
              <li>
                <strong>Contenido Sexual:</strong> Servicios eróticos,
                pornografía o explotación sexual de cualquier tipo.
              </li>
              <li>
                <strong>Violencia y Odio:</strong> Discursos que inciten al
                odio, discriminación, acoso, amenazas o agresiones físicas o
                verbales.
              </li>
              <li>
                <strong>Orden Público:</strong> Contenidos que promuevan
                desórdenes civiles, actos vandálicos, sabotaje, tomas de terreno
                o cualquier actividad que atente contra la paz social y
                seguridad pública en Chile.
              </li>
              <li>
                <strong>Salud y Seguridad:</strong> Desafíos peligrosos,
                apología del suicidio, venta de medicamentos o consejos de salud
                sin base científica.
              </li>
              <li>
                <strong>Fraudes y Ética:</strong> Estafas piramidales, phishing,
                &quot;funas&quot;, difamación de terceros y el uso de
                &quot;clickbait&quot; o publicidad engañosa.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">
              6.3. Reserva de Derecho
            </h3>
            <p>
              Damaval SpA se reserva el derecho de calificar, rechazar o
              eliminar cualquier contenido que atente contra la ética, la
              seguridad de la comunidad o la integridad de la marca.
            </p>
            <h3 className="terminos-clause__subtitle">6.4. Licencia de Uso</h3>
            <p>
              El usuario concede a Damaval SpA una licencia gratuita y universal
              para utilizar su contenido en el sitio y en todas las redes
              sociales oficiales de Extrovertidos (presentes y futuras).
            </p>
          </article>

          {/* 7 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">7</span>
              Proceso de Compra, Modalidades y Exclusión de Retracto
            </h2>
            <h3 className="terminos-clause__subtitle">7.1. Flujo de Compra</h3>
            <p>
              El proceso de adquisición de servicios se compone de: (1)
              Selección de Plan, (2) Pago a través de pasarela externa segura,
              (3) Activación automática del Plan y habilitación del panel de
              publicación.
            </p>
            <h3 className="terminos-clause__subtitle">7.2. Tipos de Planes</h3>
            <ul className="terminos-list">
              <li>
                <strong>Publicación Única:</strong> Permite una sola carga de
                contenido por un periodo de 30 días.
              </li>
              <li>
                <strong>Pack de Publicaciones:</strong> Cupos múltiples (ej.
                Pack de 4). Los cupos no utilizados dentro del periodo de 30
                días caducan sin derecho a reembolso.
              </li>
              <li>
                <strong>Publicación Sin Límite:</strong> Cargas ilimitadas
                durante el periodo de 30 días de vigencia del plan.
              </li>
              <li>
                <strong>Plan Superguia Extrovertidos:</strong> Vigencia de un
                año (365 días). Permite edición ilimitada de la publicación
                aprobada.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">7.3. No Retracto</h3>
            <p>
              Según el Art. 3 bis, letra b) de la Ley N° 19.496, NO aplica el
              derecho a retracto por ser un servicio digital de ejecución
              inmediata cuya prestación comienza con la habilitación del panel.
              La venta es final al momento del pago.
            </p>
          </article>

          {/* 8 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">8</span>
              Política de Rechazo, Moderación y Límite de Intentos
            </h2>
            <h3 className="terminos-clause__subtitle">
              8.1. Incumplimiento Grave
            </h3>
            <p>
              Si una publicación infringe las prohibiciones de la Cláusula 6, el
              usuario perderá el monto pagado. Se retendrá como Cláusula Penal
              para cubrir gastos de moderación y daños reputacionales.
            </p>
            <h3 className="terminos-clause__subtitle">
              8.2. Derecho Universal a Subsanar y Límite de Intentos
            </h3>
            <p>
              Ante cualquier rechazo, y sin excepción alguna, el usuario tendrá
              un máximo de tres (3) intentos de edición para lograr la
              aprobación inicial de su contenido. Este derecho permite al
              usuario corregir desde errores técnicos hasta infracciones de
              contenido. Si tras el tercer intento de corrección el contenido
              sigue siendo rechazado por la administración, se entenderá el cupo
              como efectivamente ocupado y el servicio como prestado,
              finalizando el proceso de revisión sin derecho a nuevos intentos
              ni reembolsos.
            </p>
            <h3 className="terminos-clause__subtitle">
              8.3. Ediciones Post-Aprobación (Plan Superguía)
            </h3>
            <p>
              Una vez obtenida la aprobación inicial, los usuarios del Plan
              Superguía podrán editar su contenido ilimitadamente durante el año
              de vigencia. Cada edición volverá a revisión obligatoria bajo los
              mismos estándares de la Cláusula 6.
            </p>
            <h3 className="terminos-clause__subtitle">
              8.4. Reembolso Excepcional
            </h3>
            <p>
              Solo si Damaval SpA decide no publicar por razones discrecionales
              de marca (sin infracción persistente tras los 3 intentos), se
              evaluará un reembolso descontando un 20% por concepto de Gastos de
              Gestión Administrativa.
            </p>
          </article>

          {/* 9 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">9</span>
              Plataforma de Pagos Externa
            </h2>
            <p>
              Los pagos se realizan vía proveedores externos seguros. Damaval
              SpA no recolecta ni almacena información bancaria ni claves. La
              responsabilidad transaccional recae exclusivamente en el proveedor
              de pagos.
            </p>
          </article>

          {/* 10 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">10</span>
              Proceso de Revisión y Notificaciones
            </h2>
            <p>
              Toda publicación nueva o editada ingresa a revisión obligatoria.
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Plazo de Respuesta:</strong> Plazo máximo de 24 horas
                hábiles (lunes a viernes de 09:00 a 18:00 hrs).
              </li>
              <li>
                <strong>Notificaciones:</strong> El usuario será informado
                mediante notificación interna y vía correo electrónico.
              </li>
            </ul>
          </article>

          {/* 11 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">11</span>
              Seguridad, Jurisdicción y Propiedad Industrial
            </h2>
            <h3 className="terminos-clause__subtitle">Seguridad</h3>
            <p>
              Damaval SpA no verifica antecedentes. La seguridad en encuentros
              presenciales es responsabilidad de los usuarios. Se declina toda
              responsabilidad por daños físicos o patrimoniales derivados de
              interacciones fuera del sitio.
            </p>
            <h3 className="terminos-clause__subtitle">Jurisdicción</h3>
            <p>
              Este contrato se rige por las leyes de Chile. Cualquier disputa se
              someterá a los Tribunales de Justicia de Curicó.
            </p>
            <h3 className="terminos-clause__subtitle">Propiedad Industrial</h3>
            <p>
              La marca &quot;Extrovertidos&quot; está protegida ante INAPI bajo
              la Ley N° 19.039.
            </p>
          </article>

          {/* 12 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">12</span>
              Actualización de Términos
            </h2>
            <p>
              Damaval SpA se reserva el derecho de modificar estos Términos
              según necesidades operativas o legales.
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
