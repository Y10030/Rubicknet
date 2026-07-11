document.addEventListener('DOMContentLoaded', function () {


  /* ---------- Tabs (Internet: Hogar / Empresa) ---------- */
  document.querySelectorAll('.tabs-nav').forEach(function (nav) {
    var botones = nav.querySelectorAll('.tab-btn');
    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grupo = btn.closest('.tabs-wrap');
        grupo.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('activo'); });
        grupo.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('activo'); });
        btn.classList.add('activo');
        var panel = grupo.querySelector('#' + btn.dataset.tab);
        if (panel) panel.classList.add('activo');
      });
    });
  });

  /* ---------- Acordeón de preguntas frecuentes ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var pregunta = item.querySelector('.faq-pregunta');
    var respuesta = item.querySelector('.faq-respuesta');
    pregunta.addEventListener('click', function () {
      var abierto = item.classList.contains('abierto');
      document.querySelectorAll('.faq-item.abierto').forEach(function (otro) {
        otro.classList.remove('abierto');
        otro.querySelector('.faq-respuesta').style.maxHeight = null;
      });
      if (!abierto) {
        item.classList.add('abierto');
        respuesta.style.maxHeight = respuesta.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Filtro de proyectos ---------- */
  var filtros = document.querySelectorAll('.filtro');
  var proyectos = document.querySelectorAll('.proyecto');
  filtros.forEach(function (filtro) {
    filtro.addEventListener('click', function () {
      filtros.forEach(function (f) { f.classList.remove('activo'); });
      filtro.classList.add('activo');
      var categoria = filtro.dataset.filtro;
      proyectos.forEach(function (p) {
        if (categoria === 'todos' || p.dataset.categoria === categoria) {
          p.style.display = '';
        } else {
          p.style.display = 'none';
        }
      });
    });
  });

  /* ---------- Buscador de cobertura ----------
     La búsqueda real (por texto y por ubicación) contra data/cobertura.json
     la maneja js/cobertura.js para TODOS los formularios .form-cobertura
     del sitio (hero de inicio, hero de internet.html, etc). No se duplica
     aquí ninguna lógica de búsqueda. */

  /* ---------- Formulario de contacto -> arma mensaje y abre WhatsApp ---------- */
  var formContacto = document.getElementById('form-contacto');
  if (formContacto) {
    formContacto.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = (formContacto.nombre && formContacto.nombre.value.trim()) || '';
      var empresa = (formContacto.empresa && formContacto.empresa.value.trim()) || '';
      var telefono = (formContacto.telefono && formContacto.telefono.value.trim()) || '';
      var servicio = (formContacto.servicio && formContacto.servicio.value) || '';
      var mensaje = (formContacto.mensaje && formContacto.mensaje.value.trim()) || '';

      var lineas = ['Hola, quiero cotizar un servicio.'];
      if (servicio) lineas.push('Servicio de interés: ' + servicio + '.');
      if (nombre) lineas.push('Nombre: ' + nombre + '.');
      if (empresa) lineas.push('Empresa: ' + empresa + '.');
      if (telefono) lineas.push('Teléfono: ' + telefono + '.');
      if (mensaje) lineas.push('Mensaje: ' + mensaje);
      var textoWhatsApp = lineas.join(' ');

      var url = (window.Rubicknet && window.Rubicknet.armarLinkWhatsApp)
        ? window.Rubicknet.armarLinkWhatsApp(textoWhatsApp)
        : ('https://wa.me/5568115210?text=' + encodeURIComponent(textoWhatsApp));
      window.open(url, '_blank', 'noopener');

      var aviso = document.getElementById('aviso-contacto');
      if (aviso) {
        aviso.style.display = 'block';
        aviso.textContent = 'Gracias por escribirnos. Abrimos WhatsApp con tu mensaje listo para enviar.';
      }
      formContacto.reset();
    });
  }

});
