async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: Object.assign({}, body ? { 'Content-Type': 'application/json' } : {}, headers || (localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})),
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  }
  let res
  try { res = await fetch(path, opts) } catch { res = await fetch(`https://virtuversity.onrender.com${path}`, opts) }
  const ct = res.headers.get('content-type') || ''
  if (!res.ok) {
    let msg = 'Request failed'
    try { msg = ct.includes('application/json') ? (await res.json()).error : await res.text() } catch {}
    throw new Error(msg)
  }
  return ct.includes('application/json') ? res.json() : res.text()
}

async function load() {
  const guard = document.getElementById('roleGuard')
  const bio = document.getElementById('tdBio')
  const exp = document.getElementById('tdExpertise')
  const pm = document.getElementById('tdPricingModel')
  const pp = document.getElementById('tdPricingPrice')
  const av = document.getElementById('tdAvailability')
  const loc = document.getElementById('tdLocation')
  const tz = document.getElementById('tdTimezone')
  const portfolio = document.getElementById('tdPortfolio')
  const website = document.getElementById('tdWebsite')
  const github = document.getElementById('tdGithub')
  const linkedin = document.getElementById('tdLinkedin')
  const twitter = document.getElementById('tdTwitter')
  try {
    const r = await api('/api/auth/me')
    if (r.user.role !== 'teacher') {
      guard.textContent = 'Not a teacher. Switch role to access dashboard.'
      return
    }
    guard.textContent = `Logged in as ${r.user.email}`
    const me = r.user
    bio.value = me.bio || ''
    exp.value = Array.isArray(me.expertise) ? me.expertise.join(', ') : (me.expertise || '')
    pm.value = (me.pricing && me.pricing.model) || ''
    pp.value = (me.pricing && me.pricing.price) || ''
    av.value = me.availability || ''
    loc.value = me.location || ''
    tz.value = me.timezone || ''
    portfolio.value = me.portfolioUrl || ''
    website.value = (me.social && me.social.website) || ''
    github.value = (me.social && me.social.github) || ''
    linkedin.value = (me.social && me.social.linkedin) || ''
    twitter.value = (me.social && me.social.twitter) || ''
  } catch {
    guard.textContent = 'Please login to access the dashboard'
  }
}

function bind() {
  const form = document.getElementById('tdForm')
  const status = document.getElementById('tdStatus')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = 'Saving...'
    const payload = {
      bio: document.getElementById('tdBio').value,
      expertise: document.getElementById('tdExpertise').value.split(',').map(s => s.trim()).filter(Boolean),
      pricing: {
        model: document.getElementById('tdPricingModel').value || undefined,
        price: Number(document.getElementById('tdPricingPrice').value) || undefined
      },
      availability: document.getElementById('tdAvailability').value
      , location: document.getElementById('tdLocation').value
      , timezone: document.getElementById('tdTimezone').value
      , portfolioUrl: document.getElementById('tdPortfolio').value
      , social: {
        website: document.getElementById('tdWebsite').value || undefined,
        github: document.getElementById('tdGithub').value || undefined,
        linkedin: document.getElementById('tdLinkedin').value || undefined,
        twitter: document.getElementById('tdTwitter').value || undefined
      }
    }
    try {
      await api('/api/auth/me', { method: 'PUT', body: payload })
      status.textContent = 'Saved'
      window.showToast && window.showToast('Dashboard saved', 'success')
    } catch (err) {
      status.textContent = err.message
      window.showToast && window.showToast(err.message, 'error')
    }
  })
}

window.addEventListener('DOMContentLoaded', () => {
  load()
  bind()
})
