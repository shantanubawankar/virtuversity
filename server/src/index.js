import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRouter from './routes/auth.js'
import videosRouter from './routes/videos.js'
import paymentsRouter from './routes/payments.js'
import emailsRouter from './routes/emails.js'
import certificatesRouter from './routes/certificates.js'
import teachersRouter from './routes/teachers.js'

dotenv.config()
const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:8080'
app.use(cors({ origin: clientOrigin, credentials: true }))
app.set('trust proxy', 1)
app.use((req, res, next) => {
  const host = req.headers.host || ''
  if (host.startsWith('www.')) {
    const target = `https://${host.replace(/^www\./, '')}${req.originalUrl}`
    return res.redirect(301, target)
  }
  next()
})
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, '../../client'), { extensions: ['html'] }))

app.use('/api/auth', authRouter)
app.use('/api/videos', videosRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/emails', emailsRouter)
app.use('/api/certificates', certificatesRouter)
app.use('/api/teachers', teachersRouter)

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../../client/index.html')))
app.get(
  [
    '/dashboard',
    '/courses',
    '/teachers',
    '/my-courses',
    '/video',
    '/payments',
    '/login',
    '/profile'
  ],
  (req, res) => res.sendFile(path.join(__dirname, '../../client/index.html'))
)
app.get('/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 8080
app.listen(port, () => {})
