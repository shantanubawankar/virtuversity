import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { seedSampleVideo } from '../data/store.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

seedSampleVideo()

router.get('/stream/:id', (req, res) => {
  const id = req.params.id
  const file = path.join(__dirname, `../../videos/${id}.mp4`)
  if (!fs.existsSync(file)) return res.status(404).end()
  const stat = fs.statSync(file)
  const range = req.headers.range
  if (!range) {
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Type', 'video/mp4')
    fs.createReadStream(file).pipe(res)
    return
  }
  const parts = range.replace(/bytes=/, '').split('-')
  const start = parseInt(parts[0], 10)
  const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
  const chunk = (end - start) + 1
  const stream = fs.createReadStream(file, { start, end })
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunk,
    'Content-Type': 'video/mp4'
  })
  stream.pipe(res)
})

export default router
