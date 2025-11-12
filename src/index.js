import { serve } from 'bun'
import { generateVideoWorkflow } from './workflows/generateVideo.js'
import 'dotenv/config'

const PORT = process.env.PORT || 3010

serve({
  port: PORT,
  hostname: '0.0.0.0',
  idleTimeout: 0,
  async fetch(req) {
    if (new URL(req.url).pathname === '/') {
      await generateVideoWorkflow()
      return new Response('✅ Video workflow done!')
    }
    return new Response('🚀 Bot is running. Visit /generate to start.', {
      headers: { 'Content-Type': 'text/plain' },
    })
  },
})

console.log(`🌐 Server running on http://localhost:${PORT}`)
