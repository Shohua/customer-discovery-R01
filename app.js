/* =============================================
   Entrevista Exploratoria · Customer Discovery
   app.js — Navegación, estado, localStorage, PDF export
   ============================================= */

const SCREENS = [
  'splash', 'meta', 'apertura',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'cierre', 'screen-history'
];

// Estado actual de la entrevista en progreso
let currentInterview = {};

const App = {

  /* ---- NAVEGACIÓN ---- */
  goTo(screenId) {
    App.saveCurrentState();

    SCREENS.forEach(id => {
      const el = document.getElementById(`screen-${id}`) || document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenId}`) || document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }

    if (screenId === 'meta') {
      const fechaEl = document.getElementById('meta-fecha');
      if (fechaEl && !fechaEl.value) {
        fechaEl.value = new Date().toISOString().split('T')[0];
      }
    }
  },

  /* ---- SEÑALES (semáforo) ---- */
  setSignal(groupId, btn) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.sig-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  getSignal(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return null;
    const active = group.querySelector('.sig-btn.active');
    return active ? active.dataset.val : null;
  },

  /* ---- GUARDAR ESTADO EN MEMORIA ---- */
  saveCurrentState() {
    currentInterview = {
      ...currentInterview,
      num:          App.val('meta-num'),
      fecha:        App.val('meta-fecha'),
      rubro:        App.val('meta-rubro'),
      antiguedad:   App.val('meta-antiguedad'),
      formato:      App.val('meta-formato'),
      grabacion:    App.val('meta-grabacion'),
      apNotas:      App.val('ap-notas'),
      apSignal:     App.getSignal('ap-signal'),
      h1Notas:      App.val('h1-notas'),
      h1Signal:     App.getSignal('h1-signal'),
      h2Notas:      App.val('h2-notas'),
      h2Signal:     App.getSignal('h2-signal'),
      h3Notas:      App.val('h3-notas'),
      h3Signal:     App.getSignal('h3-signal'),
      h4Notas:      App.val('h4-notas'),
      h4Signal:     App.getSignal('h4-signal'),
      h5Notas:      App.val('h5-notas'),
      h5Signal:     App.getSignal('h5-signal'),
      h6Notas:      App.val('h6-notas'),
      h6Signal:     App.getSignal('h6-signal'),
      cierreNotas:   App.val('cierre-notas'),
      cierreFrase:   App.val('cierre-frase'),
      cierreRef:     App.val('cierre-referido'),
      pa1Resumen:    App.val('pa1-resumen'),
      pa1Signal:     App.getSignal('pa1-signal'),
      pa2Resumen:    App.val('pa2-resumen'),
      pa2Signal:     App.getSignal('pa2-signal'),
      pa3Resumen:    App.val('pa3-resumen'),
      pa3Signal:     App.getSignal('pa3-signal'),
      pa4Resumen:    App.val('pa4-resumen'),
      pa4Signal:     App.getSignal('pa4-signal'),
      veredicto:     App.getSignal('veredicto-signal'),
    };
  },

  val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  },

  /* ---- PERSISTIR EN LOCALSTORAGE ---- */
  saveToStorage(interview) {
    const key = `entrevista_exploratoria_${Date.now()}`;
    interview._key = key;
    interview._savedAt = new Date().toISOString();
    try {
      localStorage.setItem(key, JSON.stringify(interview));
    } catch(e) {
      console.warn('localStorage no disponible:', e);
    }
    return key;
  },

  loadAll() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // Compatibilidad con claves antiguas (aumi_) y nuevas
      if (k && (k.startsWith('entrevista_exploratoria_') || k.startsWith('aumi_entrevista_'))) {
        try {
          items.push(JSON.parse(localStorage.getItem(k)));
        } catch(e) {}
      }
    }
    return items.sort((a, b) => (b._savedAt || '').localeCompare(a._savedAt || ''));
  },

  deleteInterview(key) {
    if (confirm('¿Eliminar esta entrevista?')) {
      localStorage.removeItem(key);
      App.showHistory();
    }
  },

  /* ---- HISTORIAL ---- */
  showHistory() {
    const list = document.getElementById('history-list');
    const items = App.loadAll();

    if (items.length === 0) {
      list.innerHTML = '<p class="history-empty">No hay entrevistas guardadas aún.</p>';
    } else {
      list.innerHTML = items.map(item => {
        const sig = item.veredicto || 'none';
        const sigLabel = { go: '✓ Señal clara', parcial: '~ Señal débil', nogo: '✗ Sin señal', none: '—' }[sig] || '—';
        const fecha = item.fecha
          ? new Date(item.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—';
        return `
          <div class="history-card">
            <div class="history-info">
              <div class="history-num">${item.num || 'Sin número'}</div>
              <div class="history-rubro">${item.rubro || 'Sin rubro'}</div>
              <div class="history-fecha">${fecha}</div>
              <div class="history-actions">
                <button class="history-btn" onclick="App.exportarDesdeHistorial('${item._key}')">Exportar PDF</button>
                <button class="history-btn danger" onclick="App.deleteInterview('${item._key}')">Eliminar</button>
              </div>
            </div>
            <div class="history-signal ${sig}">${sigLabel}</div>
          </div>
        `;
      }).join('');
    }

    App.goTo('screen-history');
  },

  exportarDesdeHistorial(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (item) {
        App.buildPDF(item);
        App.generarPDFAutomatico(item);
      }
    } catch(e) {
      alert('No se pudo cargar la entrevista.');
    }
  },

  /* ---- GUARDAR Y EXPORTAR ---- */
  guardarSolo() {
    App.saveCurrentState();
    App.saveToStorage({ ...currentInterview });
    const desc = `${currentInterview.num || 'Entrevista'} · ${currentInterview.rubro || ''}`;
    document.getElementById('modal-desc-text').textContent = desc + ' guardada correctamente.';
    document.getElementById('modal-guardado').classList.remove('hidden');
  },

  guardarYExportar() {
    App.saveCurrentState();
    const saved = { ...currentInterview };
    App.saveToStorage(saved);
    App.buildPDF(saved);
    App.generarPDFAutomatico(saved);
  },

  closeModal() {
    document.getElementById('modal-guardado').classList.add('hidden');
    App.resetForm();
    App.goTo('splash');
  },

  resetForm() {
    document.querySelectorAll('input.field-input, textarea.field-textarea').forEach(el => el.value = '');
    document.querySelectorAll('select.field-input').forEach(el => el.selectedIndex = 0);
    document.querySelectorAll('.sig-btn').forEach(b => b.classList.remove('active'));
    currentInterview = {};
  },

  /* ---- GENERAR PDF AUTOMÁTICAMENTE (sin diálogo de impresión) ---- */
  async generarPDFAutomatico(d) {
    const loading = document.getElementById('pdf-loading');
    if (loading) loading.classList.remove('hidden');

    // Dar tiempo al DOM para renderizar
    await new Promise(r => setTimeout(r, 100));

    const pdfDiv = document.getElementById('pdf-output');
    if (!pdfDiv) {
      if (loading) loading.classList.add('hidden');
      return;
    }

    // Mostrar el div para captura
    pdfDiv.classList.add('rendering');

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pages = pdfDiv.querySelectorAll('.pdf-page');
      const pageW = 210; // A4 mm
      const pageH = 297;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgH = (canvas.height * pageW) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH));
      }

      // Nombre del archivo
      const nombre = d.num ? d.num.replace(/[^a-zA-Z0-9\-_]/g, '_') : 'entrevista';
      const fechaStr = d.fecha ? d.fecha.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g,'');
      pdf.save(`${nombre}_${fechaStr}.pdf`);

    } catch (err) {
      console.error('Error generando PDF:', err);
      // Fallback al diálogo de impresión si falla
      window.print();
    } finally {
      pdfDiv.classList.remove('rendering');
      if (loading) loading.classList.add('hidden');
    }
  },

  /* ---- CONSTRUIR HTML PARA PDF ---- */
  buildPDF(d) {
    const fecha = d.fecha
      ? new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    const apSignalLabel = {
      si: '✓ Apareció solo',
      'con-ayuda': '~ Solo al preguntar',
      no: '✗ No apareció',
    }[d.apSignal] || '—';

    const apSignalClass = {
      si: 'si',
      'con-ayuda': 'con-ayuda',
      no: 'no',
    }[d.apSignal] || 'none';

    const signalText = {
      go: '✓ Señal clara',
      parcial: '~ Señal débil',
      nogo: '✗ Sin señal',
      null: '—',
      undefined: '—'
    };

    const tagClass = (val) => {
      if (!val) return 'none';
      if (val === 'go' || val === 'si') return 'go';
      if (val === 'nogo' || val === 'no') return 'nogo';
      if (val === 'parcial' || val === 'con-ayuda') return 'parcial';
      return 'none';
    };

    const sigBadge = (val, customLabel) => {
      const cls = tagClass(val);
      const label = customLabel || signalText[val] || '—';
      return `<div class="pdf-signal-badge ${cls}">${label}</div>`;
    };

    const notes = (txt, tall = false) =>
      `<div class="pdf-notes-box ${tall ? 'tall' : ''}">${txt ? App.escHtml(txt) : '<span style="color:#bbb">—</span>'}</div>`;

    const questionsBlock = (questions) => `
      <div class="pdf-questions-list">
        <div class="pdf-questions-title">Preguntas guía</div>
        ${questions.map((q, i) => `
          <div class="pdf-q-item">
            <span class="pdf-q-num">${i + 1}.</span>
            <span class="pdf-q-text">${App.escHtml(q)}</span>
          </div>
        `).join('')}
      </div>
    `;

    const paRow = (tag, tagCls, label, notesTxt, signal) => `
      <div class="pdf-pa-row">
        <div class="pdf-pa-label"><span class="pdf-tag ${tagCls}">${tag}</span><br/>${label}</div>
        <div class="pdf-pa-notes">${notesTxt ? App.escHtml(notesTxt) : '—'}</div>
        <div>${sigBadge(signal)}</div>
      </div>
    `;

    const veredictoTexto = {
      go: 'Señal clara',
      parcial: 'Señal débil',
      nogo: 'Sin señal',
    }[d.veredicto] || '—';

    const html = `
      <!-- PÁGINA 1: Apertura + H1 + H2 + H3 -->
      <div class="pdf-page">
        <div class="pdf-header">
          <div class="pdf-logo">Entrevista Exploratoria</div>
          <div class="pdf-meta-row">
            Customer Discovery · Entrevista de problema<br/>
            ${fecha}<br/>
            ${d.num || '—'} · ${d.rubro || '—'} · ${d.antiguedad || '—'}<br/>
            ${d.formato || '—'} · Grabación: ${d.grabacion || '—'}
          </div>
        </div>

        <div class="pdf-section-title">Apertura — "Cuéntame cómo fue tu semana en el negocio. ¿Qué te preocupó más?"</div>
        <div class="pdf-questions-list" style="background:#f5f9f0; border-color:#c8e0b8;">
          <div class="pdf-questions-title">Guía</div>
          <div class="pdf-q-item"><span class="pdf-q-num">→</span><span class="pdf-q-text">Habla el 20%, escucha el 80%. No guíes el tema financiero.</span></div>
        </div>
        ${notes(d.apNotas, true)}
        <div class="pdf-signal-badge ${apSignalClass}" style="margin-bottom:10pt;">${apSignalLabel}</div>

        <div class="pdf-section-title">H1 · Sustituto activo — ¿cómo lleva los números? · PA1 + PA4</div>
        ${questionsBlock([
          '¿Cómo llevas hoy los números de tu negocio? Cuéntame exactamente qué haces.',
          '¿Cuándo fue la última vez que miraste eso? ¿Qué hiciste con esa información?',
          '¿Alguna vez lo intentaste diferente y lo dejaste? ¿Por qué lo dejaste?'
        ])}
        ${notes(d.h1Notas)}
        ${sigBadge(d.h1Signal)}

        <div class="pdf-section-title">H2 · Espacio mental financiero · PA1</div>
        ${questionsBlock([
          '¿En qué momento de la semana piensas en plata? ¿Qué te genera eso?',
          '¿Cuál fue la última decisión difícil que tomaste en el negocio? ¿Qué información tenías cuando la tomaste?'
        ])}
        ${notes(d.h2Notas)}
        ${sigBadge(d.h2Signal)}

        <div class="pdf-section-title">H3 · Episodio de pérdida o susto · PA1 + PA2</div>
        ${questionsBlock([
          '¿Alguna vez terminaste un mes vendiendo bien y te diste cuenta de que no te quedó nada? ¿Qué hiciste?',
          '¿Cuándo fue la última vez que el negocio te dio un susto de plata? ¿Cómo lo manejaste?',
          '¿Buscaste ayuda en ese momento? ¿Qué encontraste? ¿Te sirvió?'
        ])}
        ${notes(d.h3Notas)}
        ${sigBadge(d.h3Signal)}
      </div>

      <!-- PÁGINA 2: H4 + H5 + H6 + Cierre -->
      <div class="pdf-page">
        <div class="pdf-header">
          <div class="pdf-logo">Entrevista Exploratoria</div>
          <div class="pdf-meta-row">${d.num || '—'} · ${d.rubro || '—'} · ${fecha}</div>
        </div>

        <div class="pdf-section-title">H4 · Momento de compra · PA3</div>
        ${questionsBlock([
          'Cuando algo del negocio te preocupa, ¿cuándo te sientas a resolverlo? ¿En el momento o después?',
          '¿Cuándo fue la última vez que contrataste algo para el negocio? ¿Qué te llevó a hacerlo en ese momento?',
          'Si hoy existiera algo que resuelve eso, ¿lo contratarías ahora o lo pensarías? ¿Qué necesitarías para decidir?'
        ])}
        ${notes(d.h4Notas)}
        ${sigBadge(d.h4Signal)}

        <div class="pdf-section-title">H5 · Disposición a pagar · PA2</div>
        ${questionsBlock([
          '¿Tienes contador hoy? ¿Cuánto pagas? ¿Qué te da?',
          '¿Has probado alguna app o servicio para llevar las finanzas del negocio? ¿La pagaste? ¿La dejaste de usar? ¿Por qué?',
          '¿Cuánto estarías dispuesta a pagar mensualmente por saber con certeza si tu negocio gana o pierde?'
        ])}
        ${notes(d.h5Notas)}
        ${sigBadge(d.h5Signal)}

        <div class="pdf-section-title">H6 · Fuente de consejo financiero · PA1 + PA4</div>
        ${questionsBlock([
          'Cuando tienes que tomar una decisión financiera importante, ¿con quién hablas?',
          '¿Qué te dice esa persona? ¿Te sirve lo que te dice?',
          '¿Hay algo que esa persona no puede darte sobre tu negocio? ¿Qué falta?'
        ])}
        ${notes(d.h6Notas)}
        ${sigBadge(d.h6Signal)}

        <div class="pdf-section-title">Cierre — "¿Hay algo que yo debería haber preguntado y no pregunté?"</div>
        ${notes(d.cierreNotas)}

        ${d.cierreFrase ? `
        <div class="pdf-section-title">Frase textual más importante</div>
        <div class="pdf-frase-destacada">${App.escHtml(d.cierreFrase)}</div>
        ` : ''}

        ${d.cierreRef ? `
        <div class="pdf-section-title">¿Pidió saber más o referir a alguien?</div>
        ${notes(d.cierreRef)}
        ` : ''}
      </div>

      <!-- PÁGINA 3: Síntesis post-entrevista -->
      <div class="pdf-page">
        <div class="pdf-header">
          <div class="pdf-logo">Entrevista Exploratoria</div>
          <div class="pdf-meta-row">${d.num || '—'} · ${d.rubro || '—'} · ${fecha}<br/>Síntesis post-entrevista</div>
        </div>

        <div class="pdf-section-title">Las 4 preguntas angulares</div>

        ${paRow('PA1', 'pa1', '¿El dolor existe sin explicarlo?', d.pa1Resumen, d.pa1Signal)}
        ${paRow('PA2', 'pa2', '¿Pagaría aunque no lo use de entrada?', d.pa2Resumen, d.pa2Signal)}
        ${paRow('PA3', 'pa3', '¿Dolor y momento de compra coinciden?', d.pa3Resumen, d.pa3Signal)}
        ${paRow('PA4', 'pa4', '¿Quién es el enemigo real?', d.pa4Resumen, d.pa4Signal)}

        <div class="pdf-section-title">Veredicto global</div>
        <div class="pdf-veredicto ${d.veredicto || 'none'}">
          <div class="pdf-veredicto-label">Veredicto —</div>
          <div class="pdf-veredicto-val">${veredictoTexto}</div>
        </div>
      </div>
    `;

    let pdfDiv = document.getElementById('pdf-output');
    if (!pdfDiv) {
      pdfDiv = document.createElement('div');
      pdfDiv.id = 'pdf-output';
      document.body.appendChild(pdfDiv);
    }
    pdfDiv.innerHTML = html;
  },

  escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br/>');
  }

};

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  if (splash) splash.classList.add('active');

  document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  });
});
