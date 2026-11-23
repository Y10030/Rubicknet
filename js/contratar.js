/* Rubicknet · Contratar (internet y cámaras) */
(function () {
  var MAX_BYTES = 4 * 1024 * 1024;
  var IMAGENES = ['image/jpeg', 'image/png', 'image/webp'];
  var TIPOS = IMAGENES.concat(['application/pdf']);
  var WA_CAMARAS = '525611120232'; // (56) 1112 0232

  /* Estilos del botón: deshabilitado y animación de "Enviando…" */
  var estilo = document.createElement('style');
  estilo.textContent =
    '.btn:disabled{opacity:.5;cursor:not-allowed;}' +
    '.btn.enviando{opacity:1;cursor:progress;display:inline-flex;align-items:center;justify-content:center;gap:10px;}' +
    '.spinner-btn{width:18px;height:18px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:rbk-giro .7s linear infinite;}' +
    '@keyframes rbk-giro{to{transform:rotate(360deg);}}';
  document.head.appendChild(estilo);

  /* ---------- Borrador: guarda lo escrito para que no se pierda al recargar ----------
     sessionStorage = se conserva al recargar y se borra al cerrar la pestaña.
     (Cambia a window.localStorage si quieres que dure aunque cierren el navegador.)
     Los archivos (INE, comprobante) y las casillas de aceptación no se guardan. */
  var ALMACEN = window.sessionStorage;
  var CLAVE_I = 'rbk_borrador_internet', CLAVE_C = 'rbk_borrador_camaras';
  var NO_GUARDAR = { sitio_web: 1, formulario: 1, acepto_privacidad: 1, acepto_pagare: 1 };

  function leerBorrador(clave) { try { return JSON.parse(ALMACEN.getItem(clave) || 'null'); } catch (e) { return null; } }
  function guardarBorrador(clave, d) { try { ALMACEN.setItem(clave, JSON.stringify(d)); } catch (e) {} }
  function borrarBorrador(clave) { try { ALMACEN.removeItem(clave); } catch (e) {} }

  function capturar(form) {
    var d = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || NO_GUARDAR[el.name] || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) (d[el.name] = d[el.name] || []).push(el.value);
      } else if (el.value !== '') {
        d[el.name] = el.value;
      }
    });
    return d;
  }

  function restaurar(form, d) {
    if (!d) return false;
    var hubo = false;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || NO_GUARDAR[el.name] || el.type === 'file' || !(el.name in d)) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = d[el.name].indexOf(el.value) !== -1;
        if (el.type === 'checkbox') { var chip = el.closest('.chip-check'); if (chip) chip.classList.toggle('marcada', el.checked); }
      } else {
        el.value = d[el.name];
      }
      hubo = true;
    });
    return hubo;
  }

  function autoguardar(form, clave) {
    var t;
    var guardar = function () { clearTimeout(t); t = setTimeout(function () { guardarBorrador(clave, capturar(form)); }, 250); };
    form.addEventListener('input', guardar);
    form.addEventListener('change', guardar);
  }

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

    /* El botón solo se activa si están marcadas las dos casillas de confirmación */
    var chkPagare = formInternet.elements['acepto_pagare'];
    var chkPriv = formInternet.elements['acepto_privacidad'];
    var textoBtn = btnI.textContent;
    var enviando = false;
    function actualizarBoton() {
      btnI.disabled = enviando || !(chkPagare.checked && chkPriv.checked);
    }
    formInternet.addEventListener('change', actualizarBoton);
    actualizarBoton();

    var campoLink = document.getElementById('ubicacion_link_ro');   // solo lectura

    function enlaceMaps(lat, lng) {
      return 'https://www.google.com/maps?q=' + lat.toFixed(6) + ',' + lng.toFixed(6);
    }

    function guardarPunto(lat, lng) {
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
      estado.textContent = 'Ubicación marcada ✓';
      estado.classList.add('ok');
      if (campoLink) campoLink.value = enlaceMaps(lat, lng);
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
      if (campoLink) campoLink.value = '';
      estado.textContent = 'Aún no marcas tu ubicación.';
      estado.classList.remove('ok');
    }

    if (window.L && mapaEl) {
      mapa = L.map(mapaEl, { scrollWheelZoom: false }).setView([19.6013, -99.0506], 13); // Ecatepec
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        referrerPolicy: 'origin', // OSM exige Referer válido o bloquea los mosaicos (403)
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
      var cl = document.getElementById('campo-link-auto'); if (cl) cl.style.display = 'none';
    }

    /* Recupera lo escrito si se recargó la página */
    var recuperado = restaurar(formInternet, leerBorrador(CLAVE_I));
    if (mapa && inputLat.value && inputLng.value) {
      ponerPunto(parseFloat(inputLat.value), parseFloat(inputLng.value), true);
    }
    if (recuperado && avisoI) {
      avisoI.textContent = 'Recuperamos lo que habías escrito. Por seguridad, vuelve a adjuntar tus documentos y acepta las confirmaciones.';
      avisoI.style.display = 'block';
    }
    autoguardar(formInternet, CLAVE_I);

    formInternet.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando || !(chkPagare.checked && chkPriv.checked)) return;
      var errorArchivos = revisarArchivos(formInternet);
      if (errorArchivos) return mostrar(avisoI, errorArchivos, true);

      if (!inputLat.value && !inputLink.value.trim()) {
        if (mapaEl) mapaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return mostrar(avisoI, 'Marca tu ubicación en el mapa para continuar.', true);
      }

      enviando = true;
      btnI.disabled = true;
      btnI.classList.add('enviando');
      btnI.setAttribute('aria-busy', 'true');
      btnI.innerHTML = '<span class="spinner-btn" aria-hidden="true"></span> Enviando…';

      fetch(formInternet.action, { method: 'POST', body: new FormData(formInternet) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            mostrar(avisoI, 'Recibimos tu solicitud. Te contactaremos para confirmar cobertura y agendar tu instalación.', false);
            formInternet.reset();
            limpiarMapa();
            borrarBorrador(CLAVE_I);
            formInternet.querySelectorAll('.chip-check').forEach(function (c) { c.classList.remove('marcada'); });
          } else {
            mostrar(avisoI, (data && data.mensaje) || 'No pudimos enviar tu solicitud.', true);
          }
        })
        .catch(function () {
          mostrar(avisoI, 'No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo o escríbenos por WhatsApp al (55) 68 11 52 10.', true);
        })
        .then(function () {
          enviando = false;
          btnI.classList.remove('enviando');
          btnI.removeAttribute('aria-busy');
          btnI.textContent = textoBtn;
          actualizarBoton(); /* tras reset() las casillas quedan sin marcar: el botón vuelve a bloquearse */
        });
    });
  }

  /* ---------- Cámaras y automatización ---------- */
  var formCam = document.getElementById('form-camaras');
  if (formCam) {
    var avisoC = document.getElementById('aviso-camaras');
    var servicios = Array.prototype.slice.call(formCam.querySelectorAll('input[name="servicio"]'));

    restaurar(formCam, leerBorrador(CLAVE_C));
    autoguardar(formCam, CLAVE_C);

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
      borrarBorrador(CLAVE_C);
      mostrar(avisoC, 'Abrimos WhatsApp con tu mensaje listo. Solo presiona enviar para que llegue a nuestro equipo.', false);
    });
  }
})();