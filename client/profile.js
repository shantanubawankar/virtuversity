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

async function loadProfile() {
  const box = document.getElementById('profileBox')
  const name = document.getElementById('pfName')
  const phone = document.getElementById('pfPhone')
  const edu = document.getElementById('pfEducation')
  const interests = document.getElementById('pfInterests')
  const bio = document.getElementById('pfBio')
  const exp = document.getElementById('pfExpertise')
  const location = document.getElementById('pfLocation')
  const timezone = document.getElementById('pfTimezone')
  const portfolio = document.getElementById('pfPortfolio')
  const website = document.getElementById('pfWebsite')
  const github = document.getElementById('pfGithub')
  const linkedin = document.getElementById('pfLinkedin')
  const twitter = document.getElementById('pfTwitter')
  const pm = document.getElementById('pfPricingModel')
  const pp = document.getElementById('pfPricingPrice')
  const avail = document.getElementById('pfAvailability')
  try {
    const r = await api('/api/auth/me')
    box.textContent = `Email: ${r.user.email} • Role: ${r.user.role}`
    const me = r.user
    name.value = me.name || ''
    phone.value = me.phone || ''
    edu.value = me.education || ''
    interests.value = Array.isArray(me.interests) ? me.interests.join(', ') : (me.interests || '')
    bio.value = me.bio || ''
    exp.value = Array.isArray(me.expertise) ? me.expertise.join(', ') : (me.expertise || '')
    pm.value = (me.pricing && me.pricing.model) || ''
    pp.value = (me.pricing && me.pricing.price) || ''
    avail.value = me.availability || ''
    location.value = me.location || ''
    timezone.value = me.timezone || ''
    portfolio.value = me.portfolioUrl || ''
    website.value = (me.social && me.social.website) || ''
    github.value = (me.social && me.social.github) || ''
    linkedin.value = (me.social && me.social.linkedin) || ''
    twitter.value = (me.social && me.social.twitter) || ''
  } catch {
    box.textContent = 'Not logged in'
  }
}

function bindProfile() {
  const form = document.getElementById('profileForm')
  const status = document.getElementById('pfStatus')
  const logoutBtn = document.getElementById('logoutBtn')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = 'Saving...'
    const payload = {
      name: document.getElementById('pfName').value,
      phone: document.getElementById('pfPhone').value,
      education: document.getElementById('pfEducation').value,
      interests: document.getElementById('pfInterests').value.split(',').map(s => s.trim()).filter(Boolean),
      bio: document.getElementById('pfBio').value,
      expertise: document.getElementById('pfExpertise').value.split(',').map(s => s.trim()).filter(Boolean),
      pricing: {
        model: document.getElementById('pfPricingModel').value || undefined,
        price: Number(document.getElementById('pfPricingPrice').value) || undefined
      },
      availability: document.getElementById('pfAvailability').value,
      location: document.getElementById('pfLocation').value,
      timezone: document.getElementById('pfTimezone').value,
      portfolioUrl: document.getElementById('pfPortfolio').value,
      social: {
        website: document.getElementById('pfWebsite').value || undefined,
        github: document.getElementById('pfGithub').value || undefined,
        linkedin: document.getElementById('pfLinkedin').value || undefined,
        twitter: document.getElementById('pfTwitter').value || undefined
      }
    }
    try {
      const r = await api('/api/auth/me', { method: 'PUT', body: payload })
      status.textContent = 'Saved'
      window.showToast && window.showToast('Profile saved', 'success')
      await loadProfile()
    } catch (err) {
      status.textContent = err.message
      window.showToast && window.showToast(err.message, 'error')
    }
  })
  logoutBtn.addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('token')
    window.location.href = '/'
  })
}

window.addEventListener('DOMContentLoaded', () => {
  loadProfile()
  bindProfile()
})
