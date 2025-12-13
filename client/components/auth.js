import { Button, Card, showToast } from './ui.js'

export function Auth() {
  const { useState, useEffect } = React
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  useEffect(() => {
    const hash = location.hash || ''
    const qs = hash.split('?')[1] || ''
    const params = new URLSearchParams(qs)
    const m = params.get('mode')
    const r = params.get('role')
    if (m) setMode(m)
    if (r) setRole(r)
  }, [])
  const submit = async () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!validEmail) { showToast('Enter a valid email', 'error'); return }
    if (password.length < 6) { showToast('Password must be 6+ characters', 'error'); return }
    const res = await fetch('/api/auth/' + (mode === 'login' ? 'login' : 'register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password, role }) })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || 'Success', 'success')
      if (data.user?.role === 'teacher') location.hash = '#teacher'
      else location.hash = '#courses'
    } else {
      showToast(data.error || data.message || 'Error', 'error')
    }
  }
  const oauth = async (provider) => {
    const p = provider.toLowerCase()
    location.href = `/api/auth/oauth/${p}/start?role=${role}`
  }
  return React.createElement(Card, { className: 'max-w-md mx-auto' },
    React.createElement('div', { className: 'flex gap-2 mb-4' },
      React.createElement(Button, { onClick: () => setMode('login') }, 'Login'),
      React.createElement(Button, { onClick: () => setMode('register') }, 'Register')
    ),
    React.createElement('div', { className: 'grid gap-3' },
      React.createElement('div', { className: 'grid gap-2' },
        React.createElement(Button, { onClick: () => oauth('Google') }, 'Continue with Google'),
        React.createElement(Button, { onClick: () => oauth('GitHub') }, 'Continue with GitHub')
      ),
      React.createElement('hr', { className: 'border-white/10 my-2' }),
      React.createElement('select', { className: 'glass rounded-lg px-4 py-2', value: role, onChange: e => setRole(e.target.value) },
        React.createElement('option', { value: 'student' }, 'Student'),
        React.createElement('option', { value: 'teacher' }, 'Teacher')
      ),
      React.createElement('input', { className: 'glass rounded-lg px-4 py-2', placeholder: 'Email', value: email, onChange: e => setEmail(e.target.value), type: 'email', inputMode: 'email' }),
      React.createElement('input', { type: 'password', className: 'glass rounded-lg px-4 py-2', placeholder: 'Password', value: password, onChange: e => setPassword(e.target.value), minLength: 6 }),
      React.createElement(Button, { variant: 'accent', onClick: submit }, mode === 'login' ? 'Login' : 'Register')
    )
  )
}
