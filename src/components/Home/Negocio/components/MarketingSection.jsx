import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";

/**
 * Sección de mensajes de marketing del negocio
 * Permite agregar hasta 2 mensajes de marketing con título y contenido
 */
const MarketingSection = ({ formData, onChange, onFieldFocus }) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faBullhorn} />
        Mensajes de Marketing
        <span className="publicar-negocio__label-hint">(Opcional)</span>
      </h2>

      {/* Mensaje de Marketing 1 */}
      <div className="publicar-negocio__marketing-group">
        <label className="publicar-negocio__marketing-label">
          <FontAwesomeIcon icon={faBullhorn} /> Mensaje de Marketing N° 1
          <span className="publicar-negocio__label-hint">
            {" "}
            (Engancha a tu público)
          </span>
        </label>

        <div className="publicar-negocio__field">
          <label
            className="publicar-negocio__label-small"
            htmlFor="titulo_marketing">
            Título
          </label>
          <input
            type="text"
            id="titulo_marketing"
            name="titulo_marketing"
            value={formData.titulo_marketing || ""}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="Ej: ¡Oferta Especial! o Beneficios Exclusivos"
            maxLength={100}
          />
        </div>

        <div className="publicar-negocio__field">
          <label
            className="publicar-negocio__label-small"
            htmlFor="mensaje_marketing">
            Mensaje
          </label>
          <textarea
            id="mensaje_marketing"
            name="mensaje_marketing"
            className="publicar-negocio__textarea--marketing"
            value={formData.mensaje_marketing || ""}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="Ej: ¡Las primeras 50 personas recibirán un descuento especial! 🎉"
            rows={3}
            maxLength={500}
          />
          <span className="publicar-negocio__char-count">
            {formData.mensaje_marketing?.length || 0}/500
          </span>
        </div>
      </div>

      {/* Mensaje de Marketing 2 */}
      <div className="publicar-negocio__marketing-group">
        <label className="publicar-negocio__marketing-label">
          <FontAwesomeIcon icon={faBullhorn} /> Mensaje de Marketing N° 2
          <span className="publicar-negocio__label-hint">
            {" "}
            (Mensaje adicional)
          </span>
        </label>

        <div className="publicar-negocio__field">
          <label
            className="publicar-negocio__label-small"
            htmlFor="titulo_marketing_2">
            Título
          </label>
          <input
            type="text"
            id="titulo_marketing_2"
            name="titulo_marketing_2"
            value={formData.titulo_marketing_2 || ""}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="Ej: ¡No te lo pierdas! o Promoción Limitada"
            maxLength={100}
          />
        </div>

        <div className="publicar-negocio__field">
          <label
            className="publicar-negocio__label-small"
            htmlFor="mensaje_marketing_2">
            Mensaje
          </label>
          <textarea
            id="mensaje_marketing_2"
            name="mensaje_marketing_2"
            className="publicar-negocio__textarea--marketing"
            value={formData.mensaje_marketing_2 || ""}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="Ej: Síguenos en redes sociales y participa en sorteos exclusivos 🎁"
            rows={3}
            maxLength={500}
          />
          <span className="publicar-negocio__char-count">
            {formData.mensaje_marketing_2?.length || 0}/500
          </span>
        </div>
      </div>
    </section>
  );
};

export default MarketingSection;
