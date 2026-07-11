class CTASection extends HTMLElement {
    connectedCallback() {
        const servicios = [
            { id: 'internet', label: 'Internet' },
            { id: 'cableado', label: 'Cableado estructurado' },
            { id: 'redes', label: 'Redes cableadas e inalámbricas' },
            { id: 'cctv', label: 'Vigilancia y CCTV' },
            { id: 'soporte', label: 'Soporte y mantenimiento' },
            { id: 'seguridad', label: 'Seguridad informática' }
        ];

        // Preselecciona el servicio relacionado con la página en la que está el visitante
        const pagina = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        const preseleccion = {
            'internet.html': ['internet'],
            'soluciones-cableado.html': ['cableado'],
            'soluciones-redes.html': ['redes'],
            'soluciones-cctv.html': ['cctv'],
            'soluciones-soporte.html': ['soporte'],
            'soluciones-seguridad.html': ['seguridad']
        }[pagina] || [];

        this.innerHTML = `
            <section class="seccion">
                <div class="contenedor">
                    <div class="cta-final">
                        <div class="cta-final-inner">
                            <h2>¿Listo para resolver tu conectividad o seguridad?</h2>
                            <div class="cta-botones">
                                <button type="button" class="btn btn-primario cta-cotizar-btn" aria-expanded="false">
                                    Solicitar cotización
                                </button>

                                <a href="https://wa.me/5568115210?text=Hola%2C%20quiero%20cotizar%20un%20servicio"
                                   class="btn btn-secundario-purpura"
                                   target="_blank"
                                   rel="noopener">
                                    Escríbenos por WhatsApp
                                </a>
                            </div>

                            <div class="cta-selector" hidden>
                                <p class="cta-selector-titulo">¿Qué servicios te interesan? Elige uno o varios:</p>
                                <div class="cta-chips">
                                    ${servicios.map(s => '<button type="button" class="cta-chip" data-id="' + s.id + '">' + s.label + '</button>').join('')}
                                </div>
                                <button type="button" class="btn btn-primario cta-enviar-btn">
                                    Enviar cotización por WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                  .cta-selector{margin-top:22px;padding-top:22px;border-top:1px solid rgba(234,237,248,0.14);}
                  .cta-selector[hidden]{display:none;}
                  .cta-selector-titulo{color:var(--ink-soft,rgba(234,237,248,0.72));font-size:.85rem;margin:0 0 12px;}
                  .cta-chips{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:20px;}
                  .cta-chip{font-family:var(--font-body,'Inter',sans-serif);font-size:.82rem;padding:8px 14px;
                    border-radius:999px;border:1px solid rgba(234,237,248,0.25);background:transparent;
                    color:var(--white,#fff);cursor:pointer;transition:all .15s ease;}
                  .cta-chip:hover{border-color:var(--lavender-400,#977DFF);}
                  .cta-chip.activo{background:var(--gradient-diag,linear-gradient(135deg,#0033FF 0%,#977DFF 100%));
                    border-color:transparent;font-weight:600;}
                </style>
            </section>
        `;

        const cotizarBtn = this.querySelector('.cta-cotizar-btn');
        const selector = this.querySelector('.cta-selector');
        const chips = this.querySelectorAll('.cta-chip');
        const enviarBtn = this.querySelector('.cta-enviar-btn');

        chips.forEach(function (chip) {
            if (preseleccion.indexOf(chip.dataset.id) !== -1) chip.classList.add('activo');
        });

        cotizarBtn.addEventListener('click', function () {
            selector.hidden = !selector.hidden;
            cotizarBtn.setAttribute('aria-expanded', String(!selector.hidden));
            if (!selector.hidden) selector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chip.classList.toggle('activo');
            });
        });

        enviarBtn.addEventListener('click', function () {
            const elegidos = Array.from(chips).filter(function (c) { return c.classList.contains('activo'); }).map(function (c) { return c.textContent.trim(); });
            const mensaje = elegidos.length
                ? 'Hola, quiero cotizar los siguientes servicios: ' + elegidos.join(', ') + '.'
                : (window.Rubicknet ? window.Rubicknet.mensajePorPagina() : 'Hola, quiero más información sobre los servicios de Rubicknet.');

            const url = (window.Rubicknet && window.Rubicknet.armarLinkWhatsApp)
                ? window.Rubicknet.armarLinkWhatsApp(mensaje)
                : ('https://wa.me/5568115210?text=' + encodeURIComponent(mensaje));
            window.open(url, '_blank', 'noopener');
        });
    }
}

customElements.define('cta-section', CTASection);