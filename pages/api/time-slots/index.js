const prisma = require('../../../lib/prisma')
const { getUserFromHeader } = require('../../../lib/auth')

function isoToDate(s) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { doctorId } = req.query
    const where = doctorId ? { where: { doctorId } } : {}
    const slots = await prisma.timeSlot.findMany(where)
    return res.json({ slots })
  }

  if (req.method === 'POST') {
    const user = await getUserFromHeader(req)
    if (!user) return res.status(401).json({ error: 'unauthenticated' })
    if (user.role !== 'DOCTOR') return res.status(403).json({ error: 'doctors only' })

    const { start, end } = req.body
    const startDate = isoToDate(start)
    const endDate = isoToDate(end)
    if (!startDate || !endDate) return res.status(400).json({ error: 'invalid ISO datetimes' })
    if (startDate >= endDate) return res.status(400).json({ error: 'start must be before end' })

    // get doctor's doctor record
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) return res.status(400).json({ error: 'doctor profile not found' })

    // check overlap
    const overlapping = await prisma.timeSlot.findFirst({
      where: {
        doctorId: doctor.id,
        AND: [
          { start: { lt: endDate } },
          { end: { gt: startDate } }
        ]
      }
    })
    if (overlapping) return res.status(400).json({ error: 'overlapping slot exists' })

    const slot = await prisma.timeSlot.create({ data: { doctorId: doctor.id, start: startDate, end: endDate } })
    await prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE_SLOT', payload: { slotId: slot.id } } })
    res.json({ slot })
  } else {
    res.status(405).end()
  }
}
