(() => {
  const $ = id => document.getElementById(id);
  const cards = {
    punch: { title:'Relógio de ponto', subtitle:'Regista o teu dia', icon:'punch', copy:'O teu espaço para acompanhar os registos de ponto.' },
    hours: { title:'Horas trabalhadas', subtitle:'Acompanha as tuas horas', icon:'clock', copy:'Aqui poderás acompanhar as tuas horas de trabalho.' },
    salary: { title:'Ordenado', subtitle:'Consulta os teus valores', icon:'money', copy:'Aqui poderás acompanhar o teu ordenado e os teus pagamentos.' },
    calendar: { title:'Calendário', subtitle:'Organiza os teus dias', icon:'calendar', copy:'Aqui poderás consultar e organizar os teus dias.' },
    messages: { title:'Mensagens', icon:'message', copy:'As tuas mensagens terão aqui o seu espaço.' },
    profile: { title:'O meu perfil', icon:'user', copy:'Este é o teu espaço pessoal.' }
  };
  const defaults = ['punch','hours','salary','calendar'];
  let session = null, order = [...defaults], visible = [...defaults];
  const symbol = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  function key(suffix) { return `hourtoyou.${suffix}.v1.${encodeURIComponent(session.email || session.name.toLowerCase())}`; }
  function loadConfig() {
    order = [...defaults]; visible = [...defaults];
    try {
      const saved = JSON.parse(localStorage.getItem(key('cards')) || 'null');
      if (saved && Array.isArray(saved.order) && Array.isArray(saved.visible)) {
        order = [...new Set(saved.order.filter(id => defaults.includes(id))), ...defaults.filter(id => !saved.order.includes(id))];
        visible = saved.visible.filter(id => defaults.includes(id));
      }
    } catch { /* Defaults remain available when local storage is unavailable. */ }
  }
  function saveConfig() { try { localStorage.setItem(key('cards'), JSON.stringify({order, visible})); } catch { /* The current view still works for this session. */ } }
  function renderCards() {
    const grid = $('quick-grid'); grid.replaceChildren();
    order.filter(id => visible.includes(id)).forEach(id => {
      const item = cards[id], button = document.createElement('button');
      button.type = 'button'; button.className = 'quick-card'; button.dataset.route = id;
      button.innerHTML = `<span class="quick-icon">${symbol(item.icon)}</span><span class="card-arrow" aria-hidden="true">↗</span><strong>${item.title}</strong><small>${item.subtitle}</small>`;
      grid.append(button);
    });
    $('empty-cards').hidden = grid.children.length !== 0;
  }
  function renderCustomize() {
    const list = $('customize-list'); list.replaceChildren();
    order.forEach((id, index) => {
      const row = document.createElement('div'); row.className = 'custom-row';
      const label = document.createElement('label'), checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.checked = visible.includes(id);
      checkbox.addEventListener('change', () => { visible = checkbox.checked ? [...visible, id] : visible.filter(value => value !== id); saveConfig(); renderCards(); });
      label.append(checkbox, document.createTextNode(cards[id].title)); row.append(label);
      for (const [direction, glyph, description] of [[-1,'↑','Subir'],[1,'↓','Descer']]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = glyph;
        button.disabled = index + direction < 0 || index + direction >= order.length; button.setAttribute('aria-label', `${description} ${cards[id].title}`);
        button.addEventListener('click', () => { const next = index + direction; [order[index],order[next]] = [order[next],order[index]]; saveConfig(); renderCards(); renderCustomize(); const moved = [...$('customize-list').querySelectorAll('button')].find(b => b.getAttribute('aria-label') === `${description} ${cards[id].title}` && !b.disabled); moved?.focus(); });
        row.append(button);
      }
      list.append(row);
    });
  }
  function route(id) {
    if (id === 'salary') { window.HourWork.openSalary(); return; }
    const isHome = id === 'home', isPunch = id === 'punch', isHours = id === 'hours', isCalendar = id === 'calendar', isMessages = id === 'messages';
    $('home-screen').hidden = !isHome; $('punch-screen').hidden = !isPunch; $('hours-screen').hidden = !isHours; $('calendar-screen').hidden = !isCalendar; $('messages-screen').hidden = !isMessages; $('detail-screen').hidden = isHome || isPunch || isHours || isCalendar || isMessages;
    if (isHours || isCalendar) window.HourWork.refresh(id);
    if (isMessages) window.HourMessages.show();
    if (!isHome && !isPunch && !isHours && !isCalendar && !isMessages) {
      const item = cards[id]; if (!item) return;
      $('detail-icon').innerHTML = symbol(item.icon); $('detail-title').textContent = item.title; $('detail-copy').textContent = item.copy;
      $('logout').hidden = id !== 'profile'; window.HourProfile.route(id);
    }
    document.querySelectorAll('.nav-item[data-route]').forEach(button => {
      const active = button.dataset.route === id; button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    window.scrollTo(0,0);
  }
  function showWelcome() {
    let hasSeen = false; try { hasSeen = localStorage.getItem(key('welcomed')) === 'yes'; } catch { /* Show welcome if the preference cannot be read. */ }
    if (!hasSeen) $('welcome-dialog').showModal();
  }
  window.HourDashboard = {
    open(user) {
      session = user; $('auth-page').hidden = true; $('app-shell').hidden = false;
      document.querySelectorAll('[data-user-first]').forEach(el => { el.textContent = user.name.trim().split(/\s+/)[0]; });
      window.HourPunch.open(user); window.HourReports.open(user); window.HourProfile.open(user); window.HourMessages.open(user); window.HourWork.open(user);
      loadConfig(); renderCards(); route('home'); showWelcome();
    },
    close() { window.HourPunch.close(); window.HourWork.close(); window.HourReports.close(); window.HourMessages.close(); window.HourProfile.close(); if ($('welcome-dialog').open) $('welcome-dialog').close(); if ($('customize-dialog').open) $('customize-dialog').close(); $('app-shell').hidden = true; $('auth-page').hidden = false; session = null; window.scrollTo(0,0); }
  };
  $('welcome-continue').addEventListener('click', () => { try { localStorage.setItem(key('welcomed'),'yes'); } catch { /* A later login may show the welcome again. */ } $('welcome-dialog').close(); });
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-route], [data-go-home], [data-open-customize]'); if (!target || !session) return;
    if (target.hasAttribute('data-open-customize')) { renderCustomize(); $('customize-dialog').showModal(); }
    else route(target.hasAttribute('data-go-home') ? 'home' : target.dataset.route);
  });
  $('avatar-button').addEventListener('click', () => route('profile'));
  $('customize-done').addEventListener('click', () => $('customize-dialog').close());
  document.querySelector('.close-dialog').addEventListener('click', () => $('customize-dialog').close());
})();






