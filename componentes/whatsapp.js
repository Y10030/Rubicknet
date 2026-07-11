/**
 * Rubicknet · Enrutador de WhatsApp
 * ----------------------------------
 * Centraliza el número de WhatsApp y arma los links con mensaje
 * precargado para todos los botones "de contacto" del sitio.
 *
 * Dos formas de usarlo:
 *
 * 1) Automática: cualquier <a data-wa-msg="Hola, quiero...">Texto</a>
 *    se convierte solo, al cargar la página, en un link a WhatsApp
 *    (se abre en pestaña nueva). El href original (p. ej. contacto.html)
 *    queda como respaldo si el usuario tiene JavaScript desactivado.
 *
 * 2) Programática: window.Rubicknet.armarLinkWhatsApp('mensaje')
 *    y window.Rubicknet.mensajePorPagina() para componentes que arman
 *    su propio HTML (header, footer, cta-section, chat-widget).
 */
(function () {
  var NUMERO_WHATSAPP = '5568115210';

  function armarLinkWhatsApp(mensaje) {
    return 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(mensaje || 'Hola, quiero más información.');
  }

  // Mensaje genérico según la página actual — se usa en componentes
  // compartidos (botón "Cotizar" del menú, CTA final) que no tienen
  // forma de saber qué servicio le interesa al visitante salvo por
  // en qué página está parado.
  function mensajePorPagina() {
    var pagina = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var mensajes = {
      '': 'Hola, quiero más información sobre los servicios de Rubicknet.',
      'index.html': 'Hola, quiero más información sobre los servicios de Rubicknet.',
      'internet.html': 'Hola, quiero cotizar un plan de internet.',
      'soluciones.html': 'Hola, quiero cotizar servicios para mi negocio.',
      'soluciones-cableado.html': 'Hola, quiero cotizar un servicio de cableado estructurado.',
      'soluciones-redes.html': 'Hola, quiero cotizar redes cableadas e inalámbricas.',
      'soluciones-cctv.html': 'Hola, quiero cotizar un sistema de vigilancia y CCTV.',
      'soluciones-soporte.html': 'Hola, quiero cotizar soporte y mantenimiento.',
      'soluciones-seguridad.html': 'Hola, quiero cotizar un servicio de seguridad informática.',
      'proyectos.html': 'Hola, vi sus proyectos y quiero cotizar un servicio.',
      'nosotros.html': 'Hola, quiero más información sobre Rubicknet.',
      'contacto.html': 'Hola, quiero cotizar un servicio.'
    };
    return mensajes[pagina] || mensajes['index.html'];
  }

  function activarBotonesWhatsApp(raiz) {
    (raiz || document).querySelectorAll('a[data-wa-msg]').forEach(function (a) {
      a.setAttribute('href', armarLinkWhatsApp(a.getAttribute('data-wa-msg')));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  }

  window.Rubicknet = window.Rubicknet || {};
  window.Rubicknet.NUMERO_WHATSAPP = NUMERO_WHATSAPP;
  window.Rubicknet.armarLinkWhatsApp = armarLinkWhatsApp;
  window.Rubicknet.mensajePorPagina = mensajePorPagina;
  window.Rubicknet.activarBotonesWhatsApp = activarBotonesWhatsApp;

  document.addEventListener('DOMContentLoaded', function () {
    activarBotonesWhatsApp(document);
  });
})();
