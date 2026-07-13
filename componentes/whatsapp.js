/**
 * Rubicknet · WhatsApp
 * ----------------------
 * Funciones compartidas para armar links de WhatsApp con un mensaje
 * ya escrito, usadas en todo el sitio (header, CTA final, tarjetas de
 * planes, chat-widget, formulario de contacto, etc.).
 *
 * Expone window.Rubicknet.armarLinkWhatsApp, .mensajePorPagina y
 * .activarBotonesWhatsApp.
 */
(function () {
  var NUMERO_WHATSAPP = '5568115210';
  var CLAVE_ULTIMA_ZONA = 'rbk_ultima_zona';

  /* Mensaje por defecto según la página en la que está el visitante,
     para que el botón "Cotizar" del menú (y cualquier botón sin
     data-wa-msg propio) mande un mensaje relevante en vez de uno genérico. */
  var MENSAJES_POR_PAGINA = {
    'index.html': 'Hola, quiero más información sobre los servicios de Rubicknet.',
    '': 'Hola, quiero más información sobre los servicios de Rubicknet.',
    'internet.html': 'Hola, quiero cotizar un plan de internet.',
    'soluciones.html': 'Hola, quiero más información sobre sus soluciones.',
    'soluciones-cableado.html': 'Hola, quiero cotizar un servicio de cableado estructurado.',
    'soluciones-redes.html': 'Hola, quiero cotizar redes cableadas e inalámbricas.',
    'soluciones-cctv.html': 'Hola, quiero cotizar cámaras, portones automáticos o interphone.',
    'soluciones-soporte.html': 'Hola, quiero agendar soporte técnico o mantenimiento.',
    'soluciones-seguridad.html': 'Hola, quiero cotizar un servicio de seguridad informática.',
    'proyectos.html': 'Hola, vi sus proyectos y quiero más información.',
    'nosotros.html': 'Hola, quiero más información sobre Rubicknet.',
    'contacto.html': 'Hola, quiero cotizar un servicio.'
  };

  function paginaActual() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function mensajePorPagina() {
    return MENSAJES_POR_PAGINA[paginaActual()] || 'Hola, quiero más información sobre los servicios de Rubicknet.';
  }

  /* Lee la última zona de cobertura confirmada (guardada por js/cobertura.js)
     por si en algún momento se quiere enriquecer el mensaje con la zona. */
  function obtenerUltimaZona() {
    try {
      var raw = localStorage.getItem(CLAVE_ULTIMA_ZONA);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* Limpia el mensaje antes de mandarlo a WhatsApp: quita espacios y
     saltos de línea repetidos o al final de cada línea, para que el
     texto no llegue con líneas en blanco o espacios que hagan que el
     mensaje se vea encimado dentro del chat de WhatsApp. */
  function limpiarMensaje(mensaje) {
    return (mensaje || '')
      .toString()
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(function (linea) { return linea.trim(); })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function armarLinkWhatsApp(mensaje) {
    var texto = limpiarMensaje(mensaje);
    if (!texto) texto = limpiarMensaje(mensajePorPagina());
    return 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  /* Busca cualquier elemento con [data-wa-msg] dentro de `raiz` (todo el
     documento por defecto, o solo el header/panel recién insertado) y le
     asigna el link de WhatsApp correspondiente, abriéndolo en pestaña nueva.
     Antes esta función no existía (este archivo tenía por error el mismo
     contenido que js/cobertura.js), así que ningún botón con data-wa-msg
     recibía su mensaje: por eso "Escríbenos por WhatsApp" abría el chat
     vacío. */
  function activarBotonesWhatsApp(raiz) {
    var contenedor = raiz || document;
    var elementos = contenedor.querySelectorAll('[data-wa-msg]');
    elementos.forEach(function (el) {
      var mensaje = el.getAttribute('data-wa-msg');
      el.setAttribute('href', armarLinkWhatsApp(mensaje));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    activarBotonesWhatsApp(document);
  });

  window.Rubicknet = window.Rubicknet || {};
  window.Rubicknet.armarLinkWhatsApp = armarLinkWhatsApp;
  window.Rubicknet.mensajePorPagina = mensajePorPagina;
  window.Rubicknet.activarBotonesWhatsApp = activarBotonesWhatsApp;
  window.Rubicknet.obtenerUltimaZona = obtenerUltimaZona;
})();
