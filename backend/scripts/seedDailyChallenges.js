import dotenv from 'dotenv'
import connectDB from '../config/database.js'
import { ensureTodaysChallenge } from '../controllers/gamificationController.js'
import DailyChallenge from '../models/DailyChallenge.js'

dotenv.config()

const DAYS = parseInt(process.argv[2] || '30', 10)

const seed = async () => {
  await connectDB()
  console.log(`Seeding daily challenges for the next ${DAYS} days...`)

  let created = 0
  let skipped = 0
  for (let i = 0; i < DAYS; i++) {
    const target = new Date()
    target.setHours(0, 0, 0, 0)
    target.setDate(target.getDate() + i)

    const existing = await DailyChallenge.findOne({ date: target })
    if (existing) {
      skipped++
      continue
    }

    if (i === 0) {
      const result = await ensureTodaysChallenge()
      if (result) created++
    }
  }

  console.log(`✅ Seed complete. Created: ${created}, Skipped: ${skipped}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
