import { serve } from 'bun'
import { generateVideoWorkflow } from './workflows/generateVideo.js'
import 'dotenv/config'

const PORT = process.env.PORT || 7426

// Run workflow once when server starts
async function runWorkflowWithTiming() {
  const startTime = new Date()
  console.log(`⏱️ Workflow started at: ${startTime.toLocaleString()}`)

  try {
    await generateVideoWorkflow()
    const endTime = new Date()
    console.log(`✅ Workflow completed at: ${endTime.toLocaleString()}`)

    const durationMs = endTime - startTime
    const totalSeconds = Math.floor(durationMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    let timeString = ''
    if (hours > 0) timeString += `${hours}h `
    if (minutes > 0 || hours > 0) timeString += `${minutes}m `
    timeString += `${seconds}s`

    console.log(`⏳ Total time taken: ${timeString}`)
  } catch (err) {
    console.error('❌ Workflow failed:', err)
  }
}

// Run workflow once on server start
runWorkflowWithTiming()

serve({
  port: PORT,
  hostname: '0.0.0.0',
  idleTimeout: 0,
  async fetch(req) {
    if (new URL(req.url).pathname === '/') {
      return new Response('✅ Video workflow already ran on server start!')
    }
    return new Response('🚀 Bot is running. Visit /generate to start.', {
      headers: { 'Content-Type': 'text/plain' },
    })
  },
})

console.log(`🌐 Server running on http://localhost:${PORT}`)
