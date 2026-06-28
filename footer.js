class MiFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `

<footer class="site-footer">
  <div class="contenedor">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">Rubicknet</div>
        <p>Internet, cableado, vigilancia y soporte técnico para hogares y empresas.</p>
        <p>Ecatepec - Jardines de Morelos</p>
      </div>
      <div>
        <h4>Soluciones</h4>
        <a href="soluciones-cableado.html">Cableado estructurado</a>
        <a href="soluciones-redes.html">Redes</a>
        <a href="soluciones-cctv.html">Vigilancia y CCTV</a>
        <a href="soluciones-soporte.html">Soporte y mantenimiento</a>
        <a href="soluciones-seguridad.html">Seguridad informática</a>
      </div>
      <div>
        <h4>Empresa</h4>
        <a href="internet.html">Internet</a>
        <a href="proyectos.html">Proyectos</a>
        <a href="nosotros.html">Nosotros</a>
        <a href="contacto.html">Contacto</a>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>(55) 68 11 52 10</p>
		<p>(55) 96 02 32 63</p>
        <p>rubicknetreporta@gmail.com</p>
        <p>Lunes a viernes, 9:00 a 20:00 h</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Rubicknet. Todos los derechos reservados.</span>
    </div>
  </div>
</footer>



<script src="js/main.js"></script>
</body>
</html>

        `;
    }
}

customElements.define('mi-footer', MiFooter);