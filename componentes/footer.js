class MiFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `

<footer class="site-footer">
  <div class="contenedor">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">
    <img src="Logo-RN.png" alt="Rubicknet">
    <span>Rubicknet</span>
</div>
        <p>Internet, cableado, vigilancia y soporte técnico para hogares y empresas.</p>
        <p>Ecatepec </p>
      </div>
      <div>
        <h4>Soluciones</h4>
        <a href="soluciones-cableado.html">Cableado estructurado</a>
        <a href="soluciones-redes.html">Redes</a>
        <a href="soluciones-cctv.html">Vigilancia y CCTV</a>
        <a href="soluciones-soporte.html">Soporte y mantenimiento</a>
        <a href="soluciones-seguridad.html">Seguridad informática</a>
        <a href="soluciones-equipo.html">Equipo y cómputo</a>
      </div>
      <div>
        <h4>Empresa</h4>
        <a href="internet.html">Internet</a>
        <a href="soluciones.html">Soluciones</a>
        <a href="proyectos.html">Proyectos</a>
        <a href="nosotros.html">Nosotros</a>
        <a href="contacto.html">Contacto</a>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>(55) 68 11 52 10</p>
		<p>(55) 50 38 96 19</p>
        <p>informes@rubicknet.com</p>
        <p>Lunes a viernes, 9:00 a 21:00 h</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Rubicknet. Todos los derechos reservados.</span>
    </div>
  </div>
</footer>

        `;
    }
}

customElements.define('mi-footer', MiFooter);