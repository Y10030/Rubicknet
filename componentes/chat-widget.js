/**
 * <chat-widget> — asistente guiado flotante.
 * No es una IA conversacional: es un menú tipo chat que arma el
 * mensaje de WhatsApp correcto según lo que el cliente necesita y
 * lo manda directo al WhatsApp de la empresa. Cero backend, cero costo.
 */
class ChatWidget extends HTMLElement {
  connectedCallback() {
    var opciones = [
      { texto: 'Internet para hogar o negocio', mensaje: 'Hola, quiero información sobre planes de internet y cobertura en mi zona.' },
      { texto: 'Cableado estructurado', mensaje: 'Hola, quiero cotizar un servicio de cableado estructurado.' },
      { texto: 'Redes cableadas e inalámbricas', mensaje: 'Hola, quiero cotizar redes cableadas e inalámbricas para mi negocio.' },
      { texto: 'Vigilancia y CCTV', mensaje: 'Hola, quiero cotizar un sistema de cámaras y vigilancia.' },
      { texto: 'Soporte y mantenimiento', mensaje: 'Hola, quiero agendar soporte técnico o mantenimiento.' },
      { texto: 'Seguridad informática', mensaje: 'Hola, quiero cotizar un servicio de seguridad informática.' },
      { texto: 'Otro / no estoy seguro', mensaje: 'Hola, quiero más información. No estoy seguro de qué servicio necesito, ¿me pueden orientar?' }
    ];

    this.innerHTML =
      '<style>' +
      '  chat-widget{position:fixed;right:24px;bottom:96px;z-index:999;font-family:var(--font-body,\'Inter\',sans-serif);}' +
      '  .rbk-burbuja{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;' +
      '    background:var(--gradient-diag,linear-gradient(135deg,#0033FF 0%,#977DFF 100%));' +
      '    box-shadow:0 8px 24px rgba(0,51,255,0.35);display:flex;align-items:center;justify-content:center;' +
      '    transition:transform .15s ease;color:#fff;}' +
      '  .rbk-burbuja:hover{transform:scale(1.06);}' +
      '  .rbk-burbuja svg{width:26px;height:26px;}' +
      '  .rbk-panel{position:absolute;right:0;bottom:70px;width:320px;max-width:calc(100vw - 32px);' +
      '    background:var(--white,#fff);border-radius:var(--radius-l,18px);overflow:hidden;' +
      '    box-shadow:0 20px 50px rgba(3,8,18,0.25);border:1px solid rgba(3,8,18,0.08);}' +
      '  .rbk-panel[hidden]{display:none;}' +
      '  .rbk-cab{background:var(--navy-900,#00033D);color:#fff;padding:16px 18px;display:flex;' +
      '    align-items:center;justify-content:space-between;}' +
      '  .rbk-cab-info{display:flex;flex-direction:column;gap:2px;}' +
      '  .rbk-cab-info strong{font-family:var(--font-display,\'Space Grotesk\',sans-serif);font-size:.95rem;}' +
      '  .rbk-cab-info span{font-size:.72rem;color:rgba(234,237,248,0.7);display:flex;align-items:center;gap:5px;}' +
      '  .rbk-punto{width:7px;height:7px;border-radius:50%;background:#3ddc84;display:inline-block;}' +
      '  .rbk-cerrar{background:none;border:none;color:#fff;font-size:1.3rem;line-height:1;cursor:pointer;opacity:.8;}' +
      '  .rbk-cerrar:hover{opacity:1;}' +
      '  .rbk-cuerpo{max-height:360px;overflow-y:auto;padding:16px;background:var(--mist-100,#EAEDF8);}' +
      '  .rbk-msg-bot{background:#fff;border-radius:14px 14px 14px 4px;padding:10px 13px;font-size:.85rem;' +
      '    line-height:1.45;color:var(--ink-950,#030812);box-shadow:0 1px 2px rgba(3,8,18,0.06);margin-bottom:12px;max-width:92%;}' +
      '  .rbk-opciones{display:flex;flex-direction:column;gap:8px;}' +
      '  .rbk-opcion{text-align:left;background:#fff;border:1px solid rgba(3,8,18,0.10);border-radius:10px;' +
      '    padding:10px 12px;font-size:.83rem;font-family:var(--font-body,\'Inter\',sans-serif);color:var(--ink-950,#030812);' +
      '    cursor:pointer;transition:border-color .15s ease,transform .1s ease;}' +
      '  .rbk-opcion:hover{border-color:var(--blue-600,#0033FF);transform:translateX(2px);}' +
      '  .rbk-opcion:disabled{opacity:.5;cursor:default;transform:none;}' +
      '  .rbk-pie{padding:10px 16px;font-size:.68rem;color:rgba(3,8,18,0.45);background:#fff;' +
      '    border-top:1px solid rgba(3,8,18,0.06);text-align:center;}' +
      '  @media (max-width:480px){ chat-widget{right:14px;bottom:88px;} .rbk-panel{right:-6px;} }' +
      '</style>' +
      '<button type="button" class="rbk-burbuja" aria-label="Abrir asistente de Rubicknet" aria-expanded="false">' +
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.2-3.4A8 8 0 0 1 4 12z"/><path d="M8.5 11h7M8.5 14h4.5"/></svg>' +
      '</button>' +
      '<div class="rbk-panel" hidden>' +
      '  <div class="rbk-cab">' +
      '    <div class="rbk-cab-info"><strong>Asistente Rubicknet</strong><span><span class="rbk-punto"></span>Te conectamos por WhatsApp</span></div>' +
      '    <button type="button" class="rbk-cerrar" aria-label="Cerrar">&times;</button>' +
      '  </div>' +
      '  <div class="rbk-cuerpo">' +
      '    <div class="rbk-msg-bot">¡Hola! 👋 Cuéntame qué necesitas y te paso directo con un asesor por WhatsApp, ya con tu mensaje listo.</div>' +
      '    <div class="rbk-opciones">' +
      opciones.map(function (o, i) { return '<button type="button" class="rbk-opcion" data-i="' + i + '">' + o.texto + '</button>'; }).join('') +
      '    </div>' +
      '  </div>' +
      '  <div class="rbk-pie">Se abrirá WhatsApp en una pestaña nueva</div>' +
      '</div>';

    var burbuja = this.querySelector('.rbk-burbuja');
    var panel = this.querySelector('.rbk-panel');
    var cerrar = this.querySelector('.rbk-cerrar');
    var cuerpo = this.querySelector('.rbk-cuerpo');

    function abrir() {
      panel.hidden = false;
      burbuja.setAttribute('aria-expanded', 'true');
    }
    function cerrarPanel() {
      panel.hidden = true;
      burbuja.setAttribute('aria-expanded', 'false');
    }

    burbuja.addEventListener('click', function () {
      panel.hidden ? abrir() : cerrarPanel();
    });
    cerrar.addEventListener('click', cerrarPanel);
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) cerrarPanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarPanel();
    });

    var self = this;
    this.querySelectorAll('.rbk-opcion').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var opcion = opciones[+btn.dataset.i];

        self.querySelectorAll('.rbk-opcion').forEach(function (b) { b.disabled = true; });

        var respuesta = document.createElement('div');
        respuesta.className = 'rbk-msg-bot';
        respuesta.textContent = 'Perfecto, te estoy pasando con un asesor por WhatsApp sobre "' + opcion.texto + '"…';
        cuerpo.appendChild(respuesta);
        cuerpo.scrollTop = cuerpo.scrollHeight;

        setTimeout(function () {
          var url = (window.Rubicknet && window.Rubicknet.armarLinkWhatsApp)
            ? window.Rubicknet.armarLinkWhatsApp(opcion.mensaje)
            : ('https://wa.me/5568115210?text=' + encodeURIComponent(opcion.mensaje));
          window.open(url, '_blank', 'noopener');
        }, 550);
      });
    });
  }
}

customElements.define('chat-widget', ChatWidget);
