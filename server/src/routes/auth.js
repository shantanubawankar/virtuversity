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
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const user = getUserById(payload.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user: { id: user.id, email: user.email, role: user.role } })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

export default router
