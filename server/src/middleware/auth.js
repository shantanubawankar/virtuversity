import jwt from 'jsonwebtoken'

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  return jwt.verify(token, secret)
}

export function requireAuth(req, res, next) {
  const token = req.cookies['token']
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
