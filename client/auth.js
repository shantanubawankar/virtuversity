async function api(path, { method = 'GET', body } = {}) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  }
  let res = await fetch(path, opts);
  let ct = res.headers.get('content-type') || '';
  if (!res.ok && ct.includes('text/html')) {
    const txt = await res.text().catch(() => '');
    if (txt.includes('NOT_FOUND')) {
      res = await fetch(`https://virtuversity.onrender.com${path}`, opts);
      ct = res.headers.get('content-type') || '';
    } else {
      throw new Error(txt || 'Request failed');
    }
  }
  if (!res.ok) {
    let errText = 'Request failed';
    try {
      if (ct.includes('application/json')) {
        const j = await res.json();
        errText = j.error || JSON.stringify(j);
      } else {
        errText = await res.text();
      }
    } catch {}
    throw new Error(errText);
  }
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

function bindLoginRegister() {
  const regForm = document.getElementById('registerForm');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const regRole = document.getElementById('regRole');
  const regStatus = document.getElementById('regStatus');
  const loginBtn = document.getElementById('loginBtn');
  const meBox = document.getElementById('meBox');
  async function loadMe() {
    try {
      const r = await api('/api/auth/me');
      meBox.textContent = `ID: ${r.user.id} • ${r.user.email} • ${r.user.role}`;
    } catch {
      meBox.textContent = 'Not logged in';
    }
  }
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await api('/api/auth/register', { method: 'POST', body: { email: regEmail.value, password: regPassword.value, role: regRole.value } });
      regStatus.textContent = 'Registered';
      window.showToast && window.showToast('Registered', 'success');
      await loadMe();
    } catch (err) {
      regStatus.textContent = err.message;
      window.showToast && window.showToast(err.message, 'error');
    }
  });
  loginBtn.addEventListener('click', async () => {
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: { email: regEmail.value, password: regPassword.value } });
      regStatus.textContent = 'Logged in';
      window.showToast && window.showToast('Logged in', 'success');
      await loadMe();
    } catch (err) {
      regStatus.textContent = err.message;
      window.showToast && window.showToast(err.message, 'error');
    }
  });
  loadMe();
}

function showProfile() {
  const box = document.getElementById('profileBox');
  (async () => {
    try {
      const r = await api('/api/auth/me');
      box.textContent = `Email: ${r.user.email} • Role: ${r.user.role}`;
    } catch {
      box.textContent = 'Not logged in';
    }
  })();
}

window.bindLoginRegister = bindLoginRegister;
window.showProfile = showProfile;
