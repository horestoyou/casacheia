(() => {
  const $ = id => document.getElementById(id);
  const form = $('auth-form'), email = $('email'), password = $('password');
  const usersKey = 'hourtoyou.users.v1', sessionKey = 'hourtoyou.session.v1';
  let mode = 'login';
  const normalize = value => value.trim().toLowerCase();
  function users() { try { const data = JSON.parse(localStorage.getItem(usersKey) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
  function message(text) { $('message').textContent = text; $('message').hidden = !text; }
  function setMode(next) {
    mode = next; const register = mode === 'register';
    $('login-tab').setAttribute('aria-selected', String(!register)); $('register-tab').setAttribute('aria-selected', String(register));
    $('form-panel').setAttribute('aria-labelledby', register ? 'register-tab' : 'login-tab');
    $('register-fields').hidden = !register; $('name').required = register; $('phone').required = register;
    $('password-hint').hidden = !register; password.autocomplete = register ? 'new-password' : 'current-password';
    $('form-title').innerHTML = register ? 'Vamos começar<span>.</span>' : 'Bem-vindo de volta<span>.</span>';
    $('form-subtitle').textContent = register ? 'Cria a tua conta para começar.' : 'Entra na tua conta para continuares.';
    $('submit-label').textContent = register ? 'Criar a minha conta' : 'Entrar na minha conta';
    $('switch-copy').firstChild.textContent = register ? 'Já tens conta? ' : 'Ainda não tens conta? ';
    $('switch-mode').textContent = register ? 'Entrar' : 'Criar conta'; message('');
  }
  async function derive(pass, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt:new Uint8Array(salt), iterations:100000, hash:'SHA-256'}, key, 256);
    return Array.from(new Uint8Array(bits)).map(x => x.toString(16).padStart(2,'0')).join('');
  }
  function startSession(name, address) { const user = {name, email:address}; sessionStorage.setItem(sessionKey, JSON.stringify(user)); window.HourDashboard.open(user); }
  $('login-tab').addEventListener('click', () => setMode('login'));
  $('register-tab').addEventListener('click', () => setMode('register'));
  $('switch-mode').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  document.querySelector('.show-password').addEventListener('click', e => { const btn = e.currentTarget, show = password.type === 'password'; password.type = show ? 'text' : 'password'; btn.setAttribute('aria-pressed', String(show)); btn.setAttribute('aria-label', show ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'); });
  $('logout').addEventListener('click', () => { sessionStorage.removeItem(sessionKey); window.HourDashboard.close(); form.reset(); setMode('login'); email.focus(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); message(''); const address = normalize(email.value), pass = password.value, button = form.querySelector('.primary');
    button.disabled = true;
    try {
      if (mode === 'register') {
        const name = $('name').value.trim(), phone = $('phone').value.trim();
        if (name.length < 3 || name.split(/\s+/).length < 2) return message('Indica o teu nome completo.');
        if (!/^[+\d\s()\-]{9,20}$/.test(phone) || phone.replace(/\D/g,'').length < 9) return message('Indica um número de telemóvel válido.');
        if (pass.length < 8) return message('A palavra-passe deve ter pelo menos 8 caracteres.');
        const all = users(); if (address === 'admin@gmail.com' || all.some(user => user.email === address)) return message('Já existe uma conta com este email.');
        if (!window.crypto?.subtle) return message('Não foi possível criar a conta neste navegador. Abre a aplicação num navegador atualizado.');
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16))); const hash = await derive(pass, salt);
        all.push({name, phone, email:address, salt, hash}); localStorage.setItem(usersKey, JSON.stringify(all)); startSession(name, address);
      } else {
        if (address === 'admin@gmail.com' && pass === 'admin') { startSession('Admin', address); return; }
        const user = users().find(item => item.email === address);
        if (!user || !window.crypto?.subtle || await derive(pass, user.salt) !== user.hash) return message('Email ou palavra-passe incorretos.');
        startSession(user.name, address);
      }
    } catch { message('Não foi possível concluir a operação. Verifica se o navegador permite guardar dados locais.'); }
    finally { button.disabled = false; }
  });
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) {
      let user; try { user = JSON.parse(saved); } catch { user = {name:saved, email:saved === 'Admin' ? 'admin@gmail.com' : ''}; }
      if (user && typeof user.name === 'string' && user.name.trim()) window.HourDashboard.open(user);
    }
  } catch { /* The form reports storage failures on submission. */ }
})();

