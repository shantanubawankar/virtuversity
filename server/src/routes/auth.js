import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { addUser, getUserByEmail, getUserById } from '../data/store.js'
import { signToken, verifyToken, requireAuth } from '../middleware/auth.js'
import { updateUser } from '../data/store.js'

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
  res.json({ message: 'Registered', user: { id: user.id, email, role: user.role }, token })
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
  res.json({ message: 'Logged in', user: { id: user.id, email: user.email, role: user.role }, token })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ message: 'Logged out' })
})

router.get('/me', (req, res) => {
  try {
    const bearer = (req.headers['authorization'] || '').split(' ')[1]
    const token = req.cookies['token'] || bearer
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = verifyToken(token)
    const user = getUserById(payload.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user: { id: user.id, email: user.email, role: user.role } })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

router.put('/me', requireAuth, (req, res) => {
  const allowed = ['name', 'phone', 'education', 'interests', 'bio', 'expertise', 'availability', 'pricing', 'location', 'timezone', 'portfolioUrl', 'social']
  const patch = {}
  for (const k of allowed) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) {
      patch[k] = req.body[k]
    }
  }
  const updated = updateUser(req.user.id, patch)
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name, phone: updated.phone, education: updated.education, interests: updated.interests, bio: updated.bio, expertise: updated.expertise, availability: updated.availability, pricing: updated.pricing, location: updated.location, timezone: updated.timezone, portfolioUrl: updated.portfolioUrl, social: updated.social } })
})

export default router
