import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { addUser, getUserByEmail, getUserById } from '../data/store.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' })
  const existing = getUserByEmail(email)
  if (existing) return res.status(400).json({ error: 'User exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = { id: uuidv4(), email, password: hash, role }
  addUser(user)
  const token = signToken({ id: user.id, role: user.role })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('token', token, { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' })
  res.json({ message: 'Registered', user: { id: user.id, email, role: user.role } })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = getUserByEmail(email)
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' })
  const token = signToken({ id: user.id, role: user.role })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('token', token, { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' })
  res.json({ message: 'Logged in', user: { id: user.id, email: user.email, role: user.role } })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ message: 'Logged out' })
})

router.get('/me', (req, res) => {
  const token = req.cookies['token']
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const user = getUserById(payload.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user: { id: user.id, email: user.email, role: user.role } })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

router.get('/oauth/google/start', (req, res) => {
  const role = req.query.role || 'student'
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectBase = process.env.SERVER_ORIGIN || `${req.protocol}://${req.headers.host}`
  const redirectUri = `${redirectBase}/api/auth/oauth/google/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId || '')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', role)
  res.redirect(url.toString())
})

router.get('/oauth/google/callback', async (req, res) => {
  const code = req.query.code
  const role = req.query.state || 'student'
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const redirectBase = process.env.SERVER_ORIGIN || `${req.protocol}://${req.headers.host}`
  const redirectUri = `${redirectBase}/api/auth/oauth/google/callback`
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' })
    })
    const tokenData = await tokenRes.json()
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const info = await infoRes.json()
    const email = info.email || ''
    if (!email) return res.redirect((process.env.CLIENT_ORIGIN || '/') + '/#auth')
    let user = getUserByEmail(email)
    if (!user) {
      const { v4: uuidv4 } = await import('uuid')
      user = { id: uuidv4(), email, password: '', role }
      addUser(user)
    }
    const token = signToken({ id: user.id, role: user.role })
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' })
    const target = user.role === 'teacher' ? '/#teacher' : '/#courses'
    res.redirect((process.env.CLIENT_ORIGIN || '/') + target)
  } catch {
    res.redirect((process.env.CLIENT_ORIGIN || '/') + '/#auth')
  }
})

router.get('/oauth/github/start', (req, res) => {
  const role = req.query.role || 'student'
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectBase = process.env.SERVER_ORIGIN || `${req.protocol}://${req.headers.host}`
  const redirectUri = `${redirectBase}/api/auth/oauth/github/callback`
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId || '')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'read:user user:email')
  url.searchParams.set('state', role)
  res.redirect(url.toString())
})

router.get('/oauth/github/callback', async (req, res) => {
  const code = req.query.code
  const role = req.query.state || 'student'
  const clientId = process.env.GITHUB_CLIENT_ID || ''
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || ''
  const redirectBase = process.env.SERVER_ORIGIN || `${req.protocol}://${req.headers.host}`
  const redirectUri = `${redirectBase}/api/auth/oauth/github/callback`
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri })
    })
    const tokenData = await tokenRes.json()
    const uRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'virtuversity' } })
    const userInfo = await uRes.json()
    let email = ''
    const eRes = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'virtuversity', 'Accept': 'application/vnd.github+json' } })
    const emails = await eRes.json()
    const primary = Array.isArray(emails) ? emails.find(x => x.primary && x.verified) : null
    email = primary?.email || userInfo.email || ''
    if (!email) return res.redirect((process.env.CLIENT_ORIGIN || '/') + '/#auth')
    let user = getUserByEmail(email)
    if (!user) {
      const { v4: uuidv4 } = await import('uuid')
      user = { id: uuidv4(), email, password: '', role }
      addUser(user)
    }
    const token = signToken({ id: user.id, role: user.role })
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' })
    const target = user.role === 'teacher' ? '/#teacher' : '/#courses'
    res.redirect((process.env.CLIENT_ORIGIN || '/') + target)
  } catch {
    res.redirect((process.env.CLIENT_ORIGIN || '/') + '/#auth')
  }
})

export default router
