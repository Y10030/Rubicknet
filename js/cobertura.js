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

  /* Clave de localStorage donde se guarda la última zona con cobertura
     confirmada (por texto, autocompletado o ubicación). whatsapp.js lee
     esta misma clave para agregarla automáticamente al cotizar. */
  var CLAVE_ULTIMA_ZONA = 'rbk_ultima_zona';

  function guardarUltimaZona(zona) {
    if (!zona) return;
    try {
      localStorage.setItem(CLAVE_ULTIMA_ZONA, JSON.stringify({
        clave: zona.clave,
        nombre: zona.nombre,
        estado: zona.estado,
        guardadoEn: Date.now()
      }));
    } catch (e) {
      // localStorage no disponible (modo privado, cuota llena, etc.): no es crítico.
    }
  }

  function normalizarTexto(str) {
    return (str || '').toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  /* Compara "por palabras": cada palabra de lo que escribió el usuario debe
     aparecer dentro del candidato (o viceversa), sin importar el orden.
     Así "morelos jardines" o solo "jardines morelos" también encuentran
     "Jardines de Morelos", y no solo una coincidencia exacta de substring. */
  function coincideTexto(candidatoNormalizado, textoNormalizado) {
    if (!candidatoNormalizado || !textoNormalizado) return false;
    if (candidatoNormalizado.indexOf(textoNormalizado) !== -1) return true;
    if (textoNormalizado.indexOf(candidatoNormalizado) !== -1) return true;

    var palabrasTexto = textoNormalizado.split(/\s+/).filter(function (p) { return p.length > 1; });
    if (!palabrasTexto.length) return false;
    return palabrasTexto.every(function (palabra) {
      return candidatoNormalizado.indexOf(palabra) !== -1;
    });
  }

  function buscarPorTexto(texto) {
    var t = normalizarTexto(texto);
    if (!t) return null;
    for (var i = 0; i < zonas.length; i++) {
      var zona = zonas[i];
      var candidatos = [zona.nombre, zona.clave, zona.titulo].concat(zona.zonas || []);
      for (var j = 0; j < candidatos.length; j++) {
        var n = normalizarTexto(candidatos[j]);
        if (n && coincideTexto(n, t)) return zona;
      }
    }
    return null;
  }

  /* Devuelve hasta `max` sugerencias { etiqueta, zona } que coincidan con lo
     que el usuario va escribiendo, buscando tanto en el nombre de la zona
     como en cada colonia individual (zona.zonas), para que autocompletar
     "las am" ya muestre "Las Américas — Ecatepec". Las coincidencias que
     empiezan igual que lo escrito se priorizan sobre las que solo lo
     contienen en medio. */
  function obtenerSugerencias(texto, max) {
    var t = normalizarTexto(texto);
    if (!t) return [];
    max = max || 6;

    var vistos = {};
    var empiezan = [];
    var contienen = [];
    var porPalabras = [];

    zonas.forEach(function (zona) {
      var candidatos = (zona.zonas && zona.zonas.length) ? zona.zonas.slice() : [zona.nombre];
      if (zona.titulo && candidatos.indexOf(zona.titulo) === -1) candidatos.push(zona.titulo);
      if (zona.zonas && zona.zonas.length && normalizarTexto(zona.nombre).indexOf(t) !== -1) {
        candidatos = candidatos.concat([zona.nombre]);
      }
      candidatos.forEach(function (candidato) {
        var n = normalizarTexto(candidato);
        if (!n) return;
        var clave = n + '|' + zona.clave;
        if (vistos[clave]) return;

        var pos = n.indexOf(t);
        var item = { etiqueta: candidato, zona: zona };

        if (pos !== -1) {
          vistos[clave] = true;
          if (pos === 0) empiezan.push(item); else contienen.push(item);
        } else if (coincideTexto(n, t)) {
          // No aparece como substring seguido, pero todas las palabras
          // escritas están presentes (p. ej. "morelos jardines").
          vistos[clave] = true;
          porPalabras.push(item);
        }
      });
    });

    return empiezan.concat(contienen).concat(porPalabras).slice(0, max);
  }

  /* ---------- Autocompletado ---------- */

  function inyectarEstilosAutocompletado() {
    if (document.getElementById('rubicknet-autocomplete-estilos')) return;
    var style = document.createElement('style');
    style.id = 'rubicknet-autocomplete-estilos';
    style.textContent =
      '.rbk-autocomplete-wrap{position:relative;}' +
      '.rbk-autocomplete{position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:60;' +
      'background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.18);' +
      'overflow:hidden;border:1px solid rgba(15,23,42,.08);}' +
      '.rbk-autocomplete ul{list-style:none;margin:0;padding:6px;max-height:280px;overflow-y:auto;}' +
      '.rbk-autocomplete li{margin:0;}' +
      '.rbk-autocomplete button{width:100%;text-align:left;display:flex;flex-direction:column;gap:1px;' +
      'padding:10px 12px;border:0;background:none;border-radius:9px;cursor:pointer;font-family:inherit;}' +
      '.rbk-autocomplete button:hover,.rbk-autocomplete button.activa{background:rgba(0,51,255,.07);}' +
      '.rbk-autocomplete .rbk-ac-colonia{font-size:.94rem;font-weight:600;color:#0f172a;}' +
      '.rbk-autocomplete .rbk-ac-zona{font-size:.8rem;color:#64748b;}';
    document.head.appendChild(style);
  }

  function inicializarAutocompletado(form) {
    var input = form.querySelector('input[type="text"]');
    if (!input) return;

    inyectarEstilosAutocompletado();

    // El dropdown se posiciona relativo al padre inmediato del input (que
    // normalmente es el propio <form>), así que ese padre necesita position:relative.
    var contenedor = input.parentElement || form;
    contenedor.classList.add('rbk-autocomplete-wrap');
    if (getComputedStyle(contenedor).position === 'static') {
      contenedor.style.position = 'relative';
    }

    var panel = document.createElement('div');
    panel.className = 'rbk-autocomplete';
    panel.style.display = 'none';
    var lista = document.createElement('ul');
    panel.appendChild(lista);
    contenedor.appendChild(panel);

    var activo = -1;
    var sugerenciasActuales = [];

    function ocultar() {
      panel.style.display = 'none';
      activo = -1;
      sugerenciasActuales = [];
    }

    function seleccionar(item) {
      input.value = item.etiqueta;
      ocultar();

      // Guardamos la zona de una vez (por si a continuación redirigimos y
      // nunca llegamos a emitir(), que es donde normalmente se persiste).
      guardarUltimaZona(item.zona);

      // Mismo comportamiento que al enviar el formulario: si no estamos ya
      // en la página del mapa (internet.html), mandamos ahí al usuario para
      // que vea el mapa real y los botones de "Ver planes" / "Cotizar".
      // Antes, elegir una sugerencia solo llenaba el input y nunca llegaba
      // a este redirect porque seleccionar() no lo replicaba.
      var yaEnMapa = !!document.getElementById('mapa-panel-google');
      if (!yaEnMapa) {
        window.location.href = 'internet.html?colonia=' + encodeURIComponent(item.etiqueta) + '#ciudades-nav';
        return;
      }

      avisar(form, '¡Buena noticia! Ya tenemos presencia en <strong>' + item.zona.nombre + '</strong> (' + item.zona.estado + ').', 'si', { ctaHref: '#plan-recomendado', ctaLabel: 'Ver planes' });
      emitir(form, { origen: 'autocompletado', encontrado: true, zona: item.zona });
    }

    function pintar(sugerencias) {
      sugerenciasActuales = sugerencias;
      activo = -1;
      lista.innerHTML = '';

      if (!sugerencias.length) { ocultar(); return; }

      var yaVisible = panel.style.display === 'block';

      sugerencias.forEach(function (item, i) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML =
          '<span class="rbk-ac-colonia">' + item.etiqueta + '</span>' +
          '<span class="rbk-ac-zona">' + item.zona.titulo + '</span>';
        btn.addEventListener('mousedown', function (e) {
          // mousedown (no click) para que dispare antes del blur del input
          e.preventDefault();
          seleccionar(item);
        });
        li.appendChild(btn);
        lista.appendChild(li);
      });

      panel.style.display = 'block';

      // Al abrirse por primera vez, centra el buscador + la lista de
      // sugerencias en pantalla, para que en móvil el teclado no las
      // tape y el usuario vea de inmediato las ubicaciones recomendadas.
      if (!yaVisible) {
        setTimeout(function () {
          contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    }

    function actualizarActivo() {
      var botones = lista.querySelectorAll('button');
      botones.forEach(function (b, i) { b.classList.toggle('activa', i === activo); });
      if (activo >= 0 && botones[activo]) {
        botones[activo].scrollIntoView({ block: 'nearest' });
      }
    }

    input.addEventListener('input', function () {
      cargar().then(function () {
        pintar(obtenerSugerencias(input.value));
      });
    });

    input.addEventListener('keydown', function (e) {
      if (panel.style.display === 'none' || !sugerenciasActuales.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activo = Math.min(activo + 1, sugerenciasActuales.length - 1);
        actualizarActivo();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activo = Math.max(activo - 1, 0);
        actualizarActivo();
      } else if (e.key === 'Enter') {
        if (activo >= 0) {
          e.preventDefault();
          seleccionar(sugerenciasActuales[activo]);
        }
      } else if (e.key === 'Escape') {
        ocultar();
      }
    });

    input.addEventListener('focus', function () {
      if (input.value.trim()) {
        cargar().then(function () { pintar(obtenerSugerencias(input.value)); });
      }
    });

    document.addEventListener('click', function (e) {
      if (!contenedor.contains(e.target)) ocultar();
    });
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
    if (detalle && detalle.encontrado && detalle.zona) {
      guardarUltimaZona(detalle.zona);
    }
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
      '@media (max-width:560px){.cobertura-buscador-fila{flex-direction:column;} .cobertura-buscador-fila .buscador-cobertura{flex:1 1 auto;} .rbk-btn-ubicacion{padding:13px 22px;justify-content:center;}}';
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

  function avisar(form, texto, variante, opciones) {
    // Usa la notificación flotante si la página la define (internet.html la
    // trae); si no existe (otras páginas), cae en el mensaje inline de siempre,
    // agregando el botón CTA (p. ej. "Ver planes") como link dentro del texto.
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast(texto, variante, null, opciones);
    } else {
      var html = texto;
      if (opciones && opciones.ctaHref && opciones.ctaLabel) {
        html += '<br><a href="' + opciones.ctaHref + '" class="btn btn-primario" ' +
          'style="margin-top:10px;padding:9px 18px;font-size:.85rem;">' + opciones.ctaLabel + '</a>';
      }
      mostrar(form, html, variante);
    }
  }

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
          mostrar(form, 'Escribe tu colonia para consultar.', 'no');
          return;
        }

        // Si no estamos ya en la página del mapa de cobertura (internet.html),
        // mandamos ahí al usuario con su búsqueda, para que vea el mapa real
        // y, si hay cobertura, los botones de "Ver planes" / "Cotizar".
        var yaEnMapa = !!document.getElementById('mapa-panel-google');
        if (!yaEnMapa) {
          var zonaPrevia = buscarPorTexto(texto);
          if (zonaPrevia) guardarUltimaZona(zonaPrevia);
          window.location.href = 'internet.html?colonia=' + encodeURIComponent(texto) + '#ciudades-nav';
          return;
        }

        var zona = buscarPorTexto(texto);
        if (zona) {
          avisar(form, '¡Buena noticia! Ya tenemos presencia en <strong>' + zona.nombre + '</strong> (' + zona.estado + ').', 'si', { ctaHref: '#plan-recomendado', ctaLabel: 'Ver planes' });
          emitir(form, { origen: 'texto', encontrado: true, zona: zona });
        } else {
          avisar(form, 'Por ahora no encontramos esa colonia en nuestra cobertura confirmada. <a href="contacto.html">Contáctanos</a> para revisar tu caso a detalle.', 'no');
          emitir(form, { origen: 'texto', encontrado: false });
        }
      });
    });

    btnUbicacion.addEventListener('click', function () {
      if (!navigator.geolocation) {
        avisar(form, 'Tu navegador no permite obtener tu ubicación. Usa el buscador con tu colonia.', 'no');
        return;
      }

      mostrar(form, 'Obteniendo tu ubicación…', null);
      btnUbicacion.disabled = true;

      navigator.geolocation.getCurrentPosition(function (pos) {
        btnUbicacion.disabled = false;
        mostrar(form, '', null);

        cargar().then(function () {
          if (!zonas.length) {
            avisar(form, 'Aún estamos cargando la información de cobertura, intenta de nuevo en un momento.', null);
            return;
          }

          var encontrado = buscarPorCoordenadas(pos.coords.latitude, pos.coords.longitude);

          if (encontrado && encontrado.tipo === 'activa') {
            avisar(form, '¡Buenas noticias! Tu ubicación está dentro de la cobertura activa de <strong>' + encontrado.zona.nombre + '</strong>.', 'si', { ctaHref: 'internet.html#plan-recomendado', ctaLabel: 'Ver planes' });
            emitir(form, { origen: 'ubicacion', encontrado: true, zona: encontrado.zona, tipoPoligono: 'activa' });
          } else if (encontrado) {
            avisar(form, 'Tu ubicación está en una zona en expansión de <strong>' + encontrado.zona.nombre + '</strong>. Pronto tendremos cobertura ahí.', 'expansion');
            emitir(form, { origen: 'ubicacion', encontrado: true, zona: encontrado.zona, tipoPoligono: 'expansion' });
          } else {
            avisar(form, 'Por ahora no tenemos cobertura confirmada en tu ubicación exacta. Usa el buscador o <a href="contacto.html">contáctanos</a> para más detalles.', 'no');
            emitir(form, { origen: 'ubicacion', encontrado: false });
          }
        });
      }, function () {
        btnUbicacion.disabled = false;
        mostrar(form, '', null);
        avisar(form, 'No pudimos obtener tu ubicación. Revisa los permisos de ubicación en tu navegador o usa el buscador.', 'no');
      }, { enableHighAccuracy: true, timeout: 10000 });
    });

    inicializarAutocompletado(form);
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
    obtenerSugerencias: obtenerSugerencias,
    buscarPorCoordenadas: buscarPorCoordenadas,
    puntoDentroPoligono: puntoDentroPoligono,
    guardarUltimaZona: guardarUltimaZona
  };
})();