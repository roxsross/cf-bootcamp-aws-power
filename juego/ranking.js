// ROXS RUNNER · ranking global con AWS Lambda
// Escucha el fin de la partida, permite subir el puntaje y muestra el top 5.
// Si window.RANKING_API está vacío, no hace nada y el juego sigue igual.
(() => {
  'use strict';
  const API = (window.RANKING_API || '').replace(/\/+$/, '');
  if (!API) return;

  const style = document.createElement('style');
  style.textContent = `
    .rk { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 360px; }
    .rk-form { display: flex; gap: 6px; }
    .rk-form input { flex: 1; min-width: 0; padding: 8px 10px; border-radius: 6px; border: 2px solid #8B5CF6; background: #090914; color: #fff; font: inherit; font-size: 14px; }
    .rk-form button { padding: 8px 12px; border-radius: 6px; border: none; background: #00F5FF; color: #090914; font: inherit; font-weight: 800; font-size: 13px; cursor: pointer; }
    .rk-form button:disabled { opacity: .5; cursor: default; }
    .rk-title { font-size: 13px; letter-spacing: 1px; color: #00F5FF; }
    .rk-list { list-style: none; margin: 0; padding: 0; font-size: 14px; text-align: left; }
    .rk-list li { display: flex; justify-content: space-between; padding: 3px 8px; border-radius: 4px; }
    .rk-list li:nth-child(odd) { background: rgba(139, 92, 246, .18); }
    .rk-list li.me { outline: 2px solid #FF2D95; }
    .rk-msg { font-size: 12px; color: #D946EF; min-height: 14px; }
    .panel.rk-on .panel-avatar { display: none; }
    .panel.rk-on .rk { margin: 8px auto 4px; }
    .panel.rk-on .rk-list li { padding: 2px 8px; }
  `;
  document.head.appendChild(style);

  const results = document.getElementById('panelResults');
  const panel = document.getElementById('panel');
  // Al volver a jugar, el panel recupera su aspecto original
  document.getElementById('primaryBtn').addEventListener('click', () => panel.classList.remove('rk-on'));
  const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let lastName = '';
  try { lastName = localStorage.getItem('roxsRunnerName') || ''; } catch {}

  async function getTop() {
    const res = await fetch(`${API}/ranking`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function renderList(box, top, me) {
    const list = box.querySelector('.rk-list');
    if (!top.length) {
      list.innerHTML = '<li><span>Todavía no hay puntajes. ¡Sé la primera persona!</span></li>';
      return;
    }
    list.innerHTML = top.slice(0, 5).map((p, i) => {
      const mine = me && p.nombre === me.nombre && p.puntaje === me.puntaje ? ' class="me"' : '';
      return `<li${mine}><span>${i + 1}. ${escapeHtml(p.nombre)}</span><strong>${p.puntaje}</strong></li>`;
    }).join('');
  }

  window.addEventListener('roxs:gameover', async (e) => {
    const { score } = e.detail;
    const box = document.createElement('div');
    box.className = 'rk';
    panel.classList.add('rk-on');
    box.innerHTML = `
      <div class="rk-form">
        <input maxlength="20" placeholder="Tu nombre" aria-label="Tu nombre para el ranking" value="${escapeHtml(lastName)}">
        <button type="button">📤 SUBIR</button>
      </div>
      <div class="rk-msg" aria-live="polite"></div>
      <div class="rk-title">🏆 TOP 5 GLOBAL</div>
      <ol class="rk-list"><li><span>Cargando…</span></li></ol>`;
    results.appendChild(box);

    const input = box.querySelector('input');
    const button = box.querySelector('button');
    const msg = box.querySelector('.rk-msg');
    // Que ESPACIO y P escriban en el campo en lugar de controlar el juego
    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') button.click();
    });

    try { renderList(box, await getTop()); }
    catch { msg.textContent = 'No se pudo cargar el ranking. Revisa la URL de la API o CORS.'; }

    button.addEventListener('click', async () => {
      const nombre = input.value.trim();
      if (!nombre) { msg.textContent = 'Escribe tu nombre primero.'; input.focus(); return; }
      button.disabled = true;
      msg.textContent = 'Subiendo…';
      try {
        const res = await fetch(`${API}/ranking`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ nombre, puntaje: score }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        try { localStorage.setItem('roxsRunnerName', nombre); } catch {}
        lastName = nombre;
        msg.textContent = `¡Listo! Quedaste en el puesto ${data.posicion}.`;
        renderList(box, await getTop(), { nombre, puntaje: score });
      } catch (err) {
        msg.textContent = `No se pudo subir: ${err.message}`;
        button.disabled = false;
      }
    });
  });
})();
