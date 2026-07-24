/**
 * <chat-widget> — asistente guiado flotante.
 * No es una IA conversacional: es un menú tipo chat que va haciendo
 * preguntas cortas de seguimiento (según el servicio elegido) para
 * armar un mensaje de WhatsApp mucho más preciso sobre lo que el
 * cliente necesita, y lo manda directo al WhatsApp de la empresa.
 * Cero backend, cero costo.
 */
class ChatWidget extends HTMLElement {
  connectedCallback() {

    /* ---------- Definición de flujos por servicio ----------
       Cada flujo tiene:
       - texto: lo que se muestra en el botón inicial
       - saludo: encabezado del mensaje final de WhatsApp
       - preguntas: preguntas de opción múltiple, una por una
         (clave, pregunta mostrada en el chat, resumen usado en el
         mensaje final, y las opciones como botones)
       - campoTexto (opcional): un último paso de texto libre
    */
    var flujos = [
      {
        id: 'internet',
        texto: 'Internet para hogar o negocio',
        saludo: 'Hola, quiero información sobre planes de internet.',
        preguntas: [
          { clave: 'tipo', resumen: 'Es para', pregunta: '¿Es para tu hogar o para tu negocio?', opciones: ['Hogar', 'Negocio'] },
          { clave: 'situacion', resumen: 'Situación actual', pregunta: '¿Ya tienes otro proveedor de internet o sería tu primera instalación?', opciones: ['Quiero cambiar de proveedor', 'Sería mi primera instalación', 'Solo quiero cotizar'] }
        ],
        campoTexto: { clave: 'zona', resumen: 'Colonia / C.P.', etiqueta: 'Por último, ¿cuál es tu colonia o código postal? Así podemos revisar cobertura.', placeholder: 'Ej. Jardines de Morelos, 55070' }
      },
      {
        id: 'cableado',
        texto: 'Cableado estructurado',
        saludo: 'Hola, quiero cotizar un servicio de cableado estructurado.',
        preguntas: [
          { clave: 'lugar', resumen: 'Lugar', pregunta: '¿Dónde se instalaría el cableado?', opciones: ['Oficina', 'Nave industrial / bodega', 'Local comercial', 'Otro'] },
          { clave: 'puntos', resumen: 'Puntos de red aprox.', pregunta: '¿Aproximadamente cuántos puntos de red necesitas?', opciones: ['1 a 10', '11 a 30', 'Más de 30', 'No estoy seguro'] },
          { clave: 'situacion', resumen: 'Situación', pregunta: '¿Es una instalación nueva o quieres mejorar una ya existente?', opciones: ['Instalación nueva', 'Mejorar cableado existente'] }
        ]
      },
      {
        id: 'redes',
        texto: 'Redes cableadas e inalámbricas',
        saludo: 'Hola, quiero cotizar redes cableadas e inalámbricas para mi negocio.',
        preguntas: [
          { clave: 'espacio', resumen: 'Espacio a cubrir', pregunta: '¿Qué tan grande es el espacio a cubrir?', opciones: ['Un piso u oficina', 'Varios pisos', 'Nave o bodega grande', 'Exteriores / varias áreas'] },
          { clave: 'problema', resumen: 'Problema principal', pregunta: '¿Cuál es el problema principal que quieres resolver?', opciones: ['Zonas sin señal Wi-Fi', 'Red lenta o inestable', 'Separar red de invitados', 'Instalación nueva'] }
        ]
      },
      {
        id: 'cctv',
        texto: 'Vigilancia y CCTV',
        saludo: 'Hola, quiero cotizar un sistema de cámaras y vigilancia.',
        preguntas: [
          { clave: 'lugar', resumen: 'Es para', pregunta: '¿Es para tu hogar, tu negocio o un condominio?', opciones: ['Hogar', 'Negocio', 'Condominio / bodega'] },
          { clave: 'camaras', resumen: 'Cámaras aprox.', pregunta: '¿Cuántas cámaras necesitas aproximadamente?', opciones: ['1 a 4', '5 a 10', 'Más de 10', 'No estoy seguro'] },
          { clave: 'extra', resumen: 'Además de cámaras', pregunta: '¿Necesitas algo más, además de cámaras?', opciones: ['Solo cámaras', 'Portón automático', 'Interphone', 'Cerradura digital'] }
        ]
      },
      {
        id: 'soporte',
        texto: 'Soporte y mantenimiento',
        saludo: 'Hola, quiero agendar soporte técnico o mantenimiento.',
        preguntas: [
          { clave: 'tipo', resumen: 'Tipo de soporte', pregunta: '¿Qué tipo de soporte necesitas?', opciones: ['Ya tengo una falla', 'Mantenimiento preventivo', 'Diagnóstico general'] },
          { clave: 'equipo', resumen: 'Sobre', pregunta: '¿Sobre qué equipo o servicio es?', opciones: ['Internet', 'Cableado / red', 'Cámaras', 'Varios'] }
        ]
      },
      {
        id: 'seguridad',
        texto: 'Seguridad informática',
        saludo: 'Hola, quiero cotizar un servicio de seguridad informática.',
        preguntas: [
          { clave: 'equipos', resumen: 'Equipos a proteger', pregunta: '¿Cuántos equipos necesitas proteger aproximadamente?', opciones: ['1 a 5', '6 a 20', 'Más de 20'] },
          { clave: 'necesidad', resumen: 'Necesita', pregunta: '¿Qué necesitas principalmente?', opciones: ['Antivirus', 'Firewall', 'Ambos', 'No estoy seguro'] }
        ]
      },
      {
        id: 'otro',
        texto: 'Otro / no estoy seguro',
        saludo: 'Hola, quiero más información. No estoy seguro de qué servicio necesito.',
        preguntas: [],
        campoTexto: { clave: 'detalle', resumen: 'Detalle', etiqueta: 'Cuéntame brevemente qué necesitas y te oriento.', placeholder: 'Ej. quiero mejorar el internet de mi oficina' }
      }
    ];

    this.innerHTML =
      '<style>' +
      '  chat-widget{position:static;display:block;font-family:var(--font-body,\'Inter\',sans-serif);}' +
      '  .rbk-burbuja{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;' +
      '    background:var(--gradient-diag,linear-gradient(135deg,#0033FF 0%,#977DFF 100%));' +
      '    box-shadow:0 8px 24px rgba(0,51,255,0.35);display:flex;align-items:center;justify-content:center;' +
      '    transition:transform .15s ease;color:#fff;}' +
      '  .rbk-burbuja:hover{transform:scale(1.06);}' +
      '  .rbk-burbuja svg{width:26px;height:26px;}' +
      /* El panel se ancla arriba del stack completo (bottom:100%) y anima
         de abajo hacia arriba con transform + opacity en vez de usar
         [hidden], que no se puede animar. */
      '  .rbk-panel{position:fixed;right:26px;bottom:26px;width:340px;max-width:calc(100vw - 52px);' +
      '    background:var(--white,#fff);border-radius:var(--radius-l,18px);overflow:hidden;' +
      '    box-shadow:0 20px 50px rgba(3,8,18,0.25);border:1px solid rgba(3,8,18,0.08);z-index:9999;' +
      '    transform-origin:bottom right;transform:translateY(18px) scale(.96);opacity:0;' +
      '    visibility:hidden;pointer-events:none;' +
      '    transition:transform .22s ease,opacity .18s ease,visibility 0s linear .22s;}' +
      '  .rbk-panel.abierto{transform:translateY(0) scale(1);opacity:1;visibility:visible;pointer-events:auto;' +
      '    transition:transform .22s ease,opacity .18s ease;}' +
      '  .rbk-cab{background:var(--navy-900,#00033D);color:#fff;padding:16px 18px;display:flex;' +
      '    align-items:center;justify-content:space-between;}' +
      '  .rbk-cab-info{display:flex;flex-direction:column;gap:2px;}' +
      '  .rbk-cab-info strong{font-family:var(--font-display,\'Space Grotesk\',sans-serif);font-size:.95rem;}' +
      '  .rbk-cab-info span{font-size:.72rem;color:rgba(234,237,248,0.7);display:flex;align-items:center;gap:5px;}' +
      '  .rbk-punto{width:7px;height:7px;border-radius:50%;background:#3ddc84;display:inline-block;}' +
      '  .rbk-cerrar{background:none;border:none;color:#fff;font-size:1.3rem;line-height:1;cursor:pointer;opacity:.8;}' +
      '  .rbk-cerrar:hover{opacity:1;}' +
      '  .rbk-cuerpo{max-height:min(64vh,520px);overflow-y:auto;padding:16px;background:var(--mist-100,#EAEDF8);}' +
      '  .rbk-msg-bot{background:#fff;border-radius:14px 14px 14px 4px;padding:10px 13px;font-size:.85rem;' +
      '    line-height:1.45;color:var(--ink-950,#030812);box-shadow:0 1px 2px rgba(3,8,18,0.06);margin-bottom:12px;max-width:92%;}' +
      '  .rbk-msg-usuario{background:var(--gradient-diag,linear-gradient(135deg,#0033FF 0%,#977DFF 100%));' +
      '    color:#fff;border-radius:14px 14px 4px 14px;padding:9px 13px;font-size:.85rem;line-height:1.4;' +
      '    margin:0 0 12px auto;max-width:80%;text-align:right;}' +
      '  .rbk-opciones{display:flex;flex-direction:column;gap:8px;margin-bottom:4px;}' +
      '  .rbk-opcion{text-align:left;background:#fff;border:1px solid rgba(3,8,18,0.10);border-radius:10px;' +
      '    padding:10px 12px;font-size:.83rem;font-family:var(--font-body,\'Inter\',sans-serif);color:var(--ink-950,#030812);' +
      '    cursor:pointer;transition:border-color .15s ease,transform .1s ease;}' +
      '  .rbk-opcion:hover{border-color:var(--blue-600,#0033FF);transform:translateX(2px);}' +
      '  .rbk-opcion:disabled{opacity:.5;cursor:default;transform:none;}' +
      '  .rbk-progreso{display:flex;gap:5px;margin-bottom:14px;}' +
      '  .rbk-progreso span{height:3px;flex:1;border-radius:3px;background:rgba(3,8,18,0.10);}' +
      '  .rbk-progreso span.hecho{background:var(--blue-600,#0033FF);}' +
      '  .rbk-input-fila{display:flex;gap:8px;margin-top:2px;}' +
      '  .rbk-input-fila input{flex:1;border:1px solid rgba(3,8,18,0.16);border-radius:10px;padding:10px 12px;' +
      '    font-family:inherit;font-size:.85rem;color:var(--ink-950,#030812);}' +
      '  .rbk-input-fila input:focus{outline:none;border-color:var(--blue-600,#0033FF);}' +
      '  .rbk-input-fila button{border:none;border-radius:10px;padding:0 16px;background:var(--blue-600,#0033FF);' +
      '    color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;}' +
      '  .rbk-reiniciar{background:none;border:none;color:var(--blue-600,#0033FF);font-size:.78rem;font-weight:600;' +
      '    cursor:pointer;padding:4px 0;text-decoration:underline;}' +
      '  .rbk-pie{padding:10px 16px;font-size:.68rem;color:rgba(3,8,18,0.45);background:#fff;' +
      '    border-top:1px solid rgba(3,8,18,0.06);text-align:center;}' +
      '  .rbk-cambiar{background:none;border:none;color:rgba(234,237,248,0.75);font-size:.7rem;' +
      '    text-decoration:underline;cursor:pointer;padding:0;margin-top:2px;align-self:flex-start;}' +
      '  .rbk-cambiar:hover{color:#fff;}' +
      '  @media (max-width:480px){ .rbk-panel{right:16px;bottom:18px;max-width:calc(100vw - 32px);} }' +
      '</style>' +
      '<button type="button" class="rbk-burbuja" aria-label="Abrir asistente de Rubicknet" aria-expanded="false">' +
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.2-3.4A8 8 0 0 1 4 12z"/><path d="M8.5 11h7M8.5 14h4.5"/></svg>' +
      '</button>' +
      '<div class="rbk-panel">' +
      '  <div class="rbk-cab">' +
      '    <div class="rbk-cab-info"><strong>Asistente Rubicknet</strong><span><span class="rbk-punto"></span>Te conectamos por WhatsApp</span><button type="button" class="rbk-cambiar">Elegir otro servicio</button></div>' +
      '    <button type="button" class="rbk-cerrar" aria-label="Cerrar">&times;</button>' +
      '  </div>' +
      '  <div class="rbk-cuerpo"></div>' +
      '  <div class="rbk-pie">Se abrirá WhatsApp en una pestaña nueva</div>' +
      '</div>';

    var raiz = this;
    var burbuja = this.querySelector('.rbk-burbuja');
    var panel = this.querySelector('.rbk-panel');
    var cerrar = this.querySelector('.rbk-cerrar');
    var cambiar = this.querySelector('.rbk-cambiar');
    var cuerpo = this.querySelector('.rbk-cuerpo');

    /* ---------- Estado de la conversación ---------- */
    var estado = { flujo: null, pasoIndex: 0, respuestas: [] };

    function abrir() {
      panel.classList.add('abierto');
      burbuja.setAttribute('aria-expanded', 'true');
      var stack = raiz.closest('.rbk-stack-flotante');
      if (stack) stack.classList.add('chat-abierto');
    }
    function cerrarPanel() {
      panel.classList.remove('abierto');
      burbuja.setAttribute('aria-expanded', 'false');
      var stack = raiz.closest('.rbk-stack-flotante');
      if (stack) stack.classList.remove('chat-abierto');
    }

    burbuja.addEventListener('click', function () {
      panel.classList.contains('abierto') ? cerrarPanel() : abrir();
    });
    cerrar.addEventListener('click', cerrarPanel);
    cambiar.addEventListener('click', mostrarPantallaInicial);
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) cerrarPanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarPanel();
    });

    function agregarBurbujaBot(html) {
      var el = document.createElement('div');
      el.className = 'rbk-msg-bot';
      el.innerHTML = html;
      cuerpo.appendChild(el);
      cuerpo.scrollTop = cuerpo.scrollHeight;
      return el;
    }

    function agregarBurbujaUsuario(texto) {
      var el = document.createElement('div');
      el.className = 'rbk-msg-usuario';
      el.textContent = texto;
      cuerpo.appendChild(el);
      cuerpo.scrollTop = cuerpo.scrollHeight;
    }

    /* Cuenta cuántos pasos totales tiene un flujo (preguntas + campo de texto) */
    function totalPasos(flujo) {
      return flujo.preguntas.length + (flujo.campoTexto ? 1 : 0);
    }

    function agregarBarraProgreso(actual, total) {
      var barra = document.createElement('div');
      barra.className = 'rbk-progreso';
      for (var i = 0; i < total; i++) {
        var seg = document.createElement('span');
        if (i < actual) seg.classList.add('hecho');
        barra.appendChild(seg);
      }
      cuerpo.appendChild(barra);
      return barra;
    }

    function mostrarPantallaInicial() {
      estado = { flujo: null, pasoIndex: 0, respuestas: [] };
      cuerpo.innerHTML = '';
      agregarBurbujaBot('¡Hola! 👋 Para pasarte con el asesor correcto y con tu mensaje bien detallado, cuéntame: ¿qué te interesa?');

      var opcionesDiv = document.createElement('div');
      opcionesDiv.className = 'rbk-opciones';
      flujos.forEach(function (flujo) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rbk-opcion';
        btn.textContent = flujo.texto;
        btn.addEventListener('click', function () {
          opcionesDiv.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
          agregarBurbujaUsuario(flujo.texto);
          estado.flujo = flujo;
          estado.pasoIndex = 0;
          estado.respuestas = [];
          setTimeout(renderPaso, 380);
        });
        opcionesDiv.appendChild(btn);
      });
      cuerpo.appendChild(opcionesDiv);
    }

    /* Muestra el siguiente paso: la próxima pregunta de opción múltiple,
       el campo de texto final, o el resumen si ya no queda nada. */
    function renderPaso() {
      var flujo = estado.flujo;
      var preguntas = flujo.preguntas;

      if (estado.pasoIndex < preguntas.length) {
        var p = preguntas[estado.pasoIndex];
        agregarBarraProgreso(estado.pasoIndex, totalPasos(flujo));
        agregarBurbujaBot(p.pregunta);

        var opcionesDiv = document.createElement('div');
        opcionesDiv.className = 'rbk-opciones';
        p.opciones.forEach(function (texto) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'rbk-opcion';
          btn.textContent = texto;
          btn.addEventListener('click', function () {
            opcionesDiv.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
            agregarBurbujaUsuario(texto);
            estado.respuestas.push({ resumen: p.resumen, valor: texto });
            estado.pasoIndex++;
            setTimeout(renderPaso, 380);
          });
          opcionesDiv.appendChild(btn);
        });
        cuerpo.appendChild(opcionesDiv);
        cuerpo.scrollTop = cuerpo.scrollHeight;
        return;
      }

      if (flujo.campoTexto && !estado.campoTextoHecho) {
        var ct = flujo.campoTexto;
        agregarBarraProgreso(preguntas.length, totalPasos(flujo));
        agregarBurbujaBot(ct.etiqueta);

        var fila = document.createElement('div');
        fila.className = 'rbk-input-fila';
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = ct.placeholder || '';
        var btnEnviar = document.createElement('button');
        btnEnviar.type = 'button';
        btnEnviar.textContent = 'Continuar';

        function confirmarTexto() {
          var valor = input.value.trim();
          fila.querySelectorAll('input,button').forEach(function (el) { el.disabled = true; });
          if (valor) {
            agregarBurbujaUsuario(valor);
            estado.respuestas.push({ resumen: ct.resumen, valor: valor });
          }
          estado.campoTextoHecho = true;
          setTimeout(renderPaso, 380);
        }

        btnEnviar.addEventListener('click', confirmarTexto);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); confirmarTexto(); }
        });

        fila.appendChild(input);
        fila.appendChild(btnEnviar);
        cuerpo.appendChild(fila);
        cuerpo.scrollTop = cuerpo.scrollHeight;
        input.focus();
        return;
      }

      finalizar();
    }

    function finalizar() {
      var flujo = estado.flujo;

      agregarBurbujaBot('Perfecto, ya tengo todo lo que necesito. Te estoy pasando con un asesor por WhatsApp con tu mensaje listo…');

      var reiniciar = document.createElement('button');
      reiniciar.type = 'button';
      reiniciar.className = 'rbk-reiniciar';
      reiniciar.textContent = 'Empezar de nuevo';
      reiniciar.addEventListener('click', mostrarPantallaInicial);
      cuerpo.appendChild(reiniciar);
      cuerpo.scrollTop = cuerpo.scrollHeight;

      var lineas = [flujo.saludo];
      estado.respuestas.forEach(function (r) {
        lineas.push('- ' + r.resumen + ': ' + r.valor);
      });
      var mensaje = lineas.join('\n');

      setTimeout(function () {
        var url = (window.Rubicknet && window.Rubicknet.armarLinkWhatsApp)
          ? window.Rubicknet.armarLinkWhatsApp(mensaje)
          : ('https://wa.me/5568115210?text=' + encodeURIComponent(mensaje));
        window.open(url, '_blank', 'noopener');
      }, 650);
    }

    mostrarPantallaInicial();

    /* ---------- Grupo flotante: WhatsApp + Facebook + este chat ----------
       Se arma una sola vez por página. Toma el botón de WhatsApp que ya
       existe en el HTML de cada página (con su link/mensaje correcto) y
       crea el de Facebook, para que los tres queden alineados en una
       columna fija y no se encimen. Orden visual de abajo hacia arriba:
       WhatsApp, Facebook, Chat. */
    (function armarStackFlotante(elementoChat) {
      if (document.querySelector('.rbk-stack-flotante')) return;

      var stack = document.createElement('div');
      stack.className = 'rbk-stack-flotante';
      document.body.appendChild(stack);

      var whatsapp = document.querySelector('a.whatsapp-float');

      var facebook = document.querySelector('a.facebook-float');
      if (!facebook) {
        facebook = document.createElement('a');
        // TODO: confirmar la URL real de la página de Facebook de Rubicknet
        facebook.href = 'https://www.facebook.com/rubicknet';
        facebook.target = '_blank';
        facebook.rel = 'noopener';
        facebook.className = 'facebook-float';
        facebook.setAttribute('aria-label', 'Síguenos en Facebook');
        facebook.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M22 12.06C22 6.53 17.52 2.04 12 2.04S2 6.53 2 12.06c0 5 3.66 9.13 8.44 9.9v-7H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34v7c4.78-.77 8.44-4.9 8.44-9.9z"/></svg>';
      }

      if (whatsapp) stack.appendChild(whatsapp);
      stack.appendChild(facebook);
      stack.appendChild(elementoChat);
    })(this);
  }
}

customElements.define('chat-widget', ChatWidget);