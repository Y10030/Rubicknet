class CTASection extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="seccion">
                <div class="contenedor">
                    <div class="cta-final">
                        <div class="cta-final-inner">
                            <h2>¿Listo para resolver tu conectividad o seguridad?</h2>
                            <div class="cta-botones">
                                <a href="contacto.html" class="btn btn-primario">
                                    Solicitar cotización
                                </a>

                                <a href="https://wa.me/5568115210?text=Hola%2C%20quiero%20cotizar%20un%20servicio"
                                   class="btn btn-secundario-purpura"
                                   target="_blank"
                                   rel="noopener">
                                    Escríbenos por WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('cta-section', CTASection);