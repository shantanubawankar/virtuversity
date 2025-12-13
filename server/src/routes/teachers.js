import { Router } from 'express'
import { getUserById } from '../data/store.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '../../data.json')

function read() {
  if (!fs.existsSync(dbPath)) return { users: [], courses: [], videos: [] }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}
function write(db) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)) }

router.get('/:id/profile', (req, res) => {
  const { id } = req.params
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  const db = read()
  const entry = db.users.find(u => u.id === id) || {}
  res.json({ profile: entry.profile || null })
})

router.get('/:id/pricing', (req, res) => {
  const { id } = req.params
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  const db = read()
  const entry = db.users.find(u => u.id === id) || {}
  res.json({ pricing: entry.pricing || null })
})

router.post('/:id/pricing', (req, res) => {
  const { id } = req.params
  const { model, price } = req.body
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  const db = read()
  const idx = db.users.findIndex(u => u.id === id)
  db.users[idx].pricing = { model, price }
  write(db)
  res.json({ pricing: db.users[idx].pricing })
})

router.post('/:id/profile', (req, res) => {
  const { id } = req.params
  const { name, bio, upi, bank } = req.body
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  const db = read()
  const idx = db.users.findIndex(u => u.id === id)
  db.users[idx].profile = { name, bio, payout: { upi, bank } }
  write(db)
  res.json({ profile: db.users[idx].profile })
})

router.get('/:id/videos', (req, res) => {
  const { id } = req.params
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  const db = read()
  const list = (db.videos || []).filter(v => v.teacherId === id)
  res.json({ videos: list })
})

router.post('/:id/videos', (req, res) => {
  const { id } = req.params
  const { title, url, courseId, price = 0 } = req.body
  const user = getUserById(id)
  if (!user || user.role !== 'teacher') return res.status(404).json({ error: 'Teacher not found' })
  if (!title || !url || !courseId) return res.status(400).json({ error: 'Missing fields' })
  const db = read()
  const vid = { id: 'video_' + Date.now(), title, url, courseId, price, teacherId: id }
  db.videos = db.videos || []
  db.videos.push(vid)
  write(db)
  res.json({ video: vid })
})

export default router
