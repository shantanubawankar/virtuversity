import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '../../data.json')

function read() {
  if (!fs.existsSync(dbPath)) return { users: [], courses: [], videos: [], enrollments: [] }
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

export function updateUser(id, patch) {
  const db = read()
  const idx = (db.users || []).findIndex(u => u.id === id)
  if (idx === -1) return null
  db.users[idx] = { ...db.users[idx], ...patch }
  write(db)
  return db.users[idx]
}

export function seedSampleVideo() {
  const db = read()
  const exists = db.videos.find(v => v.id === 'sample')
  if (!exists) {
    db.videos.push({ id: 'sample', title: 'Sample', file: path.join(__dirname, '../../videos/sample.mp4') })
    write(db)
  }
}

export function getCourses() {
  const db = read()
  return db.courses || []
}

export function getCourseById(id) {
  const db = read()
  return (db.courses || []).find(c => c.id === id)
}

export function addCourse(course) {
  const db = read()
  db.courses = db.courses || []
  db.courses.push(course)
  write(db)
}

export function getTeachers() {
  const db = read()
  return (db.users || []).filter(u => u.role === 'teacher')
}

export function seedSampleCourse() {
  const db = read()
  db.courses = db.courses || []
  const exists = db.courses.find(c => c.id === 'intro')
  if (!exists) {
    db.courses.push({
      id: 'intro',
      title: 'Introduction to Micro-learning',
      description: 'Short, focused lessons to accelerate your skills.',
      teacherId: 'teacher-sample'
    })
    const hasTeacher = (db.users || []).find(u => u.id === 'teacher-sample')
    if (!hasTeacher) {
      db.users.push({ id: 'teacher-sample', email: 'teacher@example.com', role: 'teacher', pricing: { model: 'subscription', price: 299 } })
    }
    write(db)
  }
}

export function addEnrollment(userId, courseId) {
  const db = read()
  db.enrollments = db.enrollments || []
  const exists = db.enrollments.find(e => e.userId === userId && e.courseId === courseId)
  if (!exists) {
    db.enrollments.push({ userId, courseId, at: Date.now() })
    write(db)
  }
  return { userId, courseId }
}

export function getEnrollmentsByUser(userId) {
  const db = read()
  db.enrollments = db.enrollments || []
  return db.enrollments.filter(e => e.userId === userId)
}
