const prisma = require('../../../lib/prisma')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: true
      }
    })
    return res.json({ doctors })
  }
  res.status(405).end()
}
