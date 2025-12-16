import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '../../data.json')

function read() {
  if (!fs.existsSync(dbPath)) return { users: [], courses: [], videos: [] }
  const raw = fs.readFileSync(dbPath, 'utf-8')
  return JSON.parse(raw || '{}')
}

function write(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

export function getUserByEmail(email) {
  const db = read()
  return db.users.find(u => u.email === email)
}

export function addUser(user) {
  const db = read()
  db.users.push(user)
  write(db)
}

export function getUserById(id) {
  const db = read()
  return db.users.find(u => u.id === id)
}

export function seedSampleVideo() {
  const db = read()
  const exists = db.videos.find(v => v.id === 'sample')
  if (!exists) {
    db.videos.push({ id: 'sample', title: 'Sample', file: path.join(__dirname, '../../videos/sample.mp4') })
    write(db)
  }
}
