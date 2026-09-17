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
              src="/img/Logo_con_r_v3.png"
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
              Documentos Electrónicos, el uso de la plataforma, el inicio de
              sesión y la marcación de casillas o botones de aceptación
              electrónica constituyen un contrato vinculante, otorgando plena
              validez legal al consentimiento manifestado por medios digitales
              entre el usuario y Damaval SpA.
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
              Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Enlaces y Contenido Externo:</strong> El usuario puede
                incluir en su publicación enlaces a sitios web, redes sociales,
                botones de pago, chats de WhatsApp, números telefónicos y
                geolocalización (Google Maps). Damaval SpA no controla,
                supervisa ni responde por el contenido, la seguridad, la
                privacidad ni las transacciones comerciales que se realicen en
                dichos medios externos.
              </li>
              <li>
                <strong>Responsabilidad por Contenidos:</strong> El usuario que
                publica es el único responsable de la veracidad, integridad y
                legalidad de la información e imágenes incluidas. Damaval SpA no
                asume responsabilidad por la exactitud de las publicaciones de
                terceros.
              </li>
              <li>
                <strong>Indemnidad:</strong> El usuario asumirá la totalidad de
                los costos de defensa legal y honorarios de abogados en caso de
                que Damaval SpA se vea involucrada en un litigio por causa de su
                publicación, infracción de derechos de terceros o incumplimiento
                de estos términos.
              </li>
            </ul>
          </article>

          {/* 3 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">3</span>
              Registro, Tratamiento de Datos Personales y Seguridad
            </h2>
            <h3 className="terminos-clause__subtitle">
              3.1. Método de Ingreso y Datos Tratados
            </h3>
            <p>
              El registro y acceso se realiza exclusivamente a través del
              sistema Google Sign-In (Google LLC). De conformidad con la Ley N°
              21.719 sobre Protección de Datos Personales, Damaval SpA actúa en
              calidad de Responsable del Tratamiento de Datos. Al iniciar
              sesión, la plataforma recopila y almacena únicamente:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>a) Correo electrónico:</strong> Utilizado
                exclusivamente para la autenticación de identidad, control de
                sesiones y comunicaciones operativas del servicio.
              </li>
              <li>
                <strong>b) Nombre completo:</strong> Utilizado para la
                individualización del usuario en su panel y en las notificaciones
                del servicio.
              </li>
              <li>
                <strong>c) Foto de perfil (avatar público):</strong> Utilizada
                para la personalización de la interfaz dentro del panel de
                usuario.
              </li>
            </ul>
            <p>
              La base de licitud para este tratamiento es la ejecución del
              contrato de prestación de servicios entre las partes.
            </p>
            <h3 className="terminos-clause__subtitle">
              3.2. Infraestructura y Proveedores Encargados
            </h3>
            <p>
              El usuario reconoce y acepta que el procesamiento y almacenamiento
              seguro de sus datos se ejecuta mediante infraestructura cloud
              provista por Supabase Inc. (alojada en servidores internacionales
              bajo altos estándares de cifrado y acuerdos de procesamiento de
              datos) y servidores de hosting administrados por Damaval SpA
              (cPanel). Damaval SpA no comercializa ni cede estos datos a
              terceros ajenos a la operación técnica del servicio.
            </p>
            <h3 className="terminos-clause__subtitle">
              3.3. Derechos de los Titulares (Derechos ARCO)
            </h3>
            <p>
              El usuario podrá ejercer en cualquier momento sus derechos de
              Acceso, Rectificación, Supresión (Cancelación), Oposición,
              Portabilidad y Bloqueo. Para solicitar la eliminación definitiva
              de su cuenta o la modificación de sus registros, deberá enviar un
              requerimiento formal a{" "}
              <a
                href="mailto:atencion@extrovertidos.cl"
                className="terminos-link">
                atencion@extrovertidos.cl
              </a>
              . Damaval SpA procesará la baja definitiva de los registros en un
              plazo máximo de 10 días hábiles.
            </p>
            <h3 className="terminos-clause__subtitle">
              3.4. Uso del Correo Electrónico
            </h3>
            <p>
              El correo electrónico registrado será utilizado exclusivamente con
              fines operativos y de comunicación directa con el usuario
              (confirmación de publicaciones, estados de moderación, alertas de
              seguridad, soporte y facturación). No se enviarán comunicaciones
              comerciales masivas no solicitadas sin el previo consentimiento
              expreso del usuario.
            </p>
          </article>

          {/* 4 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">4</span>
              Estructura de Secciones, Modalidades y Vigencia
            </h2>
            <p>
              La plataforma organiza su contenido en dos secciones principales,
              disponiendo en ambas de modalidades de publicación Gratuita y
              Destacada Pagada:
            </p>
            <h3 className="terminos-clause__subtitle">
              4.1. Sección Panoramas (Eventos con Fecha Específica)
            </h3>
            <p>
              Orientada a la difusión de eventos, tocatas, ferias y actividades
              con una fecha puntual de realización.
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Modalidad General (Gratuita):</strong> Publicación
                estándar sin costo para el usuario.
              </li>
              <li>
                <strong>Modalidad Destacada (Pagada):</strong> Ubicación
                preferencial con mayor visibilidad, sujeta a la tarifa vigente.
              </li>
              <li>
                <strong>Regla de Vigencia:</strong> En ambas modalidades, el
                anuncio caduca y se retira automáticamente a las 00:00 horas del
                día siguiente a la fecha informada de realización del evento.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">
              4.2. Sección Superbuscador (Directorio Comercial y Servicios)
            </h3>
            <p>
              Orientada a la difusión de comercios, servicios, emprendimientos y
              actividades continuas.
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Modalidad General (Gratuita):</strong> Publicación
                estándar en el directorio sin costo para el usuario.
              </li>
              <li>
                <strong>Modalidad Destacada (Pagada):</strong> Ubicación
                preferencial y destacada en el directorio, sujeta a la tarifa
                vigente.
              </li>
              <li>
                <strong>Regla de Vigencia:</strong> En ambas modalidades, la
                publicación se mantendrá en línea por un período de vigencia de
                treinta (30) días corridos desde el momento de su aprobación y
                puesta en línea, caducando automáticamente al cumplirse el
                plazo.
              </li>
            </ul>
          </article>

          {/* 5 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">5</span>
              Gestión y Control de Publicaciones (Panel de Usuario)
            </h2>
            <p>
              Desde su perfil privado, el usuario creador podrá gestionar sus
              avisos activos mediante las siguientes opciones:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Editar:</strong> Modificar textos, imágenes o enlaces
                de contacto. En la sección Panoramas no se permite alterar la
                fecha principal del evento. Toda edición ingresa nuevamente a
                revisión de moderación antes de volver a estar visible.
              </li>
              <li>
                <strong>Pausar/Reanudar:</strong> Ocultar temporalmente el
                anuncio de la vista pública y reactivarlo dentro del período de
                vigencia remanente.
              </li>
              <li>
                <strong>Eliminar:</strong> Dar de baja el anuncio de forma
                definitiva. En las modalidades destacadas pagadas, la
                eliminación voluntaria por parte del usuario no otorga derecho
                a reembolso ni reposición de cupo, conforme al Art. 3 bis letra
                b) de la Ley N° 19.496.
              </li>
            </ul>
          </article>

          {/* 6 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">6</span>
              Política de Contenido y Prohibiciones Específicas
            </h2>
            <h3 className="terminos-clause__subtitle">
              6.1. Responsabilidad de Materiales y Datos de Terceros
            </h3>
            <p>
              El usuario garantiza contar con todos los derechos, licencias y
              autorizaciones necesarias sobre las imágenes, textos y marcas
              incluidas en su publicación. Asimismo, garantiza expresamente
              contar con el consentimiento previo de los titulares si incluye
              datos personales, números de contacto comercial (como WhatsApp) o
              imágenes de terceros. Damaval SpA queda exenta de toda
              responsabilidad por infracciones a la Ley N° 17.336 o reclamos de
              privacidad derivados de contenidos subidos por usuarios.
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
                <strong>Lenguaje Ofensivo:</strong> Uso de groserías, términos
                soeces, insultos o cualquier expresión degradante o violenta en
                títulos o descripciones.
              </li>
              <li>
                <strong>Actividades Ilícitas:</strong> Sustancias ilícitas,
                drogas, armas o cualquier elemento que infrinja la Ley N° 20.000
                u ordenamiento penal chileno.
              </li>
              <li>
                <strong>Contenido Sexual:</strong> Servicios eróticos para
                adultos, pornografía o explotación sexual de cualquier tipo.
              </li>
              <li>
                <strong>Violencia y Odio:</strong> Mensajes que inciten al odio,
                discriminación arbitraria, acoso o amenazas físicas o verbales.
              </li>
              <li>
                <strong>Alteración del Orden Público:</strong> Convocatorias a
                desórdenes civiles, actos vandálicos, sabotaje, tomas de terreno
                o acciones que atenten contra la seguridad y orden público.
              </li>
              <li>
                <strong>Salud y Seguridad:</strong> Desafíos de riesgo físico,
                apología del suicidio, comercialización no autorizada de
                medicamentos o asesorías médicas sin acreditación técnica.
              </li>
              <li>
                <strong>Fraudes y Difamación:</strong> Estafas, esquemas
                piramidales, phishing, &quot;funas&quot;, difamación de terceros
                o publicidad engañosa.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">
              6.3. Procedimiento de Retiro (<em>Notice and Takedown</em>)
            </h3>
            <p>
              Damaval SpA se reserva el derecho de retirar o suspender de
              inmediato cualquier publicación frente a notificaciones fundadas
              de infracción legal, vulneración de derechos de autor o reclamos de
              privacidad de terceros recibidos en su canal de atención.
            </p>
            <h3 className="terminos-clause__subtitle">
              6.4. Licencia de Difusión
            </h3>
            <p>
              El usuario concede a Damaval SpA una licencia no exclusiva,
              gratuita y universal para reproducir y difundir el contenido y
              gráfica de su publicación en el portal y en los canales oficiales
              de redes sociales de Extrovertidos.cl con fines promocionales.
            </p>
          </article>

          {/* 7 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">7</span>
              Condiciones de Contratación (Modalidades Destacadas) y Exclusión de
              Retracto
            </h2>
            <h3 className="terminos-clause__subtitle">
              7.1. Flujo de Activación
            </h3>
            <p>
              La contratación de anuncios destacados (sea en Panoramas o
              Superbuscador) contempla: (1) Carga del contenido, (2) Pago a
              través de la pasarela externa habilitada, y (3) Envío automático a
              la cola de moderación prioritaria.
            </p>
            <h3 className="terminos-clause__subtitle">7.2. Tarifa y Cupos</h3>
            <p>
              El costo corresponde a un pago único por anuncio publicado de
              forma destacada durante el período de vigencia respectivo. Los
              cupos no utilizados o publicaciones eliminadas voluntariamente por
              el usuario de forma anticipada no son acumulables ni
              reembolsables.
            </p>
            <h3 className="terminos-clause__subtitle">
              7.3. Exclusión del Derecho a Retracto
            </h3>
            <p>
              De conformidad con el Artículo 3 bis, letra b) de la Ley N°
              19.496 sobre Protección de los Derechos de los Consumidores, NO
              aplica el derecho a retracto. Por tratarse de un servicio digital
              de habilitación técnica y procesamiento inmediato en los
              servidores de la plataforma tras confirmarse la transacción
              monetaria, la contratación tiene carácter definitivo.
            </p>
          </article>

          {/* 8 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">8</span>
              Moderación, Límite de Intentos y Reembolsos
            </h2>
            <h3 className="terminos-clause__subtitle">
              8.1. Aplicación de Estándares
            </h3>
            <p>
              Tanto las publicaciones gratuitas como las destacadas pagadas
              deben ajustarse estrictamente a las directrices de la Cláusula 6.
            </p>
            <h3 className="terminos-clause__subtitle">
              8.2. Derecho a Subsanar y Límite de Tres (3) Intentos
            </h3>
            <p>
              Si un anuncio es observado o rechazado en la moderación, el
              usuario dispondrá de un máximo de tres (3) intentos de edición
              para corregir observaciones técnicas o de contenido:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>En publicaciones gratuitas:</strong> Si tras el tercer
                intento persisten las faltas, el anuncio se descarta
                definitivamente.
              </li>
              <li>
                <strong>En publicaciones destacadas pagadas:</strong> Si tras
                agotar los tres intentos el usuario no subsana las infracciones a
                la Cláusula 6, se entenderá el servicio de revisión como
                prestado y el cupo consumido, sin derecho a reembolso.
              </li>
            </ul>
            <h3 className="terminos-clause__subtitle">
              8.3. Incumplimiento Grave
            </h3>
            <p>
              La carga intencionada de contenidos que promuevan ilícitos
              penales, estafas, pornografía o discursos de odio facultará a
              Damaval SpA a cancelar de inmediato la cuenta y la publicación,
              reteniendo el pago a título de cláusula penal por costos de
              moderación y mitigación de perjuicio reputacional.
            </p>
            <h3 className="terminos-clause__subtitle">
              8.4. Reembolso Excepcional
            </h3>
            <p>
              Únicamente si Damaval SpA rechaza unilateralmente una publicación
              destacada pagada por motivos discrecionales de línea editorial
              interna (sin que exista infracción a la Cláusula 6 atribuible al
              usuario tras los tres intentos), se procesará la devolución del
              importe pagado, deduciendo hasta un 20% por costos
              administrativos y comisiones operativas de la pasarela de pago.
            </p>
          </article>

          {/* 9 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">9</span>
              Plataforma de Pagos Externa
            </h2>
            <p>
              Los pagos se procesan a través de proveedores externos
              especializados. Damaval SpA no almacena, administra ni tiene
              acceso a datos de tarjetas de crédito o débito ni claves
              bancarias. La seguridad de la transacción monetaria recae en la
              entidad proveedora de la pasarela.
            </p>
          </article>

          {/* 10 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">10</span>
              Proceso de Revisión y Tiempos de Respuesta
            </h2>
            <p>
              Toda publicación o modificación ingresa a control editorial:
            </p>
            <ul className="terminos-list">
              <li>
                <strong>Plazo de Revisión:</strong> Hasta 24 horas hábiles
                (lunes a viernes de 09:00 a 18:00 horas, exceptuando feriados).
              </li>
              <li>
                <strong>Notificaciones:</strong> Las resoluciones de aprobación
                o rechazo serán notificadas mediante la plataforma y vía correo
                electrónico registrado.
              </li>
            </ul>
          </article>

          {/* 11 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">11</span>
              Seguridad en Encuentros, Legislación Aplicable y Jurisdicción
            </h2>
            <ul className="terminos-list">
              <li>
                <strong>Seguridad Presencial:</strong> Damaval SpA no audita
                antecedentes de convocantes ni asiste a las actividades. La
                concurrencia física o transacciones comerciales derivadas de
                eventos o servicios difundidos son de exclusiva responsabilidad
                de los usuarios.
              </li>
              <li>
                <strong>Legislación y Jurisdicción:</strong> El presente
                contrato se rige íntegramente por las leyes de la República de
                Chile. Para cualquier controversia legal, las partes fijan su
                domicilio en la comuna de Molina y se someten a la jurisdicción
                de los Tribunales Ordinarios de Justicia de Curicó.
              </li>
              <li>
                <strong>Propiedad Industrial:</strong> La denominación y
                logotipo &quot;Extrovertidos&quot; se encuentran protegidos
                conforme a la Ley N° 19.039 ante el Instituto Nacional de
                Propiedad Industrial (INAPI).
              </li>
            </ul>
          </article>

          {/* 12 */}
          <article className="terminos-clause">
            <h2 className="terminos-clause__title">
              <span className="terminos-clause__number">12</span>
              Modificaciones de los Términos
            </h2>
            <p>
              Damaval SpA se reserva la facultad de actualizar estos Términos y
              Condiciones en atención a mejoras funcionales o requerimientos
              regulatorios, informando dichos cambios a través de la plataforma.
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
