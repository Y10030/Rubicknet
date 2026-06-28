class SiteHeader extends HTMLElement {
    connectedCallback() {

        this.innerHTML = `
<header class="site-header">
  <div class="header-inner">
    <a href="index.html" class="logo">Rubicknet<span>.</span></a>

    <nav class="main-nav">

      <a href="internet.html">Internet</a>

      <div class="nav-item">
        <button type="button" class="soluciones-btn" aria-expanded="false">
          Soluciones
          <span class="caret">&#9662;</span>
        </button>

        <div class="mega-menu">

          <a href="soluciones-cableado.html">
            <strong>Cableado estructurado</strong>
            <span>Redes de datos certificadas</span>
          </a>

          <a href="soluciones-redes.html">
            <strong>Redes</strong>
            <span>Cableadas e inalámbricas</span>
          </a>

          <a href="soluciones-cctv.html">
            <strong>Vigilancia Seguridad y CCTV</strong>
            <span>Cámaras análogas e IP</span>
          </a>

          <a href="soluciones-soporte.html">
            <strong>Soporte y mantenimiento</strong>
            <span>Preventivo y correctivo</span>
          </a>

          <a href="soluciones-seguridad.html">
            <strong>Seguridad informática</strong>
            <span>Antivirus y firewall</span>
          </a>

          <div class="mega-destacado">
            <span>
              <strong>¿No sabes cuál necesitas?</strong><br>
              <span>Cuéntanos qué te preocupa resolver.</span>
            </span>

            <a href="contacto.html"
               class="btn btn-primario"
               style="padding:9px 16px;">
               Pedir ayuda
            </a>

          </div>

        </div>
      </div>

      <a href="proyectos.html">Proyectos</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="contacto.html">Contacto</a>

      <a href="contacto.html" class="btn btn-primario nav-cta">
        Cotizar
      </a>

    </nav>

    <button class="menu-toggle" aria-label="Abrir menú">
        &#9776;
    </button>

  </div>
</header>
`;

        this.inicializar();
    }

    inicializar() {
        const nav          = this.querySelector('.main-nav');
        const navToggle     = this.querySelector('.menu-toggle');
        const navItem        = this.querySelector('.nav-item');
        const solucionesBtn  = this.querySelector('.soluciones-btn');

        const esEscritorio = () =>
            window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        const abrirMenu = () => {
            navItem.classList.add('abierto');
            solucionesBtn.setAttribute('aria-expanded', 'true');
        };
        const cerrarMenu = () => {
            navItem.classList.remove('abierto');
            solucionesBtn.setAttribute('aria-expanded', 'false');
        };

        /* Clic */
        solucionesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navItem.classList.contains('abierto') ? cerrarMenu() : abrirMenu();
        });

        /* En escritorio */
        let cerrarTimeout;

        navItem.addEventListener('mouseenter', () => {
            if (!esEscritorio()) return;
            clearTimeout(cerrarTimeout);
            abrirMenu();
        });

        navItem.addEventListener('mouseleave', () => {
            if (!esEscritorio()) return;
            cerrarTimeout = setTimeout(cerrarMenu, 250);
        });

        /* Cerrar al hacer clic fuera del menú */
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) cerrarMenu();
        });

        /* Cerrar con la tecla Escape (accesibilidad) */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cerrarMenu();
        });

        /* Menú hamburguesa en celular */
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('abierto');
        });

        /* Al elegir una solución en celular, cerrar todo */
        this.querySelectorAll('.mega-menu a').forEach((link) => {
            link.addEventListener('click', () => {
                cerrarMenu();
                nav.classList.remove('abierto');
            });
        });
    }
}

customElements.define("site-header", SiteHeader);