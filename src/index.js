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
    const totalMinutes = Math.floor(durationMs / 1000 / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    console.log(`⏳ Total time taken: ${hours}h ${minutes}m`)
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
