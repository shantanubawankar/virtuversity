import { Button, Card, showToast } from './ui.js'

export function Account() {
  const { useState, useEffect } = React
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [upi, setUpi] = useState('')
  const [bank, setBank] = useState('')
  const [model, setModel] = useState('video')
  const [price, setPrice] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newModel, setNewModel] = useState('video')
  const [newPrice, setNewPrice] = useState('')
  const [myCourses, setMyCourses] = useState([])
  const [vidTitle, setVidTitle] = useState('')
  const [vidUrl, setVidUrl] = useState('')
  const [vidCourseId, setVidCourseId] = useState('')
  const [vidPrice, setVidPrice] = useState('')
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json(); setMe(data.user)
    } finally { setLoading(false) }
  })() }, [])
  useEffect(() => { (async () => {
    if (!me || me.role !== 'teacher') return
    const pr = await fetch(`/api/teachers/${me.id}/profile`)
    if (pr.ok) { const d = await pr.json(); if (d.profile) { setName(d.profile.name || ''); setBio(d.profile.bio || ''); setUpi(d.profile.payout?.upi || ''); setBank(d.profile.payout?.bank || '') } }
    const pi = await fetch(`/api/teachers/${me.id}/pricing`)
    if (pi.ok) { const d = await pi.json(); if (d.pricing) { setModel(d.pricing.model || 'video'); setPrice(String(d.pricing.price || '')) } }
    const cs = await fetch(`/api/courses?teacher=${me.id}`)
    if (cs.ok) { const d = await cs.json(); setMyCourses(d.courses || []) }
  })() }, [me])
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); setMe(null); showToast('Logged out', 'success') }
  const saveProfile = async () => {
    if (!name || !bio) { showToast('Name and bio required', 'error'); return }
    const res = await fetch(`/api/teachers/${me.id}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, bio, upi, bank }) })
    const data = await res.json(); if (res.ok) showToast('Profile saved', 'success'); else showToast(data.error || 'Error', 'error')
  }
  const savePricing = async () => {
    if (!price || isNaN(Number(price))) { showToast('Enter a valid price', 'error'); return }
    const res = await fetch(`/api/teachers/${me.id}/pricing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, price: Number(price) }) })
    const data = await res.json(); if (res.ok) showToast('Pricing saved', 'success'); else showToast(data.error || 'Error', 'error')
  }
  const createCourse = async () => {
    if (!newTitle || !newModel || !newPrice || isNaN(Number(newPrice))) { showToast('Fill all fields with valid data', 'error'); return }
    const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title: newTitle, description: newDesc, model: newModel, price: Number(newPrice) }) })
    const data = await res.json()
    if (res.ok) {
      showToast('Course created', 'success')
      setMyCourses([data.course, ...myCourses])
      setNewTitle(''); setNewDesc(''); setNewModel('video'); setNewPrice('')
    } else {
      showToast(data.error || 'Error', 'error')
    }
  }
  const createVideo = async () => {
    if (!vidTitle || !vidUrl || !vidCourseId || !vidPrice || isNaN(Number(vidPrice))) { showToast('Fill all fields with valid data', 'error'); return }
    const res = await fetch(`/api/teachers/${me.id}/videos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title: vidTitle, url: vidUrl, courseId: vidCourseId, price: Number(vidPrice) }) })
    const data = await res.json()
    if (res.ok) {
      showToast('Video added', 'success')
      setVidTitle(''); setVidUrl(''); setVidCourseId(''); setVidPrice('')
    } else {
      showToast(data.error || 'Error', 'error')
    }
  }
  if (loading) return React.createElement(Card, { className: 'max-w-5xl mx-auto' }, React.createElement('div', { className: 'animate-pulse h-24 bg-white/5 rounded-xl' }))
  if (!me) return React.createElement('p', { className: 'text-white/70' }, 'Sign in to view your account.')
  return React.createElement('div', { className: 'grid gap-6' },
    React.createElement(Card, null,
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('div', null,
          React.createElement('div', { className: 'text-lg font-semibold' }, me.email),
          React.createElement('div', { className: 'text-white/70 text-sm' }, 'Role: ', me.role)
        ),
        React.createElement(Button, { onClick: logout }, 'Logout')
      )
    ),
    me.role === 'teacher' && React.createElement(Card, null,
      React.createElement('div', { className: 'flex gap-2 mb-4' },
        React.createElement(Button, { onClick: () => setTab('profile'), variant: tab === 'profile' ? 'accent' : 'primary' }, 'Profile'),
        React.createElement(Button, { onClick: () => setTab('pricing'), variant: tab === 'pricing' ? 'accent' : 'primary' }, 'Pricing'),
        React.createElement(Button, { onClick: () => setTab('courses'), variant: tab === 'courses' ? 'accent' : 'primary' }, 'Courses')
      ),
      tab === 'profile' ? React.createElement('div', { className: 'grid gap-3' },
        React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Display name', value: name, onChange: e => setName(e.target.value) }),
        React.createElement('textarea', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Short bio', value: bio, onChange: e => setBio(e.target.value) }),
        React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'UPI ID (optional)', value: upi, onChange: e => setUpi(e.target.value) }),
        React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Bank details (optional)', value: bank, onChange: e => setBank(e.target.value) }),
        React.createElement(Button, { variant: 'accent', onClick: saveProfile }, 'Save Profile')
      ) : tab === 'pricing' ? React.createElement('div', { className: 'grid gap-3' },
        React.createElement('select', { className: 'glass rounded-lg px-4 py-2', value: model, onChange: e => setModel(e.target.value) },
          React.createElement('option', { value: 'video' }, 'Per Video'),
          React.createElement('option', { value: 'course' }, 'Course Bundle'),
          React.createElement('option', { value: 'subscription' }, 'Teacher Subscription')
        ),
        React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Price (₹)', value: price, onChange: e => setPrice(e.target.value), inputMode: 'numeric' }),
        React.createElement(Button, { variant: 'accent', onClick: savePricing }, 'Save Pricing')
      ) : React.createElement('div', { className: 'grid gap-4' },
        React.createElement(Card, null,
          React.createElement('div', { className: 'grid md:grid-cols-2 gap-3' },
            React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Course title', value: newTitle, onChange: e => setNewTitle(e.target.value) }),
            React.createElement('select', { className: 'glass rounded-lg px-4 py-2', value: newModel, onChange: e => setNewModel(e.target.value) },
              React.createElement('option', { value: 'video' }, 'Per Video'),
              React.createElement('option', { value: 'course' }, 'Course Bundle'),
              React.createElement('option', { value: 'subscription' }, 'Teacher Subscription')
            ),
            React.createElement('textarea', { className: 'glass rounded-lg px-4 py-2 md:col-span-2', placeholder: 'Description', value: newDesc, onChange: e => setNewDesc(e.target.value) }),
            React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Price (₹)', value: newPrice, onChange: e => setNewPrice(e.target.value), inputMode: 'numeric' }),
            React.createElement(Button, { variant: 'accent', onClick: createCourse }, 'Create Course')
          )
        ),
        React.createElement(Card, null,
          React.createElement('div', { className: 'grid md:grid-cols-2 gap-3' },
            React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Video title', value: vidTitle, onChange: e => setVidTitle(e.target.value) }),
            React.createElement('select', { className: 'glass rounded-lg px-4 py-2', value: vidCourseId, onChange: e => setVidCourseId(e.target.value) },
              React.createElement('option', { value: '' }, 'Select course'),
              myCourses.map(c => React.createElement('option', { key: c.id, value: c.id }, c.title))
            ),
            React.createElement('input', { className: 'glass rounded-lg px-4 py-2 md:col-span-2', placeholder: 'Video URL (mp4)', value: vidUrl, onChange: e => setVidUrl(e.target.value) }),
            React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Price (₹)', value: vidPrice, onChange: e => setVidPrice(e.target.value), inputMode: 'numeric' }),
            React.createElement(Button, { variant: 'accent', onClick: createVideo }, 'Add Video')
          )
        ),
        React.createElement('div', { className: 'grid md:grid-cols-3 gap-3' },
          myCourses.map(c => React.createElement(Card, { key: c.id },
            React.createElement('div', { className: 'text-lg font-semibold' }, c.title),
            React.createElement('div', { className: 'text-white/70 text-sm mt-1' }, c.description || ''),
            React.createElement('div', { className: 'text-white/70 text-sm mt-2' }, 'Model: ', c.model),
            React.createElement('div', { className: 'text-white/70 text-sm' }, 'Price: ₹', c.price || 0)
          ))
        )
      )
    )
  )
}
