/**
 * Rubicknet · Cobertura
 * ----------------------
 * Lógica real de cobertura, compartida por cualquier página que tenga
 * un <form class="form-cobertura">. Se encarga de:
 *   1. Cargar data/cobertura.json una sola vez (y cachearlo).
 *   2. Buscar cobertura por texto (colonia / código postal / nombre de zona).
 *   3. Buscar cobertura por geolocalización del navegador.
 *   4. Inyectar automáticamente el botón "Usar mi ubicación" al lado
 *      del botón de búsqueda, en TODOS los formularios .form-cobertura.
 *
 * Páginas con mapa (como internet.html) pueden escuchar el evento
 * 'rubicknet:cobertura-resultado' que dispara cada formulario para
 * pintar el mapa, sin tener que duplicar la lógica de búsqueda.
 */
(function () {
  var RUTA_JSON = 'data/cobertura.json';
  var zonas = [];
  var promesaCarga = null;

  function normalizarTexto(str) {
    return (str || '').toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  function buscarPorTexto(texto) {
    var t = normalizarTexto(texto);
    if (!t) return null;
    for (var i = 0; i < zonas.length; i++) {
      var zona = zonas[i];
      var candidatos = [zona.nombre, zona.clave].concat(zona.zonas || []);
      for (var j = 0; j < candidatos.length; j++) {
        var n = normalizarTexto(candidatos[j]);
        if (n && (n.indexOf(t) !== -1 || t.indexOf(n) !== -1)) return zona;
      }
    }
    return null;
  }

  function puntoDentroPoligono(lat, lng, path) {
    var dentro = false;
    for (var i = 0, j = path.length - 1; i < path.length; j = i++) {
      var xi = path[i].lat, yi = path[i].lng;
      var xj = path[j].lat, yj = path[j].lng;
      var cruza = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (cruza) dentro = !dentro;
    }
    return dentro;
  }

  function buscarPorCoordenadas(lat, lng) {
    for (var i = 0; i < zonas.length; i++) {
      var zona = zonas[i];
      var poligonos = zona.poligonos || [];
      for (var j = 0; j < poligonos.length; j++) {
        if (puntoDentroPoligono(lat, lng, poligonos[j].path || [])) {
          return { zona: zona, tipo: poligonos[j].tipo };
        }
      }
    }
    return null;
  }

  function cargar() {
    if (!promesaCarga) {
      promesaCarga = fetch(RUTA_JSON, { cache: 'no-store' })
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(function (data) {
          zonas = data || [];
          return zonas;
        })
        .catch(function (err) {
          console.error('No se pudo cargar ' + RUTA_JSON, err);
          zonas = [];
          return zonas;
        });
    }
    return promesaCarga;
  }

  /* ---------- UI: resultado y botón de ubicación ---------- */

  function elementoResultado(form) {
    // Caso normal: el <p class="resultado-cobertura"> es hermano directo del form.
    var el = form.nextElementSibling;
    if (el && el.classList && el.classList.contains('resultado-cobertura')) return el;

    // Caso tras inyectar el botón "Usar mi ubicación": el form quedó envuelto
    // dentro de un .cobertura-buscador-fila, así que hay que subir un nivel
    // para encontrar al hermano que sigue siendo el <p> de resultado.
    var wrap = form.closest('.cobertura-buscador-fila');
    if (wrap) {
      el = wrap.nextElementSibling;
      if (el && el.classList && el.classList.contains('resultado-cobertura')) return el;
      if (wrap.parentElement) {
        el = wrap.parentElement.querySelector('.resultado-cobertura');
        if (el) return el;
      }
    }

    return form.parentElement ? form.parentElement.querySelector('.resultado-cobertura') : null;
  }

  function mostrar(form, html, variante) {
    var el = elementoResultado(form);
    if (!el) return;
    el.innerHTML = html;
    el.className = 'resultado-cobertura mostrar' + (variante ? ' resultado-cobertura--' + variante : '');
  }

  function emitir(form, detalle) {
    form.dispatchEvent(new CustomEvent('rubicknet:cobertura-resultado', { bubbles: true, detail: detalle }));
  }

  function inyectarEstilos() {
    if (document.getElementById('rubicknet-cobertura-estilos')) return;
    var style = document.createElement('style');
    style.id = 'rubicknet-cobertura-estilos';
    style.textContent =
      '.cobertura-buscador-fila{display:flex;flex-wrap:wrap;gap:12px;align-items:stretch;}' +
      '.cobertura-buscador-fila .buscador-cobertura{flex:1 1 320px;}' +
      '.rbk-btn-ubicacion{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;' +
      'padding:0 22px;border-radius:999px;border:1.5px solid rgba(255,255,255,0.35);' +
      'background:rgba(255,255,255,0.04);color:#fff;font-family:inherit;font-size:.92rem;font-weight:500;' +
      'cursor:pointer;transition:all .15s ease;}' +
      '.rbk-btn-ubicacion:hover{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.09);}' +
      '.rbk-btn-ubicacion:disabled{opacity:.55;cursor:default;}' +
      '.rbk-btn-ubicacion svg{width:17px;height:17px;flex-shrink:0;}' +
      '@media (max-width:560px){.cobertura-buscador-fila{flex-direction:column;} .rbk-btn-ubicacion{padding:13px 22px;justify-content:center;}}';
    document.head.appendChild(style);
  }

  function asegurarBotonUbicacion(form) {
    var existente = form.parentElement && form.parentElement.querySelector('.rbk-btn-ubicacion');
    if (existente) return existente;

    inyectarEstilos();

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rbk-btn-ubicacion';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>' +
      '<span>Usar mi ubicación</span>';

    // Envuelve el form + botón en una fila flex para que siempre queden juntos
    var wrap = document.createElement('div');
    wrap.className = 'cobertura-buscador-fila';
    form.parentElement.insertBefore(wrap, form);
    wrap.appendChild(form);
    wrap.appendChild(btn);

    return btn;
  }

  /* ---------- Inicialización por formulario ---------- */

  function inicializarForm(form) {
    var btnUbicacion = asegurarBotonUbicacion(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="text"]');
      var texto = input ? input.value : '';

      cargar().then(function () {
        if (!zonas.length) {
          mostrar(form, 'Estamos cargando la información de cobertura, intenta de nuevo en unos segundos.', null);
          return;
        }
        if (!normalizarTexto(texto)) {
          mostrar(form, 'Escribe tu colonia o código postal para consultar.', 'no');
          return;
        }

        var zona = buscarPorTexto(texto);
        if (zona) {
          mostrar(form, '¡Buena noticia! Ya tenemos presencia en <strong>' + zona.nombre + '</strong> (' + zona.estado + ').', 'si');
          emitir(form, { origen: 'texto', encontrado: true, zona: zona });
        } else {
          mostrar(form, 'Por ahora no encontramos esa colonia o código postal en nuestra cobertura confirmada. <a href="contacto.html">Contáctanos</a> para revisar tu caso a detalle.', 'no');
          emitir(form, { origen: 'texto', encontrado: false });
        }
      });
    });

    btnUbicacion.addEventListener('click', function () {
      if (!navigator.geolocation) {
        mostrar(form, 'Tu navegador no permite obtener tu ubicación. Usa el buscador con tu colonia o código postal.', 'no');
        return;
      }

      mostrar(form, 'Obteniendo tu ubicación…', null);
      btnUbicacion.disabled = true;

      navigator.geolocation.getCurrentPosition(function (pos) {
        btnUbicacion.disabled = false;

        cargar().then(function () {
          if (!zonas.length) {
            mostrar(form, 'Aún estamos cargando la información de cobertura, intenta de nuevo en un momento.', null);
            return;
          }

          var encontrado = buscarPorCoordenadas(pos.coords.latitude, pos.coords.longitude);

          if (encontrado && encontrado.tipo === 'activa') {
            mostrar(form, '¡Buenas noticias! Tu ubicación está dentro de la cobertura activa de <strong>' + encontrado.zona.nombre + '</strong>.', 'si');
            emitir(form, { origen: 'ubicacion', encontrado: true, zona: encontrado.zona, tipoPoligono: 'activa' });
          } else if (encontrado) {
            mostrar(form, 'Tu ubicación está en una zona en expansión de <strong>' + encontrado.zona.nombre + '</strong>. Pronto tendremos cobertura ahí.', 'expansion');
            emitir(form, { origen: 'ubicacion', encontrado: true, zona: encontrado.zona, tipoPoligono: 'expansion' });
          } else {
            mostrar(form, 'Por ahora no tenemos cobertura confirmada en tu ubicación exacta. Usa el buscador o <a href="contacto.html">contáctanos</a> para más detalles.', 'no');
            emitir(form, { origen: 'ubicacion', encontrado: false });
          }
        });
      }, function () {
        btnUbicacion.disabled = false;
        mostrar(form, 'No pudimos obtener tu ubicación. Revisa los permisos de ubicación en tu navegador o usa el buscador.', 'no');
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    cargar();
    document.querySelectorAll('form.form-cobertura').forEach(inicializarForm);
  });

  window.Rubicknet = window.Rubicknet || {};
  window.Rubicknet.cobertura = {
    cargar: cargar,
    normalizarTexto: normalizarTexto,
    buscarPorTexto: buscarPorTexto,
    buscarPorCoordenadas: buscarPorCoordenadas,
    puntoDentroPoligono: puntoDentroPoligono
  };
})();
