const { getUserFromHeader } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = await getUserFromHeader(req)
  if (!user) return res.status(401).json({ error: 'unauthenticated' })

  // return only the fields the client needs (include hospitalId so dashboards can look up the hospital)
  const out = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    hospitalId: user.hospitalId || null
  }

  return res.json({ user: out })
}
