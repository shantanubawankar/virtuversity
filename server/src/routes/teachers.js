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

export default router
