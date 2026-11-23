/* Rubicknet · Contratar (internet y cámaras) */
(function () {
  var MAX_BYTES = 4 * 1024 * 1024;
  var IMAGENES = ['image/jpeg', 'image/png', 'image/webp'];
  var TIPOS = IMAGENES.concat(['application/pdf']);
  var WA_CAMARAS = '525611120232'; // (56) 1112 0232

  function mostrar(el, texto, error) {
    if (!el) return;
    el.textContent = texto;
    el.style.display = 'block';
    el.classList.toggle('error', !!error);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function revisarArchivos(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) {
      var permitidos = /^ine_/.test(inputs[i].name) ? IMAGENES : TIPOS;
      var files = inputs[i].files;
      for (var j = 0; j < files.length; j++) {
        if (files[j].size > MAX_BYTES) return 'El archivo "' + files[j].name + '" pesa más de 4 MB. Reduce su tamaño e inténtalo de nuevo.';
        if (permitidos.indexOf(files[j].type) === -1) {
          return /^ine_/.test(inputs[i].name)
            ? 'La INE debe subirse como imagen (JPG, PNG o WEBP): "' + files[j].name + '" no es válida.'
            : 'El archivo "' + files[j].name + '" no es JPG, PNG, WEBP ni PDF.';
        }
      }
    }
    return '';
  }

  /* ---------- Internet ---------- */
  var formInternet = document.getElementById('form-contratar');
  if (formInternet) {
    var avisoI = document.getElementById('aviso-contratar');
    var btnI = document.getElementById('btn-contratar');
    var inputLat = document.getElementById('lat');
    var inputLng = document.getElementById('lng');
    var inputLink = document.getElementById('ubicacion_link');
    var estado = document.getElementById('mapa-estado');
    var btnUbic = document.getElementById('btn-mi-ubicacion');
    var mapaEl = document.getElementById('mapa-ubicacion');
    var mapa = null, marcador = null;

    function guardarPunto(lat, lng) {
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
      estado.textContent = 'Ubicación marcada ✓';
      estado.classList.add('ok');
    }
    function ponerPunto(lat, lng, acercar) {
      if (!marcador) {
        marcador = L.marker([lat, lng], { draggable: true }).addTo(mapa);
        marcador.on('dragend', function () { var p = marcador.getLatLng(); guardarPunto(p.lat, p.lng); });
      } else {
        marcador.setLatLng([lat, lng]);
      }
      guardarPunto(lat, lng);
      if (acercar) mapa.setView([lat, lng], 17);
    }
    function limpiarMapa() {
      if (marcador && mapa) { mapa.removeLayer(marcador); marcador = null; }
      inputLat.value = ''; inputLng.value = '';
      estado.textContent = 'Aún no marcas tu ubicación.';
      estado.classList.remove('ok');
    }

    if (window.L && mapaEl) {
      mapa = L.map(mapaEl, { scrollWheelZoom: false }).setView([19.6013, -99.0506], 13); // Ecatepec
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapa);
      mapa.on('click', function (e) { ponerPunto(e.latlng.lat, e.latlng.lng, false); });
      setTimeout(function () { mapa.invalidateSize(); }, 300);

      btnUbic.addEventListener('click', function () {
        if (!navigator.geolocation) { estado.textContent = 'Tu navegador no permite obtener la ubicación. Toca el mapa para marcarla.'; return; }
        estado.textContent = 'Buscando tu ubicación…';
        navigator.geolocation.getCurrentPosition(
          function (pos) { ponerPunto(pos.coords.latitude, pos.coords.longitude, true); },
          function () { estado.textContent = 'No pudimos obtener tu ubicación. Toca el mapa para marcarla.'; },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    } else {
      /* Sin mapa (no cargó la librería): se pide el enlace de Google Maps */
      if (mapaEl) mapaEl.style.display = 'none';
      if (btnUbic) btnUbic.style.display = 'none';
      estado.style.display = 'none';
      inputLink.hidden = false;
    }

    formInternet.addEventListener('submit', function (e) {
      e.preventDefault();
      var errorArchivos = revisarArchivos(formInternet);
      if (errorArchivos) return mostrar(avisoI, errorArchivos, true);

      if (!inputLat.value && !inputLink.value.trim()) {
        if (mapaEl) mapaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return mostrar(avisoI, 'Marca tu ubicación en el mapa para continuar.', true);
      }

      btnI.disabled = true;
      var textoBtn = btnI.textContent;
      btnI.textContent = 'Enviando…';

      fetch(formInternet.action, { method: 'POST', body: new FormData(formInternet) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            mostrar(avisoI, 'Recibimos tu solicitud. Te contactaremos para confirmar cobertura y agendar tu instalación.', false);
            formInternet.reset();
            limpiarMapa();
            formInternet.querySelectorAll('.chip-check').forEach(function (c) { c.classList.remove('marcada'); });
          } else {
            mostrar(avisoI, (data && data.mensaje) || 'No pudimos enviar tu solicitud.', true);
          }
        })
        .catch(function () {
          mostrar(avisoI, 'No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo o escríbenos por WhatsApp al (55) 68 11 52 10.', true);
        })
        .then(function () { btnI.disabled = false; btnI.textContent = textoBtn; });
    });
  }

  /* ---------- Cámaras y automatización ---------- */
  var formCam = document.getElementById('form-camaras');
  if (formCam) {
    var avisoC = document.getElementById('aviso-camaras');
    var servicios = Array.prototype.slice.call(formCam.querySelectorAll('input[name="servicio"]'));

    formCam.addEventListener('submit', function (e) {
      e.preventDefault();
      var elegidos = servicios.filter(function (s) { return s.checked; }).map(function (s) { return s.value; });
      if (!elegidos.length) return mostrar(avisoC, 'Elige al menos una opción: cámaras con grabador, sin grabador o portón y cerraduras.', true);

      var v = function (n) { return (formCam.elements[n] && formCam.elements[n].value.trim()) || ''; };
      var tipo = (formCam.querySelector('input[name="tipo"]:checked') || {}).value || '';
      var lineas = ['Hola, quiero cotizar cámaras y automatización.'];
      lineas.push('Para: ' + tipo + '.');
      lineas.push('Interés: ' + elegidos.join(', ') + '.');
      lineas.push('Nombre: ' + v('nombre') + '.');
      lineas.push('Teléfono: ' + v('telefono') + '.');
      if (v('correo')) lineas.push('Correo: ' + v('correo') + '.');
      if (v('colonia')) lineas.push('Colonia / C.P.: ' + v('colonia') + '.');
      if (v('mensaje')) lineas.push('Mensaje: ' + v('mensaje'));

      /* Respaldo por correo (no bloquea la apertura de WhatsApp) */
      try {
        var datos = new FormData(formCam);
        datos.delete('servicio');
        elegidos.forEach(function (s) { datos.append('servicio[]', s); });
        fetch(formCam.action, { method: 'POST', body: datos, keepalive: true }).catch(function () {});
      } catch (err) {}

      window.open('https://wa.me/' + WA_CAMARAS + '?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
      mostrar(avisoC, 'Abrimos WhatsApp con tu mensaje listo. Solo presiona enviar para que llegue a nuestro equipo.', false);
    });
  }
})();
