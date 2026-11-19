(() => {
  const $ = id => document.getElementById(id);
  const zone = 'Atlantic/Azores';
  const labels = {entry:'Entrada', lunch:'Saída para almoço', return:'Regresso do almoço', exit:'Saída'};
  const times = new Intl.DateTimeFormat('pt-PT',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const minutes = new Intl.DateTimeFormat('pt-PT',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const dateLong = new Intl.DateTimeFormat('pt-PT',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const dateShort = new Intl.DateTimeFormat('pt-PT',{timeZone:zone,day:'numeric',month:'long',year:'numeric'});
  const dayFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
  let user = null, timer = null, day = '', pendingUndo = null;
  function dayKey(date) { const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(part => [part.type,part.value])); return `${parts.year}-${parts.month}-${parts.day}`; }
  function storageKey() { return `hourtoyou.punches.v1.${encodeURIComponent(user.email || user.name.toLowerCase())}`; }
  function readRecords() {
    const value = localStorage.getItem(storageKey()); if (value === null) return [];
    const data = JSON.parse(value);
    if (!Array.isArray(data) || !data.every(item => item && labels[item.type] && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at)))) throw new Error('invalid data');
    return data;
  }
  function say(text, isError = false) { const el = $('punch-feedback'); el.textContent = text; el.hidden = !text; el.classList.toggle('is-error',isError); }
  function refreshClock() {
    if (!user) return;
    const now = new Date(), parts = times.format(now).split(':');
    $('live-time').textContent = parts.slice(0,2).join(':'); $('live-seconds').textContent = parts[2];
    $('live-time').dateTime = now.toISOString(); $('live-date').textContent = dateLong.format(now);
    $('punch-time').textContent = times.format(now); $('punch-date').textContent = dateLong.format(now);
    const dateParts = Object.fromEntries(dayFormatter.formatToParts(now).map(part => [part.type,part.value]));
    $('date-day').textContent = dateParts.day;
    $('date-month').textContent = new Intl.DateTimeFormat('pt-PT',{timeZone:zone,month:'short'}).format(now).replace('.','');
    const today = dayKey(now); if (today !== day) { day = today; renderHistory(); }
  }
  function renderHistory() {
    const container = $('punch-history'); container.replaceChildren();
    let records;
    try { records = readRecords(); } catch { $('today-status').textContent = 'Registos indisponíveis'; $('undo-punch').hidden = true; say('Não foi possível ler os registos locais. Verifica as permissões do navegador.',true); return; }
    const todayCount = records.filter(item => dayKey(new Date(item.at)) === day).length;
    $('today-status').textContent = todayCount === 0 ? 'Sem registos hoje' : `${todayCount} ${todayCount === 1 ? 'registo hoje' : 'registos hoje'}`;
    $('undo-punch').hidden = records.length === 0;
    if (!records.length) { const empty = document.createElement('div'); empty.className = 'history-empty'; empty.textContent = 'Ainda não tens registos de ponto. Escolhe uma opção acima para começar.'; container.append(empty); return; }
    let lastDay = '';
    [...records].reverse().forEach(item => {
      const at = new Date(item.at), currentDay = dayKey(at);
      if (currentDay !== lastDay) { const heading = document.createElement('p'); heading.className = 'history-date'; heading.textContent = currentDay === day ? 'HOJE' : dateShort.format(at); container.append(heading); lastDay = currentDay; }
      const row = document.createElement('div'); row.className = 'history-row';
      const icon = document.createElement('span'); icon.className = 'history-icon'; icon.textContent = item.type === 'entry' ? '↗' : item.type === 'lunch' ? '☕' : item.type === 'return' ? '↻' : '↙';
      const text = document.createElement('div'); text.className = 'history-text'; const title = document.createElement('strong'); title.textContent = labels[item.type];
      const sub = document.createElement('small'); sub.textContent = 'Hora dos Açores'; text.append(title,sub);
      const time = document.createElement('time'); time.dateTime = item.at; time.textContent = minutes.format(at); row.append(icon,text,time); container.append(row);
    });
  }
  function record(type) {
    if (!user || !labels[type]) return;
    try {
      const now = new Date(), records = readRecords(); records.push({type,at:now.toISOString()});
      localStorage.setItem(storageKey(), JSON.stringify(records)); day = dayKey(now); renderHistory();
      say(`Registo de ${labels[type].toLowerCase()} guardado às ${times.format(now)}.`);
    } catch { say('Não foi possível guardar o registo. Verifica se o navegador permite guardar dados locais.',true); }
  }
  document.querySelectorAll('[data-punch]').forEach(button => button.addEventListener('click', () => record(button.dataset.punch)));
  $('undo-punch').addEventListener('click', () => {
    try {
      const records = readRecords(); if (!records.length) return; pendingUndo = records[records.length-1];
      $('undo-description').textContent = `${labels[pendingUndo.type]} · ${dateShort.format(new Date(pendingUndo.at))}, ${times.format(new Date(pendingUndo.at))}.`;
      $('undo-dialog').showModal();
    } catch { say('Não foi possível ler os registos locais.',true); }
  });
  $('undo-cancel').addEventListener('click', () => { pendingUndo = null; $('undo-dialog').close(); });
  $('undo-confirm').addEventListener('click', () => {
    try {
      const records = readRecords(), last = records[records.length-1];
      if (!pendingUndo || !last || last.at !== pendingUndo.at || last.type !== pendingUndo.type) throw new Error('changed');
      records.pop(); localStorage.setItem(storageKey(),JSON.stringify(records)); renderHistory(); say('O último registo foi anulado.');
    } catch { say('Não foi possível anular o registo. Atualiza a página e tenta novamente.',true); }
    pendingUndo = null; $('undo-dialog').close();
  });
  window.addEventListener('storage', event => { if (user && event.key === storageKey()) renderHistory(); });
  window.HourPunch = {
    open(activeUser) { user = activeUser; day = ''; say(''); refreshClock(); if (timer) clearInterval(timer); timer = setInterval(refreshClock,1000); },
    close() { if (timer) clearInterval(timer); timer = null; user = null; pendingUndo = null; if ($('undo-dialog').open) $('undo-dialog').close(); }
  };
})();

