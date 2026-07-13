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

  /* ---------- Buscador de cobertura (demo) ---------- */
  document.querySelectorAll('.form-cobertura').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var resultado = form.querySelector('.resultado-cobertura');
      var valor = form.querySelector('input').value.trim();
      if (!resultado) return;
      if (valor.length === 0) {
        resultado.textContent = 'Ingresa tu colonia o código postal para continuar.';
      } else {
        resultado.textContent = 'Gracias. Un asesor confirmará la cobertura en "' + valor + '" muy pronto. También puedes escribirnos directo por WhatsApp.';
      }
      resultado.style.display = 'block';
    });
  });

  /* ---------- Checkbox de servicios: resalta el chip al marcarlo ---------- */
  document.querySelectorAll('.chip-check input[type="checkbox"]').forEach(function (input) {
    input.addEventListener('change', function () {
      input.closest('.chip-check').classList.toggle('marcada', input.checked);
    });
  });

  /* ---------- Formulario de contacto -> arma mensaje y abre WhatsApp ---------- */
  var formContacto = document.getElementById('form-contacto');
  if (formContacto) {
    formContacto.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = (formContacto.nombre && formContacto.nombre.value.trim()) || '';
      var empresa = (formContacto.empresa && formContacto.empresa.value.trim()) || '';
      var telefono = (formContacto.telefono && formContacto.telefono.value.trim()) || '';
      var colonia = (formContacto.colonia && formContacto.colonia.value.trim()) || '';
      var servicios = Array.from(formContacto.querySelectorAll('input[name="servicio"]:checked')).map(function (el) { return el.value; });
      var mensaje = (formContacto.mensaje && formContacto.mensaje.value.trim()) || '';
      var aviso = document.getElementById('aviso-contacto');

      if (mensaje.length > 0 && mensaje.length < 10) {
        if (aviso) {
          aviso.style.display = 'block';
          aviso.textContent = 'Tu mensaje es muy corto. Escribe al menos 10 caracteres para que podamos entender qué necesitas.';
        }
        formContacto.mensaje.focus();
        return;
      }

      var lineas = ['Hola, quiero cotizar un servicio.'];
      if (servicios.length) lineas.push('Servicio(s) de interés: ' + servicios.join(', ') + '.');
      if (nombre) lineas.push('Nombre: ' + nombre + '.');
      if (empresa) lineas.push('Empresa: ' + empresa + '.');
      if (telefono) lineas.push('Teléfono: ' + telefono + '.');
      if (colonia) lineas.push('Colonia / C.P.: ' + colonia + '.');
      if (mensaje) lineas.push('Mensaje: ' + mensaje);
      var textoWhatsApp = lineas.join(' ');

      var url = (window.Rubicknet && window.Rubicknet.armarLinkWhatsApp)
        ? window.Rubicknet.armarLinkWhatsApp(textoWhatsApp)
        : ('https://wa.me/5568115210?text=' + encodeURIComponent(textoWhatsApp));
      window.open(url, '_blank', 'noopener');

      if (aviso) {
        aviso.style.display = 'block';
        aviso.textContent = 'Gracias por escribirnos. Abrimos WhatsApp con tu mensaje listo para enviar.';
      }
      formContacto.reset();
    });
  }

});
